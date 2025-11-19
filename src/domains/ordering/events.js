/**
 * Ordering Domain Events
 * 
 * Event definitions for the ordering domain.
 * These events are emitted when order-related actions occur.
 */

export const ORDERING_EVENTS = {
  // Order lifecycle events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_COMPLETED: 'order:completed',
  
  // Order status events
  ORDER_PLACED: 'order:placed',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  ORDER_PAID: 'order:paid',
  
  // Session events
  SESSION_STARTED: 'session:started',
  SESSION_UPDATED: 'session:updated',
  SESSION_CLOSED: 'session:closed',
  
  // Menu events
  MENU_ITEM_ADDED: 'menu:item_added',
  MENU_ITEM_UPDATED: 'menu:item_updated',
  MENU_ITEM_DELETED: 'menu:item_deleted',
  MENU_ITEM_OUT_OF_STOCK: 'menu:item_out_of_stock',
  
  // Cart events
  ITEM_ADDED_TO_CART: 'cart:item_added',
  ITEM_REMOVED_FROM_CART: 'cart:item_removed',
  CART_CLEARED: 'cart:cleared',
};
