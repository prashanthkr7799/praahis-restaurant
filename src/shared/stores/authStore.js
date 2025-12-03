/**
 * Auth Store - Zustand
 * Centralized authentication state management
 * Replaces scattered useState and localStorage patterns
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@config/supabase';

const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isOwner: false,
  role: null,
  restaurantId: null,
  error: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role || null,
          restaurantId: profile?.restaurant_id || null,
          isOwner: profile?.is_owner || false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      /**
       * Initialize auth state from Supabase session
       */
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            set({ ...initialState, isLoading: false });
            return;
          }

          const { data: profile } = await supabase
            .from('users')
            .select('id, full_name, email, role, restaurant_id, is_owner, is_active, avatar_url')
            .eq('id', session.user.id)
            .single();

          set({
            user: session.user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            role: profile?.role || null,
            restaurantId: profile?.restaurant_id || null,
            isOwner: profile?.is_owner || false,
          });
        } catch (error) {
          console.error('Auth store initialization error:', error);
          set({ ...initialState, isLoading: false, error: error.message });
        }
      },

      /**
       * Login user with email and password
       */
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const { data: profile } = await supabase
            .from('users')
            .select('id, full_name, email, role, restaurant_id, is_owner, is_active, avatar_url')
            .eq('id', data.user.id)
            .single();

          // Update last login
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);

          set({
            user: data.user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            role: profile?.role || null,
            restaurantId: profile?.restaurant_id || null,
            isOwner: profile?.is_owner || false,
          });

          return { success: true, profile };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      /**
       * Logout user and clear all auth state
       */
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        }

        // Clear all auth-related localStorage
        localStorage.removeItem('praahis_restaurant_ctx');
        localStorage.removeItem('is_owner_session');
        localStorage.removeItem('praahis_admin_session');

        set({ ...initialState, isLoading: false });
      },

      /**
       * Check if user has specific role
       */
      hasRole: (requiredRole) => {
        const { role } = get();
        if (!role) return false;

        const roleHierarchy = {
          owner: 4,
          manager: 3,
          chef: 2,
          waiter: 1,
          customer: 0,
        };

        return (roleHierarchy[role] || 0) >= (roleHierarchy[requiredRole] || 0);
      },

      /**
       * Check if user can access restaurant
       */
      canAccessRestaurant: (restaurantId) => {
        const { isOwner, restaurantId: userRestaurantId } = get();
        return isOwner || userRestaurantId === restaurantId;
      },

      // Reset store
      reset: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: 'praahis-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data
        user: state.user ? { id: state.user.id, email: state.user.email } : null,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        restaurantId: state.restaurantId,
        isOwner: state.isOwner,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useUserRole = () => useAuthStore((state) => state.role);
export const useRestaurantId = () => useAuthStore((state) => state.restaurantId);
export const useIsOwner = () => useAuthStore((state) => state.isOwner);

export default useAuthStore;
