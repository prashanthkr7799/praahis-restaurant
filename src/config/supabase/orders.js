/**
 * Order Management Functions
 * Handle order CRUD, status updates, and real-time subscriptions
 */

import { supabase } from './client';
import { resolveRestaurantId } from './restaurant';
import { getOrCreateActiveSessionId } from './sessions';
import { logger } from '@shared/utils/logger';

// Cache feature availability to avoid repeated 404s when optional views are missing
let RATINGS_VIEW_AVAILABLE = true;

/**
 * Fetch menu items for a restaurant
 */
export const getMenuItems = async (restaurantId) => {
  const rid = resolveRestaurantId(restaurantId);
  // Prefer view that includes rating aggregates; fall back if missing
  if (RATINGS_VIEW_AVAILABLE) {
    try {
      const { data, error } = await supabase
        .from('menu_items_with_ratings')
        .select('*')
        .eq('restaurant_id', rid)
        .eq('is_available', true)
        .order('category')
        .order('name');
      if (error) throw error;
      return data;
    } catch {
      // Disable further attempts this session to avoid repeated 404s
      RATINGS_VIEW_AVAILABLE = false;
    }
  }

  // Fallback to base table (older deployments)
  const res = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', rid)
    .eq('is_available', true)
    .order('category')
    .order('name');
  if (res.error) throw res.error;
  return res.data;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  // If table_id is present, ensure the table has an active session id, and attach it to the order
  let sessionId = orderData.session_id;
  try {
    if (orderData.table_id && !sessionId) {
      sessionId = await getOrCreateActiveSessionId(orderData.table_id);
    }
  } catch (e) {
    logger.warn('Could not ensure active session id for table:', e?.message);
  }

  const rid = resolveRestaurantId(orderData?.restaurant_id);
  const payload = {
    ...orderData,
    restaurant_id: rid,
    session_id: sessionId || orderData.session_id || null,
  };

  const { data, error } = await supabase.from('orders').insert([payload]).select();

  if (error) {
    console.error('Supabase order creation error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to create order: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Order creation failed: No data returned');
  }
  // Some supabase configurations may return the inserted row directly (object) instead of array
  const createdOrder = Array.isArray(data) ? data[0] : data;
  if (!createdOrder || !createdOrder.id) {
    console.error('createOrder: Missing id in returned data', createdOrder);
    throw new Error('Order creation failed: Missing order ID in response');
  }

  // Update table status to occupied when order is created (and keep/ensure session id)
  if (orderData.table_id) {
    try {
      const now = new Date().toISOString();
      const tblUpdate = {
        status: 'occupied',
        booked_at: now,
        updated_at: now,
      };
      if (sessionId) tblUpdate.active_session_id = sessionId;
      await supabase.from('tables').update(tblUpdate).eq('id', orderData.table_id);
    } catch (tableError) {
      console.error('⚠️ Error updating table status:', tableError);
      // Don't fail the order if table update fails
    }
  }

  return createdOrder;
};

/**
 * Get order by ID
 */
export const getOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      tables (
        table_number,
        table_name
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order not found');
  }

  // Transform order data for frontend
  return {
    ...data,
    status: data.order_status,
    total_amount: data.total,
    subtotal_amount: data.subtotal,
    tax_amount: data.tax,
    restaurant_id: data.restaurant_id,
  };
};

/**
 * Get order by token
 */
export const getOrderByToken = async (orderToken) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_token', orderToken)
    .single();

  if (error) throw error;

  return {
    ...data,
    status: data.order_status,
    total_amount: data.total,
    subtotal_amount: data.subtotal,
    tax_amount: data.tax,
  };
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update order status with cascade to all items
 */
export const updateOrderStatusCascade = async (orderId, status) => {
  const { data, error } = await supabase.rpc('update_order_status_cascade', {
    p_order_id: orderId,
    p_new_status: status,
  });

  if (error) {
    console.error('Error in updateOrderStatusCascade:', error);
    throw error;
  }

  const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!result) {
    throw new Error('No data returned from cascade update');
  }

  return result;
};

/**
 * Update order items and totals
 */
export const updateOrder = async (orderId, updates) => {
  const payload = { ...updates };

  if (Object.prototype.hasOwnProperty.call(payload, 'subtotal_amount')) {
    payload.subtotal = payload.subtotal_amount;
    delete payload.subtotal_amount;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'tax_amount')) {
    payload.tax = payload.tax_amount;
    delete payload.tax_amount;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'total_amount')) {
    payload.total = payload.total_amount;
    delete payload.total_amount;
  }

  if (payload.items && typeof payload.items === 'string') {
    try {
      payload.items = JSON.parse(payload.items);
    } catch {
      // leave as-is if parse fails
    }
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a single item's status within an order's items JSONB array
 */
export const updateOrderItemStatus = async (orderId, menuItemId, nextStatus) => {
  const { data: orderRow, error: fetchError } = await supabase
    .from('orders')
    .select('items')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load order items: ${fetchError.message}`);
  }

  const items = Array.isArray(orderRow.items)
    ? [...orderRow.items]
    : JSON.parse(orderRow.items || '[]');

  const idx = items.findIndex((it) => it.menu_item_id === menuItemId);
  if (idx === -1) {
    throw new Error('Menu item not found in order');
  }

  const now = new Date().toISOString();
  const updated = { ...items[idx], item_status: nextStatus };
  if (nextStatus === 'preparing' && !updated.started_at) updated.started_at = now;
  if (nextStatus === 'ready' && !updated.ready_at) updated.ready_at = now;
  if (nextStatus === 'served' && !updated.served_at) updated.served_at = now;
  items[idx] = updated;

  const statuses = items.map((it) => it.item_status || 'queued');
  let overallStatus = undefined;
  const allServed = statuses.length > 0 && statuses.every((s) => s === 'served');
  const allReadyOrServed =
    statuses.length > 0 && statuses.every((s) => s === 'ready' || s === 'served');
  const anyPreparingLike = statuses.some(
    (s) => s === 'queued' || s === 'received' || s === 'preparing'
  );
  if (allServed) overallStatus = 'served';
  else if (allReadyOrServed) overallStatus = 'ready';
  else if (anyPreparingLike) overallStatus = 'preparing';

  const updatePayload = { items, updated_at: now };
  if (overallStatus) updatePayload.order_status = overallStatus;

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update item status: ${error.message}`);
  }
  return data;
};

