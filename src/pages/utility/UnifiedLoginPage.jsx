import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Shield, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { supabase as supabaseManager } from '@shared/utils/api/supabaseClient';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { signIn } from '@shared/utils/auth/auth';
import { signInOwner } from '@shared/utils/auth/authOwner';
import { ROLES } from '@shared/utils/permissions/permissions';
import { saveSession } from '@shared/utils/auth/session';
import { setRestaurantContext } from '@/lib/restaurantContextStore';

// Unified Login with Admin/Manager toggle (uses separate Supabase clients)
const UnifiedLogin = () => {
  const [search] = useSearchParams();
  const initialMode = search.get('mode') === 'admin' ? 'admin' : 'manager';
  const [mode, setMode] = useState(initialMode); // 'admin' (owner) | 'manager'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const heading = useMemo(() => (mode === 'admin' ? 'Admin Login' : 'Manager Login'), [mode]);

  // Important: Do not auto-redirect from login even if a session exists.
  // This keeps the selection explicit, as requested.

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
      console.warn('Could not hydrate RestaurantContext:', e);
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
      if (mode === 'admin') {
        // Owner login via owner client
        const { data, error } = await signInOwner(email, password);
        if (error) throw error;
        const userId = data?.user?.id;
        if (!userId) throw new Error('Missing session user');
        const { data: profile, error: pErr } = await supabaseOwner
          .from('users')
          .select('is_owner, role')
          .eq('id', userId)
          .single();
        if (pErr) throw pErr;
        const isOwner = !!(profile?.is_owner || String(profile?.role || '').toLowerCase() === 'owner');
        if (!isOwner) {
          toast.error('Not authorized for Admin (Owner) portal');
          setLoading(false);
          return;
        }
        toast.success('Welcome, Super Admin');
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        // Manager/staff login via manager client
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        const userId = data?.user?.id;
        if (!userId) throw new Error('Missing session user');
        const { data: profile, error: profileError } = await supabaseManager
          .from('users')
          .select('role, is_active, restaurant_id')
          .eq('id', userId)
          .single();
        if (profileError) throw profileError;
        if (!profile?.is_active) {
          toast.error('Your account has been deactivated. Please contact admin.');
          await supabaseManager.auth.signOut();
          setLoading(false);
          return;
        }
        // Persist session { userId, role, restaurantId }
        const restaurantId = profile.restaurant_id || null;
        saveSession({ userId, role: profile.role, restaurantId });
        if (restaurantId) await hydrateRestaurantContext(userId);
        toast.success('Login successful!');
        const role = String(profile.role || '').toLowerCase();
        if (role === ROLES.MANAGER || role === ROLES.ADMIN) {
          navigate('/manager/dashboard', { replace: true });
        } else if (role === ROLES.CHEF) {
          navigate('/chef', { replace: true });
        } else if (role === ROLES.WAITER) {
          navigate('/waiter', { replace: true });
        } else if (role === 'owner') {
          navigate('/superadmin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      console.error('[login] error', err);
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onToggle = () => setMode((m) => (m === 'admin' ? 'manager' : 'admin'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6">
      <div className="uiverse-priyanshu">
        <div className="container">
          <div className="login-box">
            <form className="form" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="brand-row">
                  <div className="logo" aria-hidden="true"></div>
                  <div className="brand-badge">
                    <img src="/logo.svg" alt="Brand" className="brand-img" />
                  </div>
                </div>
                <div className="header">{heading}</div>
              </div>
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <div className="w-full">
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="button sign-in">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="small" compact />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
              <button type="button" onClick={onToggle} className="button">
                {mode === 'admin' ? (
                  <span className="inline-flex items-center gap-2"><UserCog className="h-4 w-4" />Switch to Manager</span>
                ) : (
                  <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Switch to Admin</span>
                )}
              </button>
              <div className="footer mt-1">
                <span>{mode === 'admin' ? 'Owner (Super Admin) portal' : 'Manager / Staff portal'}</span>
                <br />
                <Link className="link" to="/">Back to Home</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
