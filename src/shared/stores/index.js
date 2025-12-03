/**
 * Zustand Stores - Central Export
 * All global state stores for the application
 */

export {
  useAuthStore,
  useUser,
  useProfile,
  useIsAuthenticated,
  useAuthLoading,
  useUserRole,
  useIsOwner,
} from './authStore';
export {
  useUIStore,
  useSidebarOpen,
  useSidebarCollapsed,
  useTheme,
  useGlobalLoading,
  useNotifications,
  useIsMobile,
} from './uiStore';
export {
  useRestaurantStore,
  useRestaurantId,
  useRestaurantName,
  useRestaurantSlug,
  useRestaurantBranding,
  useRestaurantLoading,
  useSubscription,
} from './restaurantStore';
