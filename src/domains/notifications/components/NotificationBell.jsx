import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/shared/utils/api/supabaseClient';
import NotificationCard from './NotificationCard';
import NotificationsPanel from './NotificationsPanel';
import MobileBottomSheet from './MobileBottomSheet';
import { sortNotifications } from '../utils/notificationUtils';
import { logger } from '@/shared/utils/helpers/logger';

/**
 * NotificationBell Component
 * Animated bell icon with dropdown for notifications
 * Includes real-time updates, mark as read, and bulk actions
 */
const NotificationBell = ({ userId, restaurantId }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const ITEMS_PER_PAGE = 20;

  // Load notifications
  const loadNotifications = async (pageNum = 0) => {
    if (!userId || !restaurantId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (pageNum === 0) {
        setNotifications(data || []);
      } else {
        setNotifications((prev) => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === ITEMS_PER_PAGE);
      setPage(pageNum);

      // Count unread
      const unread = (data || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.success('All notifications already read');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);
      toast.success(`Marked ${unreadIds.length} notifications as read`);
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  // Clear read notifications
  const clearReadNotifications = async () => {
    try {
      const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);

      if (readIds.length === 0) {
        toast.success('No read notifications to clear');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds);

      if (error) throw error;

      // Update local state
      setNotifications((prev) => prev.filter((n) => !n.is_read));

      toast.success(`Cleared ${readIds.length} notifications`);
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  /**
   * Alert a waiter about a customer request
   * Creates a notification for all waiters in the restaurant
   */
  const alertWaiter = async (data) => {
    try {
      // Get all active waiters for this restaurant
      const { data: waiters, error: waitersError } = await supabase
        .from('users')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('role', 'waiter')
        .eq('is_active', true);

      if (waitersError) throw waitersError;

      if (!waiters || waiters.length === 0) {
        toast.error('No active waiters available');
        return;
      }

      // Create notifications for all waiters
      const notifications = waiters.map((waiter) => ({
        user_id: waiter.id,
        restaurant_id: restaurantId,
        type: 'waiter_alert',
        title: 'Customer Assistance Requested',
        message: data.message || `Table ${data.table_number || 'Unknown'} needs assistance`,
        data: {
          table_id: data.table_id,
          table_number: data.table_number,
          order_id: data.order_id,
          priority: 'high',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      toast.success(`Alerted ${waiters.length} waiter(s)!`);
    } catch (error) {
      console.error('Failed to alert waiter:', error);
      toast.error('Failed to alert waiter');
    }
  };

  // Handle quick action
  const handleQuickAction = (notification, data) => {
    const actionType = data.action_type;

    // Close dropdown/panel after action
    const closeMenus = () => {
      setDropdownOpen(false);
      setPanelOpen(false);
      setMobileSheetOpen(false);
    };

    switch (actionType) {
      case 'alert_waiter':
        alertWaiter(data);
        break;

      case 'call_customer':
        if (data.phone) {
          window.location.href = `tel:${data.phone}`;
        } else {
          toast.error('No phone number available');
        }
        break;

      case 'view_order':
        // Navigate to order status page (customer view) or manager orders tab
        if (data.order_id) {
          closeMenus();
          // If we have a session context, go to order status; otherwise go to manager dashboard
          if (data.session_id) {
            navigate(`/order-status/${data.order_id}`);
          } else {
            // Manager view - go to dashboard with orders tab
            navigate('/manager/dashboard?tab=orders');
            toast.info(`Order: ${data.order_number || data.order_id}`);
          }
        } else {
          toast.error('Order ID not available');
        }
        break;

      case 'view_menu':
        // Navigate to menu management page
        closeMenus();
        navigate('/manager/dashboard?tab=kitchen');
        break;

      case 'view_complaint':
      case 'view_feedback':
        // Navigate to feedback/complaints section
        closeMenus();
        // Feedbacks are viewed in manager analytics or a dedicated complaints view
        if (data.feedback_id || data.complaint_id) {
          navigate('/manager/analytics');
          toast.info('Opening feedback section...');
        } else {
          navigate('/manager/dashboard?tab=overview');
          toast.info('Check the overview for recent feedback');
        }
        break;

      case 'view_table':
        // Navigate to tables management
        closeMenus();
        navigate('/manager/dashboard?tab=tables');
        if (data.table_number) {
          toast.info(`Table ${data.table_number}`);
        }
        break;

      case 'view_payment':
        // Navigate to payments tracking
        closeMenus();
        navigate('/manager/payments');
        break;

      default:
        // Unknown action type - log and do nothing
        logger.warn('Unknown notification action type:', actionType);
    }

    // Mark as read after action
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!userId || !restaurantId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Add to notifications list
          setNotifications((prev) => [payload.new, ...prev]);

          // Increase unread count
          setUnreadCount((prev) => prev + 1);

          // Trigger bell animation
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 1000);

          // Show toast
          toast.success(payload.new.title || 'New notification');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Update notification in list
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Remove notification from list
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, restaurantId]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, restaurantId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown on mobile vs desktop
  const handleBellClick = () => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      setMobileSheetOpen(true);
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  // Open full panel (desktop only)
  const openFullPanel = () => {
    setDropdownOpen(false);
    setPanelOpen(true);
  };

  const sortedNotifications = sortNotifications(notifications);
  const recentNotifications = sortedNotifications.slice(0, 5);

  return (
    <>
      {/* Bell Button */}
      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className={`
            relative p-2 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all
            ${hasNewNotification ? 'animate-bounce' : ''}
          `}
        >
          <Bell 
            className={`
              w-6 h-6 text-gray-600 dark:text-gray-300
              ${hasNewNotification ? 'animate-pulse' : ''}
            `}
          />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel (Desktop Only) */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="
              absolute right-0 top-full mt-2 z-50
              w-[380px] max-h-[600px]
              bg-white dark:bg-gray-900
              rounded-lg shadow-xl border border-gray-200 dark:border-gray-800
              overflow-hidden
              animate-fade-in
              hidden md:block
            "
            style={{
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  NOTIFICATIONS
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Mark All as Read Link */}
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px] p-3">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No notifications
                  </p>
                </div>
              ) : (
                <>
                  {recentNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onDismiss={markAsRead}
                      onAction={handleQuickAction}
                    />
                  ))}
                </>
              )}
            </div>

            {/* View All Button */}
            {notifications.length > 5 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                <button
                  onClick={openFullPanel}
                  className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  View All Notifications ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Notifications Panel (Desktop) */}
      <NotificationsPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={sortedNotifications}
        onDismiss={markAsRead}
        onAction={handleQuickAction}
        onMarkAllAsRead={markAllAsRead}
        onClearRead={clearReadNotifications}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
      />

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
      >
        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full mb-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}

        {/* Notifications List */}
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔕</div>
            <p className="text-gray-500 dark:text-gray-400">
              No notifications
            </p>
          </div>
        ) : (
          <>
            {sortedNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={markAsRead}
                onAction={handleQuickAction}
              />
            ))}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            )}
          </>
        )}
      </MobileBottomSheet>
    </>
  );
};

export default NotificationBell;
