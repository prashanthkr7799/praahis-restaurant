/**
 * Event Types - Central registry of all application events
 *
 * Define all domain events here for centralized access.
 */

// Notification Events
export const NOTIFICATION_EVENTS = {
  NEW_ORDER: 'notification:new_order',
  ORDER_READY: 'notification:order_ready',
  ORDER_CANCELLED: 'notification:order_cancelled',
  PAYMENT_RECEIVED: 'notification:payment_received',
  LOW_STOCK: 'notification:low_stock',
  COMPLAINT_CREATED: 'notification:complaint_created',
  COMPLAINT_RESOLVED: 'notification:complaint_resolved',
  TABLE_CLEARED: 'notification:table_cleared',
  NEW_MESSAGE: 'notification:new_message',
};

// Analytics Events
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'analytics:page_view',
  ORDER_CREATED: 'analytics:order_created',
  ORDER_COMPLETED: 'analytics:order_completed',
  PAYMENT_PROCESSED: 'analytics:payment_processed',
  USER_LOGIN: 'analytics:user_login',
  USER_LOGOUT: 'analytics:user_logout',
  ERROR_OCCURRED: 'analytics:error_occurred',
};

// Staff Events
export const STAFF_EVENTS = {
  STAFF_LOGIN: 'staff:login',
  STAFF_LOGOUT: 'staff:logout',
  SHIFT_START: 'staff:shift_start',
  SHIFT_END: 'staff:shift_end',
  TABLE_ASSIGNED: 'staff:table_assigned',
  ORDER_TAKEN: 'staff:order_taken',
};

// Ordering Events
export const ORDERING_EVENTS = {
  ITEM_ADDED: 'ordering:item_added',
  ITEM_REMOVED: 'ordering:item_removed',
  ITEM_MODIFIED: 'ordering:item_modified',
  CART_CLEARED: 'ordering:cart_cleared',
  ORDER_PLACED: 'ordering:order_placed',
  ORDER_CONFIRMED: 'ordering:order_confirmed',
  ITEM_READY: 'ordering:item_ready',
};

// Billing Events
export const BILLING_EVENTS = {
  BILL_GENERATED: 'billing:bill_generated',
  PAYMENT_INITIATED: 'billing:payment_initiated',
  PAYMENT_COMPLETED: 'billing:payment_completed',
  PAYMENT_FAILED: 'billing:payment_failed',
  REFUND_INITIATED: 'billing:refund_initiated',
  REFUND_COMPLETED: 'billing:refund_completed',
  DISCOUNT_APPLIED: 'billing:discount_applied',
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
