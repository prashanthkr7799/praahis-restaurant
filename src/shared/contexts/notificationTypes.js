import { createContext } from 'react';

/**
 * Notification Types Constants
 * Separated from context to avoid React Fast Refresh warnings
 */
export const NOTIFICATION_TYPES = {
  TRIAL_EXPIRING: 'trial_expiring',
  TRIAL_EXPIRED: 'trial_expired',
  PAYMENT_DUE: 'payment_due',
  PAYMENT_OVERDUE: 'payment_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  SUBSCRIPTION_SUSPENDED: 'subscription_suspended',
  NEW_RESTAURANT: 'new_restaurant',
  SYSTEM_ALERT: 'system_alert',
  INFO: 'info'
};

/**
 * Notification Context
 * Separated from provider component to avoid React Fast Refresh warnings
 */
export const NotificationContext = createContext(null);
