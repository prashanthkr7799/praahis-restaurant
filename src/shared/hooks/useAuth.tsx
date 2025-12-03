/**
 * useAuth Hook - TypeScript Version
 * Type-safe authentication hook with comprehensive auth state management
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@config/supabase';
import { useAuthStore } from '@shared/stores/authStore';
import type { User, UserRole, LoginCredentials, AuthSession } from '@/types';

// ============================================
// Types
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

interface UseAuthReturn extends AuthState, AuthActions {
  role: UserRole | null;
  isOwner: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// ============================================
// Permission Definitions
// ============================================

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: ['view:menu', 'create:order', 'view:order'],
  waiter: ['view:menu', 'view:orders', 'update:order', 'view:tables', 'update:table'],
  chef: ['view:orders', 'update:order'],
  manager: [
    'view:menu',
    'create:menu',
    'update:menu',
    'delete:menu',
    'view:orders',
    'update:order',
    'view:tables',
    'create:table',
    'update:table',
    'delete:table',
    'view:staff',
    'create:staff',
    'update:staff',
    'delete:staff',
    'view:analytics',
    'view:payments',
    'manage:settings',
  ],
  admin: ['*'], // All permissions
  owner: ['*'], // All permissions + platform management
};

// ============================================
// Hook Implementation
// ============================================

export function useAuth(): UseAuthReturn {
  const store = useAuthStore();
  const [localLoading, setLocalLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await store.initialize();
      } finally {
        setLocalLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await store.initialize();
      } else if (event === 'SIGNED_OUT') {
        store.reset();
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed, no action needed
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in handler
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        store.setError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        await store.initialize();
        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      store.setError(message);
      return { success: false, error: message };
    } finally {
      store.setLoading(false);
    }
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    store.setLoading(true);

    try {
      await supabase.auth.signOut();
      store.reset();

      // Clear all storage
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      store.setLoading(false);
    }
  }, []);

  // Reset password handler
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      return { success: false, error: message };
    }
  }, []);

  // Update password handler
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      return { success: false, error: message };
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        await signOut();
      }
    } catch (err) {
      console.error('Session refresh error:', err);
    }
  }, [signOut]);

  // Check if user has specific role
  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!store.role) return false;

      if (Array.isArray(role)) {
        return role.includes(store.role);
      }

      return store.role === role;
    },
    [store.role]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string) => {
      if (!store.role) return false;

      const permissions = ROLE_PERMISSIONS[store.role] || [];

      // Wildcard permission (admin/owner)
      if (permissions.includes('*')) return true;

      // Check specific permission
      return permissions.includes(permission);
    },
    [store.role]
  );

  return {
    // State
    user: store.profile as User | null,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading || localLoading,
    error: store.error,
    role: store.role as UserRole | null,
    isOwner: store.isOwner,

    // Actions
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    hasRole,
    hasPermission,
  };
}

export default useAuth;
