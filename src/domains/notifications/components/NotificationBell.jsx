import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import {
  listNotifications,
  markAllNotificationsRead,
  subscribeToNotifications
} from '../utils/notificationHelpers';
import toast from 'react-hot-toast';

/**
 * NotificationsBell Component
 * Displays notification count badge and dropdown list
 * Features: realtime updates, mark all read, auto-refresh
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Count unread notifications
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Load notifications from DB
  const loadNotifications = async () => {
    setLoading(true);
    const { data } = await listNotifications({ limit: 30 });
    setNotifications(data || []);
    setLoading(false);
  };

  // Mark all unread as read
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) {
      toast.success('All caught up!');
      return;
    }

    const { error } = await markAllNotificationsRead(unreadIds);
    if (!error) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // Subscribe to realtime inserts
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev].slice(0, 30));
      // Optional: show toast for new notification
      toast.success(newNotification.title, {
        icon: '🔔',
        duration: 3000
      });
    });

    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Icon based on notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'order':
        return '🍽️';
      case 'payment':
        return '💰';
      case 'alert':
        return '⚠️';
      case 'staff':
        return '👥';
      case 'system':
      default:
        return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-card border border-border hover:bg-muted transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold px-1 rounded-full bg-primary text-primary-foreground border border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-border shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs inline-flex items-center gap-1 text-primary hover:text-primary/80 transition"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted transition"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have no new notifications
                </p>
              </div>
            )}

            {notifications.length > 0 && (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-muted/30 transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Type Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg" role="img" aria-label={notification.type}>
                        {getTypeIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer (optional) */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/10 text-center">
              <button
                onClick={() => {
                  setOpen(false);
                  // Navigate to notifications page if you have one
                  // navigate('/manager/notifications');
                }}
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
