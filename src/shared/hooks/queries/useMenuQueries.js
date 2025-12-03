/**
 * React Query Hooks for Menu Items
 * Provides caching for menu operations
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@config/queryClient';
import { getMenuItems } from '@config/supabase';

/**
 * Hook to fetch menu items for a restaurant
 * Menu items are cached longer since they change infrequently
 */
export const useMenuItems = (restaurantId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.menu.list(restaurantId),
    queryFn: () => getMenuItems(restaurantId),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // Menu items stay fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache persists for 30 minutes
    ...options,
  });
};

/**
 * Hook to get menu items grouped by category
 */
export const useMenuItemsByCategory = (restaurantId, options = {}) => {
  const query = useMenuItems(restaurantId, options);

  const groupedData =
    query.data?.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {}) || {};

  return {
    ...query,
    data: groupedData,
    categories: Object.keys(groupedData).sort(),
  };
};
