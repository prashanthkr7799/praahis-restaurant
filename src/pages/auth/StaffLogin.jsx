/**
 * Staff Login Page
 * Dedicated login portal for restaurant staff only (Manager, Chef, Waiter)
 * SuperAdmins/Owners must use /superadmin-login instead
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { supabase as supabaseManager } from '@shared/utils/api/supabaseClient';
import { signIn } from '@shared/utils/auth/auth';
import { ROLES } from '@shared/utils/permissions/permissions';
import { saveSession } from '@shared/utils/auth/session';
import { setRestaurantContext } from '@/lib/restaurantContextStore';
import { logger } from '@shared/utils/helpers/logger';

// Staff Login - Manager/Chef/Waiter only (uses manager client)
const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hydrateRestaurantContext = async (userId) => {
    try {
      const { data: profile } = await supabaseManager
        .from('users')
        .select('restaurant_id')
        .eq('id', userId)
        .maybeSingle();
      const restaurantId = profile?.restaurant_id || null;
      if (!restaurantId) return;
      const { data: rest } = await supabaseManager
        .from('restaurants')
        .select('id, name, slug, logo_url')
        .eq('id', restaurantId)
        .limit(1);
      const row = rest?.[0];
      const ctx = row
        ? { restaurantId: row.id, restaurantSlug: row.slug, restaurantName: row.name, branding: { logoUrl: row.logo_url || null } }
        : { restaurantId, restaurantSlug: null, restaurantName: null, branding: null };
      try { localStorage.setItem('praahis_restaurant_ctx', JSON.stringify(ctx)); } catch { /* ignore */ }
      setRestaurantContext(ctx);
    } catch (e) {
      logger.warn('Could not hydrate RestaurantContext:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);

    try {
      // Step 1: Authenticate with staff/manager client
      const { data, error } = await signIn(email, password);
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('Missing session user');

      // Step 2: Fetch user profile with owner check
      const { data: profile, error: profileError } = await supabaseManager
        .from('users')
        .select('role, is_active, restaurant_id, is_owner')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Step 3: Block owners from staff portal (NEW - Critical Security Check)
      if (profile?.is_owner || String(profile?.role || '').toLowerCase() === 'owner') {
        toast.error(
          'This portal is for restaurant staff only. SuperAdmins must use the admin portal.',
          { duration: 6000 }
        );
        await supabaseManager.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 4: Check if account is active
      if (!profile?.is_active) {
        toast.error('Your account has been deactivated. Please contact your manager.');
        await supabaseManager.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 5: Check for restaurant assignment
      const restaurantId = profile.restaurant_id || null;
      
      // Warn if no restaurant assigned (important for staff functionality)
      if (!restaurantId) {
        logger.warn('[StaffLogin] User has no restaurant_id assigned:', userId);
        toast.error('Your account is not assigned to a restaurant. Please contact your administrator.');
        await supabaseManager.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 5.5: Check if the restaurant is active and subscription is valid
      // CRITICAL - Block login if restaurant is deactivated OR subscription is expired/suspended
      // EXCEPTION: Managers can still login to access the payment page
      const { data: restaurant, error: restaurantError } = await supabaseManager
        .from('restaurants')
        .select(`
          id, 
          name, 
          is_active,
          subscriptions (
            id,
            status,
            current_period_end
          )
        `)
        .eq('id', restaurantId)
        .single();

      if (restaurantError || !restaurant) {
        console.error('[StaffLogin] Failed to fetch restaurant:', restaurantError);
        toast.error('Unable to verify restaurant status. Please contact support.');
        await supabaseManager.auth.signOut();
        setLoading(false);
        return;
      }

      const role = String(profile.role || '').toLowerCase();
      const isManager = role === ROLES.MANAGER || role === ROLES.ADMIN || role === 'manager' || role === 'admin';
      
      // Check subscription status
      const subscription = Array.isArray(restaurant.subscriptions) 
        ? restaurant.subscriptions[0] 
        : restaurant.subscriptions;
      
      let subscriptionExpiredOrSuspended = false;
      let subscriptionMessage = '';

      if (subscription) {
        const subStatus = subscription.status?.toLowerCase();
        
        // Check if subscription is suspended or cancelled
        if (subStatus === 'suspended' || subStatus === 'cancelled' || subStatus === 'expired') {
          subscriptionExpiredOrSuspended = true;
          subscriptionMessage = `Your restaurant subscription has been ${subStatus}.`;
        }

        // Check if subscription is expired (date-based)
        // BUT ONLY if status is NOT explicitly 'active' or 'trial'
        // This allows SuperAdmin to extend subscription and set status to active
        if (subscription.current_period_end && subStatus !== 'active' && subStatus !== 'trial') {
          const expiryDate = new Date(subscription.current_period_end);
          if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
            subscriptionExpiredOrSuspended = true;
            subscriptionMessage = `Your restaurant subscription expired on ${expiryDate.toLocaleDateString()}.`;
          }
        }
      }

      // Check if restaurant is deactivated
      if (!restaurant.is_active || subscriptionExpiredOrSuspended) {
        // MANAGERS can login but will be redirected to subscription page
        if (isManager) {
          // Store the subscription status in session for ProtectedRoute to check
          localStorage.setItem('praahis_subscription_status', JSON.stringify({
            expired: subscriptionExpiredOrSuspended,
            restaurantActive: restaurant.is_active,
            message: subscriptionMessage
          }));
          
          // Continue with login but show warning
          toast.error(
            subscriptionMessage + ' You will be redirected to the payment page.',
            { duration: 5000 }
          );
        } else {
          // Non-managers (Chef, Waiter) are blocked completely
          toast.error(
            subscriptionMessage + ' Please contact the manager to complete payment.',
            { duration: 6000 }
          );
          await supabaseManager.auth.signOut();
          setLoading(false);
          return;
        }
      } else {
        // Clear any stale subscription status
        localStorage.removeItem('praahis_subscription_status');
      }

      // Step 6: Persist session { userId, role, restaurantId }
      saveSession({ userId, role: profile.role, restaurantId });

      // Step 7: Hydrate restaurant context
      await hydrateRestaurantContext(userId);

  // Step 8: Wait for context to propagate (prevents race condition)
  // ProtectedRoute needs time to read the restaurant context before validation
  await new Promise(resolve => setTimeout(resolve, 500));

      // Step 9: Show success message
      toast.success('Login successful!');

      // Step 10: Role-based redirect to appropriate dashboard
      // If subscription is expired/suspended and user is manager, redirect to subscription page
      const subscriptionStatus = localStorage.getItem('praahis_subscription_status');
      if (subscriptionStatus && isManager) {
        navigate('/manager/subscription', { replace: true });
      } else if (isManager) {
        navigate('/manager/dashboard', { replace: true });
      } else if (role === ROLES.CHEF) {
        navigate('/chef', { replace: true });
      } else if (role === ROLES.WAITER) {
        navigate('/waiter', { replace: true });
      } else {
        // Fallback for unrecognized roles
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('[StaffLogin] Login error:', err);
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted/50 p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 ring-4 ring-primary/10">
              <img src="/logo.svg" alt="Brand Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
            Staff Login
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Manager / Chef / Waiter Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="card-lift bg-gradient-to-br from-card via-card to-muted/10 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                disabled={loading}
                className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Input with Toggle */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth p-1.5 hover:bg-muted rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 underline decoration-dotted transition-smooth font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Restaurant Staff Portal</p>
              <Link 
                className="text-sm text-primary hover:text-primary/80 font-medium transition-smooth inline-flex items-center gap-1" 
                to="/"
              >
                <span>← Back to Home</span>
              </Link>
            </div>
          </form>
        </div>

        {/* SuperAdmin Link */}
        <div className="text-center mt-6 text-sm">
          <p className="mb-2 text-muted-foreground font-medium">Are you a SuperAdmin?</p>
          <Link 
            to="/superadmin-login" 
            className="text-foreground font-semibold hover:text-primary transition-smooth underline inline-flex items-center gap-1"
          >
            <span>Go to Admin Portal</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
