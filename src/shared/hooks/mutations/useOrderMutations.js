/**
 * Order Mutations - React Query
 * Service layer for order-related operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Create a new order
 */
export const useCreateOrder = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            ...orderData,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Order created successfully');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create order');
      options.onError?.(error);
    },
  });
};

/**
 * Update order status
 */
export const useUpdateOrderStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, notes }) => {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add completion timestamp if applicable
      if (status === 'completed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }

      // Add cancellation notes if provided
      if (status === 'cancelled' && notes) {
        updateData.cancellation_notes = notes;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });

      const statusMessages = {
        confirmed: 'Order confirmed',
        preparing: 'Order is being prepared',
        ready: 'Order is ready',
        served: 'Order has been served',
        completed: 'Order completed',
        cancelled: 'Order cancelled',
      };

      toast.success(statusMessages[data.status] || 'Order updated');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update order');
      options.onError?.(error);
    },
  });
};

/**
 * Add items to existing order
 */
export const useAddOrderItems = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items }) => {
      const orderItems = items.map((item) => ({
        order_id: orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        special_instructions: item.specialInstructions || null,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        status: 'pending',
      }));

      const { data, error } = await supabase.from('order_items').insert(orderItems).select();

      if (error) throw error;

      // Update order total
      const { data: allItems } = await supabase
        .from('order_items')
        .select('total_price')
        .eq('order_id', orderId);

      const newTotal = allItems.reduce((sum, item) => sum + item.total_price, 0);

      await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      toast.success(`${data.length} item(s) added to order`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add items');
      options.onError?.(error);
    },
  });
};

/**
 * Update order item status
 */
export const useUpdateOrderItemStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }) => {
      const { data, error } = await supabase
        .from('order_items')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update item');
      options.onError?.(error);
    },
  });
};

/**
 * Cancel order
 */
export const useCancelOrder = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Order cancelled');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel order');
      options.onError?.(error);
    },
  });
};

/**
 * Delete order (admin only)
 */
export const useDeleteOrder = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      // First delete order items
      await supabase.from('order_items').delete().eq('order_id', orderId);

      // Then delete the order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);

      if (error) throw error;
      return orderId;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Order deleted');
      options.onSuccess?.(orderId);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete order');
      options.onError?.(error);
    },
  });
};

export default {
  useCreateOrder,
  useUpdateOrderStatus,
  useAddOrderItems,
  useUpdateOrderItemStatus,
  useCancelOrder,
  useDeleteOrder,
};
