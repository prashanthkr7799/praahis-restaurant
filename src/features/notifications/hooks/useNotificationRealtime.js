/**
 * useNotificationRealtime Hook
 * 
 * A custom React hook for subscribing to real-time notification updates.
 * Uses Supabase Realtime to listen for new, updated, and deleted notifications.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@config/supabase';
import { logger } from '@shared/utils/logger';
import notificationService from '../utils/notificationService';

/**
 * Hook for real-time notification updates
 * @param {Object} options - Configuration options
 * @param {string} options.userId - Current user ID
 * @param {string} options.restaurantId - Current restaurant ID
 * @param {Function} options.onInsert - Callback when a new notification arrives
 * @param {Function} options.onUpdate - Callback when a notification is updated
 * @param {Function} options.onDelete - Callback when a notification is deleted
 * @param {boolean} options.playSound - Whether to play sound on new notifications (default: true)
 * @param {boolean} options.showToast - Whether to show toast on new notifications (default: true)
 * @returns {Object} Subscription state and controls
 */
export default function useNotificationRealtime({
  userId,
  restaurantId,
  onInsert,
  onUpdate,
  onDelete,
  playSound = true,
  showToast = true,
} = {}) {
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  /**
   * Handle new notification
   */
  const handleInsert = useCallback((payload) => {
    const notification = payload.new;
    
    // Play notification sound
    if (playSound) {
      notificationService.playSound('notification');
    }

    // Show toast notification
    if (showToast && notification.title) {
      notificationService.showToast(notification.title, {
        type: notification.type || 'info',
        duration: 5000,
      });
    }

    // Call custom handler
    if (onInsert) {
      onInsert(notification);
    }
  }, [playSound, showToast, onInsert]);

  /**
   * Handle notification update
   */
  const handleUpdate = useCallback((payload) => {
    const notification = payload.new;
    
    if (onUpdate) {
      onUpdate(notification);
    }
  }, [onUpdate]);

  /**
   * Handle notification delete
   */
  const handleDelete = useCallback((payload) => {
    const notification = payload.old;
    
    if (onDelete) {
      onDelete(notification);
    }
  }, [onDelete]);

  /**
   * Subscribe to realtime notifications
   */
  const subscribe = useCallback(() => {
    if (!userId || !restaurantId) {
      logger.warn('[useNotificationRealtime] Missing userId or restaurantId');
      return;
    }

    if (isSubscribedRef.current) {
      logger.warn('[useNotificationRealtime] Already subscribed');
      return;
    }

    // Create unique channel name
    const channelName = `notifications:${userId}:${restaurantId}`;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleDelete
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          logger.log('[useNotificationRealtime] Subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useNotificationRealtime] Subscription error');
          isSubscribedRef.current = false;
        }
      });
  }, [userId, restaurantId, handleInsert, handleUpdate, handleDelete]);

  /**
   * Unsubscribe from realtime notifications
   */
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      logger.log('[useNotificationRealtime] Unsubscribed from notifications');
    }
  }, []);

  // Auto-subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    isSubscribed: isSubscribedRef.current,
    subscribe,
    unsubscribe,
  };
}
