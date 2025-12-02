import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Trash2, CheckCheck } from 'lucide-react';
import NotificationCard from './NotificationCard';
import { filterNotifications, sortNotifications } from '../utils/notificationUtils';

/**
 * NotificationsPanel Component
 * Right-side sliding panel for desktop with search, tabs, and bulk actions
 */
const NotificationsPanel = ({ 
  isOpen, 
  onClose, 
  notifications = [],
  onDismiss,
  onAction,
  onMarkAllAsRead,
  onClearRead,
  onLoadMore,
  hasMore = false,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const panelRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle infinite scroll
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const handleScroll = () => {
      const panel = panelRef.current;
      if (!panel) return;

      const { scrollTop, scrollHeight, clientHeight } = panel;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom && hasMore && !loading) {
        onLoadMore?.();
      }
    };

    const panel = panelRef.current;
    panel.addEventListener('scroll', handleScroll);

    return () => {
      panel.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, hasMore, loading, onLoadMore]);

  // Filter notifications based on tab
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (activeTab === 'urgent') {
      filtered = filtered.filter((n) => {
        const data = n.data || {};
        const priority = data.priority || n.type;
        return priority === 'urgent' || priority === 'alert';
      });
    }

    // Apply search filter
    filtered = filterNotifications(filtered, searchQuery);

    // Sort by priority and date
    return sortNotifications(filtered);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998] animate-fade-in hidden lg:block"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-[999]
          w-[450px] max-w-full
          bg-white dark:bg-gray-900
          shadow-2xl
          hidden lg:flex lg:flex-col
          ${isOpen ? 'animate-slide-in-right' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg 
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 
                bg-gray-100 dark:bg-gray-800 
                border border-gray-300 dark:border-gray-700
                rounded-lg
                text-sm text-gray-900 dark:text-white
                placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'unread' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'urgent' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            Urgent
          </button>
        </div>

        {/* Bulk Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
              className="
                flex items-center gap-1 px-3 py-1.5 
                text-sm font-medium rounded-lg
                bg-blue-100 dark:bg-blue-900/30 
                text-blue-700 dark:text-blue-400
                hover:bg-blue-200 dark:hover:bg-blue-900/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={onClearRead}
              className="
                flex items-center gap-1 px-3 py-1.5 
                text-sm font-medium rounded-lg
                bg-red-100 dark:bg-red-900/30 
                text-red-700 dark:text-red-400
                hover:bg-red-200 dark:hover:bg-red-900/50
                transition-colors
              "
            >
              <Trash2 className="w-4 h-4" />
              Clear Read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div 
          ref={panelRef}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No results found' : 'No notifications'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery 
                  ? 'Try a different search query' 
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onDismiss={onDismiss}
                  onAction={onAction}
                />
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                </div>
              )}

              {/* Load more indicator */}
              {hasMore && !loading && (
                <div className="text-center py-4 text-sm text-gray-500">
                  Scroll for more...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
