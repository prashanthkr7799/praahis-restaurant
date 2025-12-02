/**
 * useRealtimeOrders Hook
 * Subscribe to real-time order updates from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Hook to subscribe to real-time order updates
 * @param {object} options - Configuration options
 * @returns {object} { orders, loading, error, refresh }
 */
const useRealtimeOrders = (options = {}) => {
  const {
    filter = {},
    autoRefresh = true,
    showNotifications = true,
    orderBy = { column: 'created_at', ascending: false },
  } = options;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select('*');

      // Apply restaurant_id filter (REQUIRED for RLS policies)
      if (filter.restaurant_id) {
        query = query.eq('restaurant_id', filter.restaurant_id);
      } else {
        // If no restaurant_id, don't make the query - it will fail with 400 due to RLS
        console.warn('useRealtimeOrders: restaurant_id filter is required');
        setLoading(false);
        return;
      }

      // Apply filters
      if (filter.status) {
        query = query.eq('order_status', filter.status);
      }
      if (filter.tableId) {
        query = query.eq('table_id', filter.tableId);
      }
      if (filter.paymentStatus) {
        query = query.eq('payment_status', filter.paymentStatus);
      }

      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      if (showNotifications) {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [filter.restaurant_id, filter.status, filter.tableId, filter.paymentStatus, orderBy.column, orderBy.ascending, showNotifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Initial fetch
    fetchOrders();

    if (!autoRefresh) return;

    // Subscribe to changes
    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {

          if (payload.eventType === 'INSERT') {
            // New order
            const newOrder = payload.new;
            setOrders((prev) => [newOrder, ...prev]);

            if (showNotifications) {
              toast.success(`New order from Table ${newOrder.table_number || 'N/A'}`, {
                icon: '🔔',
                duration: 5000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Updated order
            const updatedOrder = payload.new;
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            );

            if (showNotifications && payload.old.order_status !== updatedOrder.order_status) {
              toast(`Order status updated to ${updatedOrder.order_status}`, {
                icon: '📦',
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Deleted order
            const deletedId = payload.old.id;
            setOrders((prev) => prev.filter((order) => order.id !== deletedId));

            if (showNotifications) {
              toast('Order removed', { icon: '🗑️' });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrders, autoRefresh, showNotifications]);

  // Manual refresh function
  const refresh = () => {
    fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    refresh,
  };
};

export default useRealtimeOrders;
