/**
 * Menu Mutations - React Query
 * Service layer for menu-related operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Create a new menu item
 */
export const useCreateMenuItem = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([
          {
            ...itemData,
            is_available: itemData.is_available ?? true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success(`${data.name} added to menu`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create menu item');
      options.onError?.(error);
    },
  });
};

/**
 * Update a menu item
 */
export const useUpdateMenuItem = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-item', data.id] });
      toast.success(`${data.name} updated`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update menu item');
      options.onError?.(error);
    },
  });
};

/**
 * Toggle menu item availability
 */
export const useToggleMenuItemAvailability = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isAvailable }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      const status = data.is_available ? 'available' : 'unavailable';
      toast.success(`${data.name} marked as ${status}`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update availability');
      options.onError?.(error);
    },
  });
};

/**
 * Delete a menu item
 */
export const useDeleteMenuItem = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);

      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Menu item deleted');
      options.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete menu item');
      options.onError?.(error);
    },
  });
};

/**
 * Create a menu category
 */
export const useCreateMenuCategory = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData) => {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert([
          {
            ...categoryData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success(`${data.name} category created`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category');
      options.onError?.(error);
    },
  });
};

/**
 * Update a menu category
 */
export const useUpdateMenuCategory = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, updates }) => {
      const { data, error } = await supabase
        .from('menu_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success(`${data.name} category updated`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update category');
      options.onError?.(error);
    },
  });
};

/**
 * Delete a menu category
 */
export const useDeleteMenuCategory = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId) => {
      // First check if category has items
      const { count } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count > 0) {
        throw new Error('Cannot delete category with menu items. Move or delete items first.');
      }

      const { error } = await supabase.from('menu_categories').delete().eq('id', categoryId);

      if (error) throw error;
      return categoryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Category deleted');
      options.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category');
      options.onError?.(error);
    },
  });
};

/**
 * Bulk update menu item prices
 */
export const useBulkUpdatePrices = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }) => {
      // Process updates sequentially to avoid conflicts
      const results = [];
      for (const update of updates) {
        const { data, error } = await supabase
          .from('menu_items')
          .update({
            price: update.price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id)
          .select()
          .single();

        if (error) throw error;
        results.push(data);
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(`${data.length} item prices updated`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update prices');
      options.onError?.(error);
    },
  });
};

export default {
  useCreateMenuItem,
  useUpdateMenuItem,
  useToggleMenuItemAvailability,
  useDeleteMenuItem,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useBulkUpdatePrices,
};
