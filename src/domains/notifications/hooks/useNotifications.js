/**
 * useNotifications Hook
 * 
 * A custom React hook for managing notifications state and actions.
 * Provides loading, pagination, mark as read, and delete functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Hook for managing notifications
 * @param {Object} options - Configuration options
 * @param {string} options.userId - Current user ID
 * @param {string} options.restaurantId - Current restaurant ID
 * @param {number} options.pageSize - Number of notifications per page (default: 20)
 * @param {boolean} options.autoLoad - Whether to load notifications on mount (default: true)
 * @returns {Object} Notifications state and actions
 */
export default function useNotifications({
  userId,
  restaurantId,
  pageSize = DEFAULT_PAGE_SIZE,
  autoLoad = true,
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Load notifications from the database
   */
  const loadNotifications = useCallback(async (pageNum = 0, append = false) => {
    if (!userId || !restaurantId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (fetchError) throw fetchError;

      const newNotifications = data || [];
      
      if (append && pageNum > 0) {
        setNotifications((prev) => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setHasMore(newNotifications.length === pageSize);
      setPage(pageNum);

      // Calculate unread count
      if (pageNum === 0) {
        // For first page, count unread from fetched data
        const unread = newNotifications.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('[useNotifications] Error loading notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, restaurantId, pageSize]);

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, loadNotifications]);

  /**
   * Refresh notifications (reload from beginning)
   */
  const refresh = useCallback(() => {
    setPage(0);
    loadNotifications(0, false);
  }, [loadNotifications]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return { success: true };
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      toast.error('Failed to mark notification as read');
      return { success: false, error: err };
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.success('All notifications already read');
        return { success: true, count: 0 };
      }

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      toast.success(`Marked ${unreadIds.length} notifications as read`);
      return { success: true, count: unreadIds.length };
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      toast.error('Failed to mark all as read');
      return { success: false, error: err };
    }
  }, [notifications]);

  /**
   * Delete a single notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find((n) => n.id === notificationId);
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return { success: true };
    } catch (err) {
      console.error('[useNotifications] Error deleting notification:', err);
      toast.error('Failed to delete notification');
      return { success: false, error: err };
    }
  }, [notifications]);

  /**
   * Clear all read notifications
   */
  const clearRead = useCallback(async () => {
    try {
      const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);

      if (readIds.length === 0) {
        toast.success('No read notifications to clear');
        return { success: true, count: 0 };
      }

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds);

      if (deleteError) throw deleteError;

      // Update local state
      setNotifications((prev) => prev.filter((n) => !n.is_read));

      toast.success(`Cleared ${readIds.length} notifications`);
      return { success: true, count: readIds.length };
    } catch (err) {
      console.error('[useNotifications] Error clearing read notifications:', err);
      toast.error('Failed to clear notifications');
      return { success: false, error: err };
    }
  }, [notifications]);

  /**
   * Add a notification to local state (used by realtime subscription)
   */
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  /**
   * Update a notification in local state (used by realtime subscription)
   */
  const updateNotification = useCallback((notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? notification : n))
    );
  }, []);

  // Auto-load notifications on mount
  useEffect(() => {
    if (autoLoad && userId && restaurantId) {
      loadNotifications(0, false);
    }
  }, [autoLoad, userId, restaurantId, loadNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    page,

    // Actions
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,

    // For realtime integration
    addNotification,
    updateNotification,
  };
}
