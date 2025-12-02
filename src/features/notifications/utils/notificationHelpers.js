/**
 * Notification Helper Functions
 * Utilities for listing, marking read, and subscribing to realtime notifications
 */

import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * List notifications for current user/restaurant
 * @param {Object} options - Query options
 * @param {number} options.limit - Max notifications to fetch (default 25)
 * @param {boolean} options.unreadOnly - Fetch only unread (default false)
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function listNotifications({ limit = 25, unreadOnly = false } = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    // Get user profile to find restaurant_id
    const { data: profile } = await supabase
      .from('users')
      .select('id, restaurant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { data: [], error: null };

    let query = supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${profile.id},restaurant_id.eq.${profile.restaurant_id || '00000000-0000-0000-0000-000000000000'}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[listNotifications] error:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[listNotifications] exception:', err);
    return { data: [], error: err };
  }
}

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<{data: any, error: any}>}
 */
export async function markNotificationRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select('id')
      .single();

    if (error) {
      console.error('[markNotificationRead] error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[markNotificationRead] exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Mark multiple notifications as read
 * @param {Array<string>} notificationIds - Array of notification UUIDs
 * @returns {Promise<{data: any, error: any}>}
 */
export async function markAllNotificationsRead(notificationIds = []) {
  if (!notificationIds || notificationIds.length === 0) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .select('id');

    if (error) {
      console.error('[markAllNotificationsRead] error:', error);
      toast.error('Failed to mark notifications as read');
      return { data: null, error };
    }

    toast.success(`Marked ${data?.length || 0} notification(s) as read`);
    return { data, error: null };
  } catch (err) {
    console.error('[markAllNotificationsRead] exception:', err);
    toast.error('Error updating notifications');
    return { data: null, error: err };
  }
}

/**
 * Subscribe to realtime notification inserts
 * @param {Function} onInsert - Callback when a new notification is inserted
 * @returns {Function} Cleanup function to unsubscribe
 */
export function subscribeToNotifications(onInsert) {
  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        if (onInsert && typeof onInsert === 'function') {
          onInsert(payload.new);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get unread count for current user/restaurant
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from('users')
      .select('id, restaurant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .or(`user_id.eq.${profile.id},restaurant_id.eq.${profile.restaurant_id || '00000000-0000-0000-0000-000000000000'}`)
      .eq('is_read', false);

    if (error) {
      console.error('[getUnreadCount] error:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[getUnreadCount] exception:', err);
    return 0;
  }
}
