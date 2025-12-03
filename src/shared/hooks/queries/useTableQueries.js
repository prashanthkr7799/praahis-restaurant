/**
 * React Query Hooks for Tables
 * Provides caching for table operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@config/queryClient';
import { getTables, getTable, markTableOccupied } from '@config/supabase';

/**
 * Hook to fetch all tables for a restaurant
 */
export const useTables = (restaurantId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.tables.list(restaurantId),
    queryFn: () => getTables(restaurantId),
    enabled: !!restaurantId,
    staleTime: 30 * 1000, // Tables are relatively stable
    ...options,
  });
};

/**
 * Hook to fetch a single table
 */
export const useTable = (tableIdOrNumber, restaurantSlug = null, options = {}) => {
  return useQuery({
    queryKey: queryKeys.tables.detail(tableIdOrNumber),
    queryFn: () => getTable(tableIdOrNumber, restaurantSlug),
    enabled: !!tableIdOrNumber,
    ...options,
  });
};

/**
 * Hook to mark a table as occupied
 */
export const useMarkTableOccupied = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableId) => markTableOccupied(tableId),
    onSuccess: (updatedTable, tableId) => {
      // Update the specific table in cache
      if (updatedTable) {
        queryClient.setQueryData(queryKeys.tables.detail(tableId), updatedTable);
      }
      // Invalidate tables list
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists() });
    },
  });
};
