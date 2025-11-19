/**
 * Notifications Domain Events
 * 
 * Event definitions for the notifications domain.
 * These events are emitted when notification-related actions occur.
 */

export const NOTIFICATION_EVENTS = {
  // Notification lifecycle events
  NOTIFICATION_SENT: 'notification:sent',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DISMISSED: 'notification:dismissed',
  NOTIFICATION_DELETED: 'notification:deleted',
  
  // Notification state events
  UNREAD_COUNT_CHANGED: 'notification:unread_count_changed',
  NOTIFICATION_PREFERENCES_UPDATED: 'notification:preferences_updated',
  
  // Real-time events
  NOTIFICATION_RECEIVED: 'notification:received',
};
