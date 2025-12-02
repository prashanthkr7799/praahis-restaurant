/**
 * Authentication Utilities for Phase 2 Admin Portal
 * Uses Supabase Auth for secure user management
 */

import { supabase } from '@config/supabase';

/**
 * Sign up a new user (Admin only action via Edge Function)
 * This creates the auth user but does NOT insert into users table
 * The calling code should use admin_upsert_user_profile RPC after this
 */
export const signUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
          restaurant_id: userData.restaurant_id,
        },
      },
    });

    if (error) throw error;

    // NOTE: We no longer insert into users table here
    // The RPC function admin_upsert_user_profile will handle that
    // This prevents duplicate insert errors

    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
};

/**
 * Sign in existing user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login or create profile if missing
    if (data.user) {
      // Check if user profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('users')
        .select('id, restaurant_id')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (!profileCheckError && existingProfile) {
        // Profile exists, just update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      } else if (!existingProfile) {
        // Profile missing - try to create from auth metadata
        const metadata = data.user.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || email.split('@')[0];
        const role = metadata.role || 'manager';
        const restaurantId = metadata.restaurant_id || null;
        
        console.log('Creating missing profile for user:', data.user.id, { fullName, role, restaurantId });
        
        // Try direct insert (may fail due to RLS, but worth trying)
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: role,
            restaurant_id: restaurantId,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        if (insertError) {
          console.warn('Could not auto-create profile (may need manual fix):', insertError.message);
        } else {
          console.log('Auto-created missing user profile successfully');
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any localStorage
    localStorage.removeItem('adminAuth');
    // Clear restaurant context persistence
    localStorage.removeItem('praahis_restaurant_ctx');
  // Clear owner session flag if set
  try { localStorage.removeItem('is_owner_session'); } catch { /* ignore */ }
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

/**
 * Get current authenticated user with profile data
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, profile: null, error: authError };
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { user, profile: null, error: profileError };
    }

    if (!profile) {
      console.error('Profile not found for user:', user.id);
      return { user, profile: null, error: new Error('Profile not found') };
    }

    return { user, profile, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, profile: null, error };
  }
};

/**
 * Get current user session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const { session } = await getSession();
  return !!session;
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { data: null, error };
  }
};

/**
 * Reset password (send reset email)
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { data: null, error };
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = async (allowedRoles) => {
  const { profile } = await getCurrentUser();
  if (!profile) return false;
  return allowedRoles.includes(profile.role);
};

/**
 * Auth state listener
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

/**
 * Inactivity timeout manager for shared devices
 * Auto-logout after configurable period of inactivity
 */
export const createInactivityManager = (options = {}) => {
  const {
    timeoutMinutes = 30, // Default 30 minutes
    warningMinutes = 5, // Show warning 5 minutes before logout
    onWarning = () => {},
    onLogout = () => signOut(),
    events = ['mousedown', 'keydown', 'scroll', 'touchstart'],
  } = options;

  let timeoutId = null;
  let warningTimeoutId = null;
  let isActive = false;

  const resetTimer = () => {
    if (!isActive) return;
    
    // Clear existing timers
    if (timeoutId) clearTimeout(timeoutId);
    if (warningTimeoutId) clearTimeout(warningTimeoutId);

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningTimeoutId = setTimeout(() => {
      onWarning(warningMinutes);
    }, warningTime);

    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000;
    timeoutId = setTimeout(() => {
      onLogout();
    }, logoutTime);
  };

  const start = () => {
    if (isActive) return;
    isActive = true;
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();
  };

  const stop = () => {
    isActive = false;
    
    // Clear timers
    if (timeoutId) clearTimeout(timeoutId);
    if (warningTimeoutId) clearTimeout(warningTimeoutId);
    
    // Remove event listeners
    events.forEach(event => {
      window.removeEventListener(event, resetTimer);
    });
  };

  const extend = () => {
    resetTimer();
  };

  return { start, stop, extend };
};