/**
 * Get orders for a restaurant with optional filters
 */
export const getOrders = async (restaurantId, filters = {}) => {
  const rid = resolveRestaurantId(restaurantId);
  let query = supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', rid)
    .order('created_at', { ascending: false });

  if (filters.order_status) {
    query = query.eq('order_status', filters.order_status);
  }

  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Helper function to transform order data from database format to frontend format
 */
const transformOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    status: order.order_status,
    total_amount: order.total,
    subtotal_amount: order.subtotal,
    tax_amount: order.tax,
  };
};

/**
 * Subscribe to order updates (for real-time)
 */
export const subscribeToOrders = async (restaurantId, onOrderChange, onError) => {
  const rid = resolveRestaurantId(restaurantId);

  try {
    const { data: initialOrders, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        tables (
          table_number,
          table_name
        )
      `
      )
      .eq('restaurant_id', rid)
      .neq('order_status', 'pending_payment')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching initial orders:', fetchError);
      throw fetchError;
    }

    if (onOrderChange) {
      try {
        const transformedOrders = (initialOrders || []).map(transformOrder);
        onOrderChange(transformedOrders);
      } catch (transformError) {
        console.error('Error transforming orders:', transformError);
        throw transformError;
      }
    }

    const channel = supabase
      .channel(`orders-changes-chef-${rid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${rid}`,
        },
        async (_payload) => {
          try {
            const { data: updatedOrders, error: refetchError } = await supabase
              .from('orders')
              .select(
                `
                *,
                tables (
                  table_number,
                  table_name
                )
              `
              )
              .eq('restaurant_id', rid)
              .neq('order_status', 'pending_payment')
              .order('created_at', { ascending: false });

            if (!refetchError && onOrderChange) {
              const transformedOrders = (updatedOrders || []).map(transformOrder);
              onOrderChange(transformedOrders);
            } else if (refetchError) {
              console.error('Error refetching orders:', refetchError);
            }
          } catch (refetchErr) {
            console.error('Exception in order refetch:', refetchErr);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', err);
          if (onError) {
            onError(new Error('Subscription error: ' + (err?.message || 'Unknown error')));
          }
        }
        if (status === 'TIMED_OUT') {
          console.error('Subscription timed out');
          if (onError) {
            onError(new Error('Subscription timed out'));
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Error in subscribeToOrders:', err);
    if (onError) {
      onError(err);
    }
    throw err;
  }
};

/**
 * Subscribe to specific order updates
 */
export const subscribeToOrder = (orderId, callback) => {
  return supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      callback
    )
    .subscribe();
};

/**
 * Cancel order with reason and refund options
 */
export const cancelOrder = async (orderId, cancellationData) => {
  try {
    const { reason, refund, refundAmount, refundMethod = 'original_method' } = cancellationData;

    if (!orderId) throw new Error('Order ID is required');
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }
    if (refund && (!refundAmount || refundAmount <= 0)) {
      throw new Error('Valid refund amount is required when processing refund');
    }

    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('order_status, payment_status, total')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    if (currentOrder.order_status === 'served') {
      throw new Error(
        'Cannot cancel order. This order has already been served to the customer. Please process a refund instead if needed.'
      );
    }

    if (currentOrder.order_status === 'cancelled') {
      throw new Error('This order has already been cancelled.');
    }

    const updateData = {
      order_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    };

    if (refund && refundAmount) {
      updateData.payment_status = 'refunded';
      updateData.refund_amount = refundAmount;
      updateData.refund_reason = reason;
      updateData.refunded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (refund && refundAmount) {
      try {
        const { processRefund } = await import('./payments');
        await processRefund(orderId, {
          refundAmount,
          reason,
          refundMethod,
          alreadyRefunded: 0,
        });
      } catch (refundError) {
        console.error('Refund processing failed:', refundError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};

/**
 * Apply discount to an order
 */
export const applyDiscount = async (orderId, discountData) => {
  try {
    const { type, value, amount, reason, newTotal } = discountData;

    if (!orderId) throw new Error('Order ID is required');
    if (!['percentage', 'fixed'].includes(type)) {
      throw new Error('Discount type must be "percentage" or "fixed"');
    }
    if (!value || value <= 0) {
      throw new Error('Discount value must be greater than 0');
    }
    if (type === 'percentage' && value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Discount reason is required');
    }
    if (!amount || amount < 0) {
      throw new Error('Invalid discount amount');
    }
    if (!newTotal || newTotal < 0) {
      throw new Error('Invalid new total');
    }

    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('total, subtotal, discount_amount')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    const originalTotal = currentOrder.total + (currentOrder.discount_amount || 0);

    if (amount > originalTotal) {
      throw new Error(
        `Discount amount (₹${amount}) cannot exceed original bill amount (₹${originalTotal})`
      );
    }

    if (newTotal < 0) {
      throw new Error('Discount would result in negative total. Please reduce the discount.');
    }

    const updateData = {
      discount_amount: amount,
      discount_reason: reason,
      total: newTotal,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error applying discount:', error);
    throw new Error(`Failed to apply discount: ${error.message}`);
  }
};
