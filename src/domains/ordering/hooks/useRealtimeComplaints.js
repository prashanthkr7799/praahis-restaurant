/**
 * useRealtimeComplaints Hook
 * Subscribe to real-time complaint updates from Supabase
 * Shows toast notifications for new complaints and updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook to subscribe to real-time complaint updates
 * @param {string} restaurantId - Restaurant ID to filter complaints
 * @param {object} options - Configuration options
 * @returns {object} { complaints, loading, error, refresh }
 */
const useRealtimeComplaints = (restaurantId, options = {}) => {
  const {
    filter = {},
    autoRefresh = true,
    showNotifications = true,
    orderBy = { column: 'created_at', ascending: false },
    notifyWaiter = false,
    waiterId = null,
  } = options;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial complaints
  const fetchComplaints = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('complaints')
        .select(`
          *,
          orders!inner(order_number, customer_name, total, table_number),
          tables(table_number),
          reporter:reported_by(name, email),
          resolver:resolved_by(name, email)
        `)
        .eq('restaurant_id', restaurantId);

      // Apply filters
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority);
      }
      if (filter.issueType) {
        query = query.eq('issue_type', filter.issueType);
      }
      if (filter.orderId) {
        query = query.eq('order_id', filter.orderId);
      }

      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setComplaints(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (showNotifications) {
        toast.error('Failed to load complaints');
      }
    } finally {
      setLoading(false);
    }
  }, [
    restaurantId,
    filter.status,
    filter.priority,
    filter.issueType,
    filter.orderId,
    orderBy.column,
    orderBy.ascending,
    showNotifications,
  ]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!restaurantId) return;

    // Initial fetch
    fetchComplaints();

    if (!autoRefresh) return;

    // Subscribe to changes
    const subscription = supabase
      .channel(`complaints_${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // New complaint - fetch with joined data
            const { data: newComplaint } = await supabase
              .from('complaints')
              .select(`
                *,
                orders(order_number, customer_name, total, table_number),
                tables(table_number),
                reporter:reported_by(name, email)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newComplaint) {
              setComplaints((prev) => [newComplaint, ...prev]);

              // Show notification
              if (showNotifications) {
                const issueType = newComplaint.issue_type?.replace('_', ' ').toUpperCase() || 'ISSUE';
                const tableInfo = newComplaint.orders?.table_number 
                  ? `Table ${newComplaint.orders.table_number}`
                  : newComplaint.orders?.order_number || 'Order';

                toast.error(
                  `🚨 New ${issueType} complaint from ${tableInfo}`,
                  {
                    duration: 8000,
                    style: {
                      background: '#FEE2E2',
                      color: '#991B1B',
                      fontWeight: 'bold',
                    },
                  }
                );

                // Play notification sound (if available)
                try {
                  const audio = new Audio('/notification.mp3');
                  audio.volume = 0.5;
                  audio.play().catch(() => {}); // Ignore errors
                } catch {
                  // Ignore audio errors
                }
              }

              // Special notification for waiter if assigned
              if (notifyWaiter && waiterId && newComplaint.orders?.table_id) {
                toast(
                  `⚠️ Complaint at your table: ${newComplaint.description.substring(0, 50)}...`,
                  {
                    icon: '📋',
                    duration: 10000,
                    style: {
                      background: '#FEF3C7',
                      color: '#92400E',
                    },
                  }
                );
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Updated complaint
            const { data: updatedComplaint } = await supabase
              .from('complaints')
              .select(`
                *,
                orders(order_number, customer_name, total, table_number),
                tables(table_number),
                reporter:reported_by(name, email),
                resolver:resolved_by(name, email)
              `)
              .eq('id', payload.new.id)
              .single();

            if (updatedComplaint) {
              setComplaints((prev) =>
                prev.map((complaint) =>
                  complaint.id === updatedComplaint.id ? updatedComplaint : complaint
                )
              );

              // Notify on status change
              if (showNotifications && payload.old.status !== updatedComplaint.status) {
                const statusEmoji = {
                  open: '📭',
                  in_progress: '⏳',
                  resolved: '✅',
                  closed: '🔒',
                }[updatedComplaint.status] || '📝';

                toast(
                  `${statusEmoji} Complaint status: ${updatedComplaint.status.replace('_', ' ').toUpperCase()}`,
                  {
                    icon: statusEmoji,
                    duration: 4000,
                  }
                );
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Deleted complaint
            const deletedId = payload.old.id;
            setComplaints((prev) => prev.filter((complaint) => complaint.id !== deletedId));

            if (showNotifications) {
              toast('Complaint removed', { icon: '🗑️' });
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
    fetchComplaints,
    autoRefresh,
    showNotifications,
    notifyWaiter,
    waiterId,
  ]);

  // Manual refresh function
  const refresh = () => {
    fetchComplaints();
  };

  return {
    complaints,
    loading,
    error,
    refresh,
  };
};

export default useRealtimeComplaints;
