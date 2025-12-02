/**
 * SuperAdmin Login Page
 * Dedicated login portal for platform administrators only
 * Staff members must use /login instead
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const navigate = useNavigate();

  // Check if superadmin is already logged in
  useEffect(() => {
    checkExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabaseOwner.auth.getSession();
      
      if (session?.user) {
        // Verify this is actually a superadmin
        const { data: profile } = await supabaseOwner
          .from('users')
          .select('is_owner, role')
          .eq('id', session.user.id)
          .single();

        const isOwner = !!(profile?.is_owner || String(profile?.role || '').toLowerCase() === 'owner');
        
        if (isOwner) {
          navigate('/superadmin/dashboard', { replace: true });
          return;
        } else {
          // Not a superadmin, sign them out
          await supabaseOwner.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setCheckingSession(false);
    }
  };

  const logLoginAttempt = async (userId, success, errorMessage = null) => {
    try {
      await supabaseOwner.from('auth_activity_logs').insert({
        user_id: userId,
        action: success ? 'superadmin_login_success' : 'superadmin_login_failed',
        ip_address: null,
        user_agent: navigator.userAgent,
        metadata: {
          portal: 'superadmin',
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Silently fail if audit logging isn't set up yet
      // This is non-critical - login should still work
      if (import.meta.env.DEV) {
        console.warn('[SuperAdmin] Audit logging failed (table may not exist):', error.message);
      }
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
      // Step 1: Authenticate with Supabase (Owner client)
      const { data: authData, error: authError } = await supabaseOwner.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      const userId = authData.user.id;

      // Step 2: Fetch user profile and verify owner status
      const { data: profile, error: profileError } = await supabaseOwner
        .from('users')
        .select('is_owner, role, is_active')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Step 3: Verify this is actually a superadmin/owner
      const isOwner = !!(profile.is_owner || String(profile.role || '').toLowerCase() === 'owner');
      
      if (!isOwner) {
        await supabaseOwner.auth.signOut();
        await logLoginAttempt(userId, false, 'Non-superadmin attempted superadmin portal');
        toast.error(
          'This portal is for SuperAdmin only. Staff members should use the main login portal.',
          { duration: 6000 }
        );
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        setLoading(false);
        return;
      }

      // Step 4: Check if account is active
      if (!profile.is_active) {
        await supabaseOwner.auth.signOut();
        await logLoginAttempt(userId, false, 'Account deactivated');
        toast.error('Your account is deactivated. Contact system administrator.');
        setLoading(false);
        return;
      }

      // Step 5: Update last login timestamp
      await supabaseOwner
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      // Step 6: Set owner session flag
      try {
        localStorage.setItem('is_owner_session', 'true');
      } catch (error) {
        console.error('Failed to set owner session flag:', error);
      }

      // Step 7: Log successful login
      await logLoginAttempt(userId, true);

      // Step 8: Show success message and redirect
      toast.success('Welcome, Super Admin!');
      
      setTimeout(() => {
        navigate('/superadmin/dashboard', { replace: true });
      }, 500);

    } catch (error) {
      console.error('SuperAdmin login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-muted-foreground font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted/50 p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 ring-4 ring-primary/10">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            SuperAdmin Portal
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Platform Administration Access
          </p>
        </div>

        {/* Login Card */}
        <div className="card-lift bg-gradient-to-br from-card via-card to-muted/10 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border/50">
          {/* Warning Banner */}
          <div className="bg-gradient-to-r from-warning/10 to-warning/5 border-2 border-warning/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10 ring-1 ring-warning/30 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-foreground mb-1.5">Restricted Access</p>
              <p className="text-muted-foreground leading-relaxed">
                This portal is for platform administrators only. 
                Restaurant staff should use the{' '}
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 underline font-semibold transition-smooth"
                >
                  main login portal
                </Link>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@praahis.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth p-1.5 hover:bg-muted rounded-lg"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password?type=superadmin"
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Admin Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm">
          <p className="mb-2 text-muted-foreground font-medium">Not a SuperAdmin?</p>
          <Link 
            to="/login" 
            className="text-foreground font-semibold hover:text-primary transition-smooth underline inline-flex items-center gap-1"
          >
            <span>Go to Staff Login Portal</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
