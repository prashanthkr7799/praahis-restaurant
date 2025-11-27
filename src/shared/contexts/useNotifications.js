import { useContext } from 'react';
import { NotificationContext } from './notificationTypes';

/**
 * Hook to access notification context
 * Separated from context provider to avoid React Fast Refresh warnings
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a default value instead of throwing
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      deleteNotification: () => {},
      clearAll: () => {},
      addNotification: () => {}
    };
  }
  return context;
};
