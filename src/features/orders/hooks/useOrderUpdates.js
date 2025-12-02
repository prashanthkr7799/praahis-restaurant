/**
 * useRealtimeOrderUpdates Hook
 * Enhanced real-time order monitoring with specific notifications for:
 * - Discount applications
 * - Refund processing
 * - Payment status changes
 * - Order cancellations (for chef/kitchen)
 * - Split payment updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Hook to subscribe to enhanced real-time order updates
 * @param {string} restaurantId - Restaurant ID to filter orders
 * @param {object} options - Configuration options
 * @returns {object} { orders, loading, error, refresh, lastUpdate }
 */
const useRealtimeOrderUpdates = (restaurantId, options = {}) => {
  const {
    filter = {},
    autoRefresh = true,
    showNotifications = true,
    notifyKitchen = false,  // Special notifications for chef/kitchen
    notifyManager = false,  // Special notifications for manager
    orderBy = { column: 'created_at', ascending: false },
  } = options;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*, order_payments(*), tables(table_number)')
        .eq('restaurant_id', restaurantId);

      // Apply filters
      if (filter.orderStatus) {
        query = query.eq('order_status', filter.orderStatus);
      }
      if (filter.paymentStatus) {
        query = query.eq('payment_status', filter.paymentStatus);
      }
      if (filter.tableId) {
        query = query.eq('table_id', filter.tableId);
      }
      if (filter.orderType) {
        query = query.eq('order_type', filter.orderType);
      }

      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOrders(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (showNotifications) {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [
    restaurantId,
    filter.orderStatus,
    filter.paymentStatus,
    filter.tableId,
    filter.orderType,
    orderBy.column,
    orderBy.ascending,
    showNotifications,
  ]);

  // Helper to detect specific changes
  const detectChanges = (oldOrder, newOrder) => {
    const changes = {
      discount: false,
      refund: false,
      payment: false,
      cancellation: false,
      splitPayment: false,
      status: false,
    };

    if (!oldOrder) return changes;

    // Discount applied
    if ((newOrder.discount_amount || 0) > (oldOrder.discount_amount || 0)) {
      changes.discount = true;
    }

    // Refund processed
    if ((newOrder.refund_amount || 0) > (oldOrder.refund_amount || 0)) {
      changes.refund = true;
    }

    // Payment status changed
    if (oldOrder.payment_status !== newOrder.payment_status) {
      changes.payment = true;
    }

    // Order cancelled
    if (oldOrder.order_status !== 'cancelled' && newOrder.order_status === 'cancelled') {
      changes.cancellation = true;
    }

    // Split payment added
    if (!oldOrder.payment_split_details && newOrder.payment_split_details) {
      changes.splitPayment = true;
    }

    // General status change
    if (oldOrder.order_status !== newOrder.order_status) {
      changes.status = true;
    }

    return changes;
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!restaurantId) return;

    // Initial fetch
    fetchOrders();

    if (!autoRefresh) return;

    // Subscribe to changes
    const subscription = supabase
      .channel(`orders_updates_${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          setLastUpdate(new Date());

          if (payload.eventType === 'INSERT') {
            // New order
            const { data: newOrder } = await supabase
              .from('orders')
              .select('*, order_payments(*), tables(table_number)')
              .eq('id', payload.new.id)
              .single();

            if (newOrder) {
              setOrders((prev) => [newOrder, ...prev]);

              if (showNotifications) {
                const tableInfo = newOrder.table_number || newOrder.tables?.table_number || 'N/A';
                toast.success(`🔔 New order from Table ${tableInfo}`, {
                  duration: 5000,
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Updated order
            const { data: updatedOrder } = await supabase
              .from('orders')
              .select('*, order_payments(*), tables(table_number)')
              .eq('id', payload.new.id)
              .single();

            if (updatedOrder) {
              // Detect what changed
              const changes = detectChanges(payload.old, updatedOrder);

              setOrders((prev) =>
                prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
              );

              // Show specific notifications
              if (showNotifications) {
                const orderNum = updatedOrder.order_number || updatedOrder.id.substring(0, 8);

                // Discount applied
                if (changes.discount && notifyManager) {
                  toast(
                    `💰 Discount applied to ${orderNum}: ₹${updatedOrder.discount_amount}`,
                    {
                      icon: '💸',
                      duration: 4000,
                      style: { background: '#DBEAFE', color: '#1E40AF' },
                    }
                  );
                }

                // Refund processed
                if (changes.refund) {
                  toast(
                    `💵 Refund processed for ${orderNum}: ₹${updatedOrder.refund_amount}`,
                    {
                      icon: '↩️',
                      duration: 6000,
                      style: { background: '#FEF3C7', color: '#92400E' },
                    }
                  );
                }

                // Payment status changed
                if (changes.payment && !changes.refund) {
                  const statusEmoji = {
                    paid: '✅',
                    pending: '⏳',
                    failed: '❌',
                    refunded: '💵',
                    partially_refunded: '↩️',
                  }[updatedOrder.payment_status] || '💳';

                  toast(`${statusEmoji} Payment: ${updatedOrder.payment_status.toUpperCase()}`, {
                    duration: 3000,
                  });
                }

                // Order cancelled - notify kitchen
                if (changes.cancellation) {
                  if (notifyKitchen) {
                    toast.error(
                      `🚫 Order ${orderNum} CANCELLED - Remove from queue`,
                      {
                        duration: 10000,
                        style: {
                          background: '#FEE2E2',
                          color: '#991B1B',
                          fontWeight: 'bold',
                          fontSize: '16px',
                        },
                      }
                    );

                    // Play alert sound for kitchen
                    try {
                      const audio = new Audio('/alert.mp3');
                      audio.volume = 0.7;
                      audio.play().catch(() => {});
                    } catch {
                      // Ignore audio errors
                    }
                  } else if (showNotifications) {
                    toast(`🚫 Order ${orderNum} cancelled`, {
                      icon: '❌',
                      duration: 5000,
                    });
                  }

                  // Show cancellation reason if available
                  if (updatedOrder.cancellation_reason) {
                    setTimeout(() => {
                      toast(
                        `Reason: ${updatedOrder.cancellation_reason}`,
                        {
                          icon: 'ℹ️',
                          duration: 5000,
                        }
                      );
                    }, 1000);
                  }
                }

                // Split payment added
                if (changes.splitPayment && notifyManager) {
                  const splitDetails = updatedOrder.payment_split_details;
                  toast(
                    `🔀 Split payment: Cash ₹${splitDetails.cash_amount} + Online ₹${splitDetails.online_amount}`,
                    {
                      icon: '💳',
                      duration: 4000,
                      style: { background: '#E0E7FF', color: '#3730A3' },
                    }
                  );
                }
              }
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
  }, [
    restaurantId,
    fetchOrders,
    autoRefresh,
    showNotifications,
    notifyKitchen,
    notifyManager,
  ]);

  // Manual refresh function
  const refresh = () => {
    fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    refresh,
    lastUpdate,
  };
};

export default useRealtimeOrderUpdates;
