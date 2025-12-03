/**
 * React Query Hooks for Orders
 * Provides caching and optimistic updates for order operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@config/queryClient';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  applyDiscount,
} from '@config/supabase';

/**
 * Hook to fetch orders for a restaurant
 */
export const useOrders = (restaurantId, filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(restaurantId, filters),
    queryFn: () => getOrders(restaurantId, filters),
    enabled: !!restaurantId,
    staleTime: 10 * 1000, // Orders refresh more frequently (10s)
    ...options,
  });
};

/**
 * Hook to fetch a single order
 */
export const useOrder = (orderId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
    ...options,
  });
};

/**
 * Hook to create a new order
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData) => createOrder(orderData),
    onSuccess: () => {
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Also invalidate tables since order creation affects table status
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
};

/**
 * Hook to update an order
 */
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updates }) => updateOrder(orderId, updates),
    onSuccess: (updatedOrder, { orderId }) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(orderId), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
};

/**
 * Hook to update order status (optimistic update)
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    // Optimistic update
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(orderId) });

      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(orderId));

      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(orderId), {
          ...previousOrder,
          order_status: status,
          status: status,
        });
      }

      return { previousOrder };
    },
    onError: (err, { orderId }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(orderId), context.previousOrder);
      }
    },
    onSettled: () => {
      // Refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
};

/**
 * Hook to cancel an order
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, cancellationData }) => cancelOrder(orderId, cancellationData),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
};

/**
 * Hook to apply discount to an order
 */
export const useApplyDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, discountData }) => applyDiscount(orderId, discountData),
    onSuccess: (updatedOrder, { orderId }) => {
      queryClient.setQueryData(queryKeys.orders.detail(orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
};
