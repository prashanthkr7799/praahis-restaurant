/**
 * Event Types - Central registry of all application events
 * 
 * Re-exports all domain events for convenient access.
 */

// Import domain events
import { NOTIFICATION_EVENTS } from '../../../domains/notifications/events';
import { ANALYTICS_EVENTS } from '../../../domains/analytics/events';
import { STAFF_EVENTS } from '../../../domains/staff/events';
import { ORDERING_EVENTS } from '../../../domains/ordering/events';
import { BILLING_EVENTS } from '../../../domains/billing/events';

// Re-export all events
export {
  NOTIFICATION_EVENTS,
  ANALYTICS_EVENTS,
  STAFF_EVENTS,
  ORDERING_EVENTS,
  BILLING_EVENTS,
};

// Create a unified event types object
export const ALL_EVENTS = {
  ...NOTIFICATION_EVENTS,
  ...ANALYTICS_EVENTS,
  ...STAFF_EVENTS,
  ...ORDERING_EVENTS,
  ...BILLING_EVENTS,
};

// System-level events (not domain-specific)
export const SYSTEM_EVENTS = {
  APP_INITIALIZED: 'system:app_initialized',
  USER_LOGGED_IN: 'system:user_logged_in',
  USER_LOGGED_OUT: 'system:user_logged_out',
  RESTAURANT_CHANGED: 'system:restaurant_changed',
  THEME_CHANGED: 'system:theme_changed',
  NETWORK_ONLINE: 'system:network_online',
  NETWORK_OFFLINE: 'system:network_offline',
  ERROR_OCCURRED: 'system:error_occurred',
};
