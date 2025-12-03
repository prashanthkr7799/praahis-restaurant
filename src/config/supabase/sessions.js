/**
 * Table Session Management Functions
 * Handle session lifecycle, cart sync, and multi-device support
 */

import { supabase } from './client';
import { logger } from '@shared/utils/logger';

/**
 * Ensure an active session exists for a table and return its ID
 */
export const getOrCreateActiveSessionId = async (tableId) => {
  // First, get table info to get restaurant_id
  const { data: tbl, error: tblErr } = await supabase
    .from('tables')
    .select('id, restaurant_id')
    .eq('id', tableId)
    .single();
  if (tblErr) throw tblErr;

  // Check for existing active session in table_sessions table
  const { data: existingSessions, error: sessErr } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'active')
    .limit(1);

  if (sessErr) throw sessErr;

  // If active session exists, return it
  if (existingSessions && existingSessions.length > 0) {
    return existingSessions[0].id;
  }

  // Create new session using the database function
  const { data: newSession, error: createErr } = await supabase.rpc('get_or_create_table_session', {
    p_table_id: tableId,
    p_restaurant_id: tbl.restaurant_id,
  });

  if (createErr) throw createErr;

  // Update table status to occupied
  await supabase
    .from('tables')
    .update({
      status: 'occupied',
      booked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tableId);

  return newSession;
};

/**
 * Get session details with all orders
 */
export const getSessionWithOrders = async (sessionId) => {
  try {
    // Get session details
    const { data: session, error: sessionErr } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionErr) throw sessionErr;

    // Get all orders for this session
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (ordersErr) throw ordersErr;

    return { ...session, orders };
  } catch (err) {
    console.error('Error fetching session with orders:', err);
    throw err;
  }
};

/**
 * End a table session
 */
export const endTableSession = async (sessionId) => {
  try {
    const { data, error } = await supabase.rpc('end_table_session', { p_session_id: sessionId });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('❌ Error ending session:', err);
    throw err;
  }
};

/**
 * Update session activity timestamp (for inactivity tracking)
 */
export const updateSessionActivity = async (sessionId) => {
  try {
    const { data, error } = await supabase.rpc('update_session_activity', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('⚠️ Failed to update session activity:', error);
      return false;
    }

    return data;
  } catch (err) {
    console.error('⚠️ Error updating session activity:', err);
    return false;
  }
};

/**
 * Force release a table session (manager override)
 */
export const forceReleaseTableSession = async (sessionId = null, tableId = null) => {
  try {
    // Check for unpaid orders before releasing table
    if (tableId) {
      const { data: unpaidOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, payment_status')
        .eq('table_id', tableId)
        .in('payment_status', ['pending', 'failed'])
        .eq('order_status', 'served');

      if (ordersError) {
        console.error('Error checking unpaid orders:', ordersError);
      } else if (unpaidOrders && unpaidOrders.length > 0) {
        const orderNumbers = unpaidOrders.map((o) => `#${o.order_number}`).join(', ');
        const totalAmount = unpaidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        throw new Error(
          `Cannot release table. There are ${unpaidOrders.length} unpaid order(s): ${orderNumbers}. Total due: ₹${totalAmount.toFixed(2)}. Please collect payment before clearing the table.`
        );
      }
    }

    const { data, error } = await supabase.rpc('force_release_table_session', {
      p_session_id: sessionId,
      p_table_id: tableId,
    });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('❌ Error force-releasing table session:', err);
    throw err;
  }
};

// =============================================
// Shared Cart Management (Multi-Device Sync)
// =============================================

/**
 * Get shared cart from table_sessions.cart_items
 * All devices at the same table see the same cart
 */
export const getSharedCart = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('table_sessions')
      .select('cart_items')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) throw error;

    const cart = data?.cart_items || [];
    return cart;
  } catch (err) {
    console.error('❌ Error getting shared cart:', err);
    return [];
  }
};

/**
 * Update shared cart in table_sessions.cart_items
 * Updates propagate to all devices via real-time subscription
 */
export const updateSharedCart = async (sessionId, cartItems) => {
  try {
    logger.log('📦 Updating shared cart:', {
      sessionId,
      itemCount: cartItems.length,
      items: cartItems.map((i) => ({ id: i.id, name: i.name, qty: i.quantity })),
    });

    const { data, error } = await supabase
      .from('table_sessions')
      .update({
        cart_items: cartItems,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error('❌ Update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('⚠️ Session not found in database:', sessionId);
      throw new Error('Session not found');
    }

    logger.log('✅ Cart updated successfully:', {
      rowsAffected: data.length,
      cartItemCount: data[0]?.cart_items?.length,
      sessionStatus: data[0]?.status,
    });

    // ADDITIONAL: Broadcast via channel as backup
    try {
      const channel = supabase.channel(`cart-${sessionId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'cart_update',
            payload: { sessionId, cartItems, timestamp: new Date().toISOString() },
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    } catch (broadcastErr) {
      logger.warn('⚠️ Broadcast failed (non-critical):', broadcastErr);
    }

    return data?.[0]?.cart_items || [];
  } catch (err) {
    logger.error('❌ Error updating shared cart:', err);
    throw err;
  }
};

/**
 * Clear shared cart (after order creation)
 */
export const clearSharedCart = async (sessionId) => {
  try {
    const { error } = await supabase
      .from('table_sessions')
      .update({
        cart_items: [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;

    return true;
  } catch (err) {
    logger.error('❌ Error clearing shared cart:', err);
    return false;
  }
};

/**
 * Subscribe to shared cart updates for real-time sync across devices
 * Returns unsubscribe function
 */
export const subscribeToSharedCart = (sessionId, callback) => {
  const channel = supabase
    .channel(`table-session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'table_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        logger.log('🔄 Cart update received:', {
          sessionId,
          cartItems: payload.new.cart_items,
          timestamp: payload.new.updated_at,
        });
        callback(payload.new.cart_items || []);
      }
    )
    .on('broadcast', { event: 'cart_update' }, (payload) => {
      if (payload.payload.sessionId === sessionId) {
        callback(payload.payload.cartItems || []);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.log('✅ Subscribed to shared cart updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Subscription channel error');
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Subscription timed out');
      }
    });

  return () => {
    channel.unsubscribe();
  };
};
