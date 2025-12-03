/**
 * Supabase Configuration - Backward Compatible Export
 *
 * This file re-exports all functions from the modular supabase files
 * to maintain backward compatibility with existing imports.
 */

// Core client exports
export { supabase, handleSupabaseError, default } from './supabase/client';

// Restaurant context exports
export {
  resolveRestaurantId,
  fromRestaurant,
  getRestaurant,
  ensureDemoRestaurant,
  DEFAULT_RESTAURANT_ID,
} from './supabase/restaurant';

// Table management exports
export { getTable, getTables, markTableOccupied } from './supabase/tables';

// Session management exports
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

// Order management exports
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

// Payment management exports
export {
  updatePaymentStatus,
  createPayment,
  updatePayment,
  processRefund,
  processSplitPayment,
  handleSplitPayment,
} from './supabase/payments';

// Complaints management exports
export { createComplaint, updateComplaint, getComplaints } from './supabase/complaints';
