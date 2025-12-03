/**
 * React Query Configuration
 * Centralized query client setup with sensible defaults
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds, won't refetch during this time
      staleTime: 30 * 1000,
      // Cache persists for 5 minutes after component unmounts
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default (can enable per-query)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * Query key factory for consistent cache key generation
 * Usage: queryKeys.orders.list(restaurantId)
 *        queryKeys.orders.detail(orderId)
 */
export const queryKeys = {
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (restaurantId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), restaurantId, filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (orderId: string) => [...queryKeys.orders.details(), orderId] as const,
  },

  // Tables
  tables: {
    all: ['tables'] as const,
    lists: () => [...queryKeys.tables.all, 'list'] as const,
    list: (restaurantId: string) => [...queryKeys.tables.lists(), restaurantId] as const,
    details: () => [...queryKeys.tables.all, 'detail'] as const,
    detail: (tableId: string) => [...queryKeys.tables.details(), tableId] as const,
  },

  // Menu Items
  menu: {
    all: ['menu'] as const,
    lists: () => [...queryKeys.menu.all, 'list'] as const,
    list: (restaurantId: string) => [...queryKeys.menu.lists(), restaurantId] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (sessionId: string) => [...queryKeys.sessions.details(), sessionId] as const,
    cart: (sessionId: string) => [...queryKeys.sessions.all, 'cart', sessionId] as const,
  },

  // Restaurants
  restaurants: {
    all: ['restaurants'] as const,
    details: () => [...queryKeys.restaurants.all, 'detail'] as const,
    detail: (restaurantId: string) => [...queryKeys.restaurants.details(), restaurantId] as const,
  },

  // Complaints
  complaints: {
    all: ['complaints'] as const,
    lists: () => [...queryKeys.complaints.all, 'list'] as const,
    list: (restaurantId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.complaints.lists(), restaurantId, filters] as const,
  },

  // Staff/Users
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    list: (restaurantId: string) => [...queryKeys.staff.lists(), restaurantId] as const,
  },
};

export default queryClient;
