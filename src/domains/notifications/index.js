/**
 * Notifications Domain
 * 
 * Public API for the notifications domain.
 * Handles real-time alerts, user notifications, and engagement features.
 */

// Components
export { default as NotificationBell } from './components/NotificationBell';

// Hooks  
// TODO: Create these hooks
// export { default as useNotifications } from './hooks/useNotifications';
// export { default as useNotificationRealtime } from './hooks/useNotificationRealtime';

// Utils
export * from './utils/notificationHelpers';
export * from './utils/notifications';
export * from './utils/notificationService';

// Events
export { NOTIFICATION_EVENTS } from './events';
