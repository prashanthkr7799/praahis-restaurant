/**
 * Restaurant Store - Zustand
 * Centralized restaurant context state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@config/supabase';

const initialState = {
  restaurantId: null,
  restaurantSlug: null,
  restaurantName: null,
  branding: null,
  settings: null,
  subscription: null,
  isLoading: true,
  error: null,
};

export const useRestaurantStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set restaurant context
       */
      setRestaurant: (restaurant) =>
        set({
          restaurantId: restaurant?.id || restaurant?.restaurantId || null,
          restaurantSlug: restaurant?.slug || restaurant?.restaurantSlug || null,
          restaurantName: restaurant?.name || restaurant?.restaurantName || null,
          branding: restaurant?.branding || {
            logoUrl: restaurant?.logo_url || null,
            primaryColor: restaurant?.primary_color || null,
            secondaryColor: restaurant?.secondary_color || null,
          },
          settings: restaurant?.settings || null,
          isLoading: false,
          error: null,
        }),

      /**
       * Fetch restaurant by ID
       */
      fetchById: async (restaurantId) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('restaurants')
            .select('id, name, slug, logo_url, primary_color, secondary_color, settings')
            .eq('id', restaurantId)
            .single();

          if (error) throw error;

          set({
            restaurantId: data.id,
            restaurantSlug: data.slug,
            restaurantName: data.name,
            branding: {
              logoUrl: data.logo_url,
              primaryColor: data.primary_color,
              secondaryColor: data.secondary_color,
            },
            settings: data.settings,
            isLoading: false,
          });

          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      /**
       * Fetch restaurant by slug (for customer-facing pages)
       */
      fetchBySlug: async (slug) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('restaurants')
            .select('id, name, slug, logo_url, primary_color, secondary_color, settings')
            .eq('slug', slug)
            .single();

          if (error) throw error;

          set({
            restaurantId: data.id,
            restaurantSlug: data.slug,
            restaurantName: data.name,
            branding: {
              logoUrl: data.logo_url,
              primaryColor: data.primary_color,
              secondaryColor: data.secondary_color,
            },
            settings: data.settings,
            isLoading: false,
          });

          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      /**
       * Fetch subscription status
       */
      fetchSubscription: async () => {
        const { restaurantId } = get();
        if (!restaurantId) return;

        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .single();

          if (!error) {
            set({ subscription: data });
          }

          return { success: !error, data, error };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      /**
       * Check if subscription is active
       */
      isSubscriptionActive: () => {
        const { subscription } = get();
        if (!subscription) return true; // Assume active if no subscription record

        const now = new Date();
        const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

        return subscription.status === 'active' && (!expiresAt || expiresAt > now);
      },

      /**
       * Clear restaurant context
       */
      clear: () => set({ ...initialState, isLoading: false }),

      /**
       * Get context for API calls
       */
      getContext: () => {
        const state = get();
        return {
          restaurantId: state.restaurantId,
          restaurantSlug: state.restaurantSlug,
          restaurantName: state.restaurantName,
          branding: state.branding,
        };
      },

      // Loading state
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'praahis-restaurant-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        restaurantId: state.restaurantId,
        restaurantSlug: state.restaurantSlug,
        restaurantName: state.restaurantName,
        branding: state.branding,
      }),
    }
  )
);

// Selector hooks
export const useRestaurantId = () => useRestaurantStore((state) => state.restaurantId);
export const useRestaurantName = () => useRestaurantStore((state) => state.restaurantName);
export const useRestaurantSlug = () => useRestaurantStore((state) => state.restaurantSlug);
export const useRestaurantBranding = () => useRestaurantStore((state) => state.branding);
export const useRestaurantLoading = () => useRestaurantStore((state) => state.isLoading);
export const useSubscription = () => useRestaurantStore((state) => state.subscription);

export default useRestaurantStore;
