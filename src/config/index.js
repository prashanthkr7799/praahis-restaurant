/**
 * Supabase Configuration - Central Export
 *
 * This module provides a clean API for all Supabase operations.
 * The large monolithic file has been split into focused modules:
 *
 * - client.js: Supabase client setup and error handling
 * - restaurant.js: Restaurant context and scoped queries
 * - tables.js: Table management
 * - sessions.js: Table sessions and cart management
 * - orders.js: Order CRUD and real-time subscriptions
 * - payments.js: Payment processing and refunds
 * - complaints.js: Customer complaint tracking
 */

// Core client
export { supabase, handleSupabaseError } from './supabase/client';

export { default } from './supabase/client';

// Restaurant context
export {
  resolveRestaurantId,
  fromRestaurant,
  getRestaurant,
  ensureDemoRestaurant,
  DEFAULT_RESTAURANT_ID,
} from './supabase/restaurant';

// Table management
export { getTable, getTables, markTableOccupied } from './supabase/tables';

// Session management
export {
  getOrCreateActiveSessionId,
  getSessionWithOrders,
  endTableSession,
  updateSessionActivity,
  forceReleaseTableSession,
  getSharedCart,
  updateSharedCart,
  clearSharedCart,
  subscribeToSharedCart,
} from './supabase/sessions';

// Order management
export {
  getMenuItems,
  createOrder,
  getOrder,
  getOrderByToken,
  updateOrderStatus,
  updateOrderStatusCascade,
  updateOrder,
  updateOrderItemStatus,
  getOrders,
  subscribeToOrders,
  subscribeToOrder,
  cancelOrder,
  applyDiscount,
} from './supabase/orders';

// Payment management
export {
  updatePaymentStatus,
  createPayment,
  updatePayment,
  processRefund,
  processSplitPayment,
  handleSplitPayment,
} from './supabase/payments';

// Complaints management
export { createComplaint, updateComplaint, getComplaints } from './supabase/complaints';
