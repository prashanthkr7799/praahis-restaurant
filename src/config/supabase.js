import { createClient } from '@supabase/supabase-js';
import { getActiveRestaurantId } from '@shared/services/restaurantContextStore';
import { handleAuthError, clearAllSessions } from '@shared/utils/authErrorHandler';
import { logger } from '@shared/utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Suppress expected multi-client warning (we use dual clients for manager + owner sessions)
// and chart initialization warnings
if (typeof console !== 'undefined' && !globalThis.__supabase_warn_suppressed__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Multiple GoTrueClient instances')) {
      // This is expected - we use separate clients for staff and owner sessions
      return;
    }
    if (message.includes('width(-1) and height(-1) of chart')) {
      // This is a temporary Recharts warning during initial render - safe to ignore
      return;
    }
    originalWarn.apply(console, args);
  };
  globalThis.__supabase_warn_suppressed__ = true;
}

// Ensure a single instance across HMR to avoid multiple GoTrue clients with the same storageKey
const globalAny = globalThis;
export const supabase = globalAny.__supabase_manager__ ?? (
  (globalAny.__supabase_manager__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use a distinct storage key for manager/staff sessions
      storageKey: 'sb-manager-session',
      // Keep session alive for 4 hours of activity
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'praahis-manager-client',
      },
    },
  }))
);

// Listen for auth errors and handle invalid refresh tokens automatically
supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'TOKEN_REFRESHED') {
    logger.info('✅ Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    logger.info('🔒 User signed out');
  }
});

// Handle auth errors globally - catch invalid refresh tokens
const originalRefresh = supabase.auth._refreshAccessToken?.bind(supabase.auth);
if (originalRefresh) {
  supabase.auth._refreshAccessToken = async (...args) => {
    try {
      return await originalRefresh(...args);
    } catch (error) {
      if (error?.message?.includes('Refresh Token Not Found') || 
          error?.message?.includes('Invalid Refresh Token')) {
        logger.warn('⚠️ Invalid refresh token - clearing sessions');
        clearAllSessions();
        // Redirect to login after clearing
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/auth/login';
        }
      }
      throw error;
    }
  };
}

/**
 * Wrapper to handle authentication errors in Supabase responses
 * Automatically clears invalid tokens and provides user-friendly errors
 */
export const handleSupabaseError = (error) => {
  if (!error) return null;
  
  // Check for authentication errors
  if (error.code === 'PGRST301' || error.message?.includes('401')) {
    handleAuthError(error);
    return new Error('Session expired. Please log in again.');
  }
  
  // Handle other auth-related errors
  if (error.message?.includes('refresh token') || error.message?.includes('JWT')) {
    handleAuthError(error);
    return new Error('Authentication error. Please log in again.');
  }
  
  return error;
};

// Helper functions for database operations

// Cache feature availability to avoid repeated 404s when optional views are missing
let RATINGS_VIEW_AVAILABLE = true;

// Default restaurant ID (from seed data)
const DEFAULT_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440000';

// Resolve restaurant id from param or runtime context
const resolveRestaurantId = (maybeId) => {
  return maybeId || getActiveRestaurantId(DEFAULT_RESTAURANT_ID) || DEFAULT_RESTAURANT_ID;
};

// Helper to scope queries by restaurant automatically
// Usage: fromRestaurant('orders').select('*').gte(...)
// Note: In supabase-js v2, filters like .eq() are available AFTER .select()/update()/delete()
// so this helper exposes those methods and applies the restaurant_id filter for you.
export const fromRestaurant = (table, restaurantId) => {
  const rid = resolveRestaurantId(restaurantId);
  const base = supabase.from(table);
  return {
    select: (...args) => base.select(...args).eq('restaurant_id', rid),
    update: (...args) => base.update(...args).eq('restaurant_id', rid),
    delete: (...args) => base.delete(...args).eq('restaurant_id', rid),
    // Insert cannot be filtered; we auto-populate restaurant_id on payload
    insert: (values, ...rest) => {
      const withRid = Array.isArray(values)
        ? values.map((row) => ({ restaurant_id: rid, ...row }))
        : { restaurant_id: rid, ...values };
      return base.insert(withRid, ...rest);
    },
  };
};

// Fetch restaurant info
export const getRestaurant = async (restaurantId) => {
  const rid = resolveRestaurantId(restaurantId);
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', rid)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    console.error('Error fetching restaurant:', error);
    throw new Error(`Failed to fetch restaurant: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('Restaurant not found');
  }
  
  return data[0];
};

// Fetch table info by ID or table number
export const getTable = async (tableIdOrNumber, restaurantSlug = null) => {
  // Check if it's a UUID or table number
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableIdOrNumber);
  const isDemo = typeof tableIdOrNumber === 'string' && tableIdOrNumber.toLowerCase() === 'demo';

  // Special-case: demo route maps to the first active table
  if (isDemo) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number')
      .limit(1);

    if (error) {
      console.error('Error fetching demo table:', error);
      throw new Error(`Failed to fetch demo table: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error('No active tables available for demo');
    }
    return data[0];
  }

  // If restaurant slug/name is provided, look it up first
  let restaurantId = null;
  if (restaurantSlug && !isUUID) {
    // Try by slug first
    let { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('slug', restaurantSlug)
      .limit(1);
    
    // If not found by slug, try by name (case-insensitive)
    if (!restaurants || restaurants.length === 0) {
      const result = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .ilike('name', restaurantSlug)
        .limit(1);
      
      restaurants = result.data;
      restError = result.error;
    }
    
    if (restError) {
      console.error('Error looking up restaurant:', restError);
      throw new Error(`Failed to find restaurant: ${restError.message}`);
    }
    
    if (!restaurants || restaurants.length === 0) {
      throw new Error(`Restaurant not found with slug: ${restaurantSlug}`);
    }
    
    restaurantId = restaurants[0].id;
  }

  let query = supabase
    .from('tables')
    .select('*')
    .eq('is_active', true);
  
  if (isUUID) {
    query = query.eq('id', tableIdOrNumber);
  } else {
    // It's a table number (like "1", "2", etc.)
    query = query.eq('table_number', tableIdOrNumber);
    
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    } else {
      // Fallback to restaurant ID from context
      const rid = resolveRestaurantId();
      query = query.eq('restaurant_id', rid);
    }
  }
  
  // Don't use .single() - get array and take first
  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error fetching table:', error);
    throw new Error(`Failed to fetch table: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error(`Table not found: ${tableIdOrNumber}${restaurantSlug ? ` at restaurant ${restaurantSlug}` : ''}`);
  }
  
  // Return the first table (in case of duplicates)
  return data[0];
};

// Fetch all tables for a restaurant
export const getTables = async (restaurantId) => {
  const rid = resolveRestaurantId(restaurantId);
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', rid)
    .eq('is_active', true)
    .order('table_number');

  if (error) throw error;
  return data;
};

// Ensure an active session exists for a table and return its ID
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
  const { data: newSession, error: createErr } = await supabase
    .rpc('get_or_create_table_session', {
      p_table_id: tableId,
      p_restaurant_id: tbl.restaurant_id
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

// Mark table as occupied when customer enters
export const markTableOccupied = async (tableId) => {
  
  try {
    // Create or get active session - this handles session creation
    const sessionId = await getOrCreateActiveSessionId(tableId);
    
    // Update table status
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('tables')
      .update({
        status: 'occupied',
        booked_at: now,
        updated_at: now,
      })
      .eq('id', tableId)
      .select();

    if (error) {
      console.error('❌ Error marking table occupied:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Update returned 0 rows - RLS policy blocking update');
      return null;
    }
    
    return { ...data[0], session_id: sessionId };
  } catch (err) {
    console.error('❌ Failed to mark table occupied:', err);
    // Don't throw error - table status is not critical for customer experience
    return null;
  }
};

// Get session details with all orders
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

// End a table session
export const endTableSession = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .rpc('end_table_session', { p_session_id: sessionId });

    if (error) throw error;
    
    return data;
  } catch (err) {
    console.error('❌ Error ending session:', err);
    throw err;
  }
};

// Update session activity timestamp (for inactivity tracking)
export const updateSessionActivity = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .rpc('update_session_activity', { p_session_id: sessionId });

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

// Force release a table session (manager override)
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
        const orderNumbers = unpaidOrders.map(o => `#${o.order_number}`).join(', ');
        const totalAmount = unpaidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        throw new Error(`Cannot release table. There are ${unpaidOrders.length} unpaid order(s): ${orderNumbers}. Total due: ₹${totalAmount.toFixed(2)}. Please collect payment before clearing the table.`);
      }
    }

    const { data, error } = await supabase
      .rpc('force_release_table_session', { 
        p_session_id: sessionId,
        p_table_id: tableId
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
      .maybeSingle(); // Removed status filter - session exists if we have the ID

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
      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity }))
    });
    
    // Update without status filter to avoid race conditions
    // The session exists if we have a sessionId, we don't need to check status
    const { data, error } = await supabase
      .from('table_sessions')
      .update({ 
        cart_items: cartItems,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      sessionStatus: data[0]?.status
    });
    
    // ADDITIONAL: Broadcast via channel as backup
    try {
      const channel = supabase.channel(`cart-${sessionId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'cart_update',
            payload: { sessionId, cartItems, timestamp: new Date().toISOString() }
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
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId); // Removed status filter

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
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        logger.log('🔄 Cart update received:', {
          sessionId,
          cartItems: payload.new.cart_items,
          timestamp: payload.new.updated_at
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

// Fetch menu items
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

// Create order
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

  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select();

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
      await supabase
        .from('tables')
        .update(tblUpdate)
        .eq('id', orderData.table_id);
    } catch (tableError) {
      console.error('⚠️ Error updating table status:', tableError);
      // Don't fail the order if table update fails
    }
  }
  
  return createdOrder;
};

// Get order by ID
export const getOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables (
        table_number,
        table_name
      )
    `)
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
    // Ensure restaurant_id is always present (it's already in the data)
    restaurant_id: data.restaurant_id,
  };
};

// Get order by token
export const getOrderByToken = async (orderToken) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_token', orderToken)
    .single();

  if (error) throw error;
  
  // Transform order data for frontend
  return {
    ...data,
    status: data.order_status,
    total_amount: data.total,
    subtotal_amount: data.subtotal,
    tax_amount: data.tax,
  };
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  const { data, error} = await supabase
    .from('orders')
    .update({ order_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update order status with cascade to all items
// This ensures order_status and all item_status fields stay in sync
export const updateOrderStatusCascade = async (orderId, status) => {
  const { data, error } = await supabase
    .rpc('update_order_status_cascade', {
      p_order_id: orderId,
      p_new_status: status
    });

  if (error) {
    console.error('Error in updateOrderStatusCascade:', error);
    throw error;
  }

  // RPC returns array, get first result
  const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!result) {
    throw new Error('No data returned from cascade update');
  }

  return result;
};

// Cancel order with reason and notes
// Updates order status to cancelled and stores cancellation details
/**
 * Cancel an order with optional refund processing
 * @param {string} orderId - Order ID
 * @param {Object} cancellationData - {reason, notes, refund, refundAmount, refundMethod}
 * @returns {Object} Updated order
 */
export const cancelOrder = async (orderId, cancellationData) => {
  try {
    const { reason, refund, refundAmount, refundMethod = 'original_method' } = cancellationData;
    
    // Validation
    if (!orderId) throw new Error('Order ID is required');
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }
    if (refund && (!refundAmount || refundAmount <= 0)) {
      throw new Error('Valid refund amount is required when processing refund');
    }

    // Fetch current order to validate status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('order_status, payment_status, total')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    // Block cancellation if order is already served
    if (currentOrder.order_status === 'served') {
      throw new Error('Cannot cancel order. This order has already been served to the customer. Please process a refund instead if needed.');
    }

    // Block cancellation if order is already cancelled
    if (currentOrder.order_status === 'cancelled') {
      throw new Error('This order has already been cancelled.');
    }

    const updateData = {
      order_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      updated_at: new Date().toISOString()
    };

    // If refund is being processed, add refund fields
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

    // Process refund in payment records if needed
    if (refund && refundAmount) {
      try {
        await processRefund(orderId, {
          refundAmount,
          reason,
          refundMethod,
          alreadyRefunded: 0
        });
      } catch (refundError) {
        console.error('Refund processing failed:', refundError);
        // Order is still cancelled even if refund processing fails
      }
    }

    return data;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};

/**
 * Process refund for a paid order
 * Updates both order and payment records with refund details
 * @param {string} orderId - Order ID
 * @param {Object} refundData - {refundAmount, reason, refundMethod, alreadyRefunded}
 * @returns {Object} Success status and updated order
 */
export const processRefund = async (orderId, refundData) => {
  try {
    const { refundAmount, reason, refundMethod = 'original_method', alreadyRefunded = 0 } = refundData;
    
    // Validation
    if (!orderId) throw new Error('Order ID is required');
    if (!refundAmount || refundAmount <= 0) {
      throw new Error('Valid refund amount is required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Refund reason is required');
    }

    // 1. Get the order to validate and update
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // Prevent refund if order is not paid
    if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
      throw new Error(`Cannot process refund. Order payment status is "${order.payment_status}". Only paid orders can be refunded.`);
    }

    // 2. Calculate total refunded and new payment status
    const totalRefunded = alreadyRefunded + refundAmount;
    const orderTotal = parseFloat(order.total || 0);
    
    // Get actual paid amount (from payment records or order total)
    let actualPaidAmount = orderTotal;
    if (order.order_payments && order.order_payments.length > 0) {
      actualPaidAmount = order.order_payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    }
    
    // Validate refund amount doesn't exceed what was actually paid
    if (totalRefunded > actualPaidAmount) {
      throw new Error(`Refund amount (₹${totalRefunded}) cannot exceed paid amount (₹${actualPaidAmount})`);
    }

    // Prevent refund greater than order total
    if (totalRefunded > orderTotal) {
      throw new Error(`Total refund (₹${totalRefunded}) cannot exceed order total (₹${orderTotal})`);
    }

    const newPaymentStatus = totalRefunded >= orderTotal ? 'refunded' : 'partially_refunded';

    // 3. Update order with refund details
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        refund_amount: totalRefunded,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (orderUpdateError) throw orderUpdateError;

    // 4. Update payment record if exists
    if (order.order_payments && order.order_payments.length > 0) {
      const payment = order.order_payments[0];
      const newRefundAmount = (parseFloat(payment.refund_amount || 0)) + refundAmount;
      
      const { error: paymentUpdateError } = await supabase
        .from('order_payments')
        .update({
          refund_amount: newRefundAmount,
          refund_reason: reason,
          refund_method: refundMethod,
          refunded_at: new Date().toISOString(),
          status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (paymentUpdateError) {
        console.error('Failed to update payment record:', paymentUpdateError);
        // Continue - order refund is still recorded
      }
    }

    return {
      success: true,
      order: updatedOrder,
      totalRefunded,
      status: newPaymentStatus
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Create a complaint/issue report for an order
 * @param {Object} complaintData - {orderId, issueType, description, priority, actionTaken, reportedBy}
 * @returns {Object} Created complaint record
 */
export const createComplaint = async (complaintData) => {
  try {
    const { orderId, issueType, description, priority, actionTaken, reportedBy } = complaintData;
    
    // Validation
    if (!orderId) throw new Error('Order ID is required');
    if (!issueType) throw new Error('Issue type is required');
    const validIssueTypes = ['food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other'];
    if (!validIssueTypes.includes(issueType)) {
      throw new Error(`Invalid issue type. Must be one of: ${validIssueTypes.join(', ')}`);
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    // 1. Get order details to extract restaurant_id, table_id, table_number
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id, table_id, table_number')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // 2. Insert complaint record with issue_type (singular)
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        table_id: order.table_id,
        table_number: order.table_number,
        issue_type: issueType, // Changed from issue_types to issue_type
        description: description.trim(),
        priority: priority || 'medium',
        status: 'open',
        action_taken: actionTaken || null,
        reported_by: reportedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (complaintError) throw complaintError;

    return {
      success: true,
      complaint
    };
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw new Error(`Failed to create complaint: ${error.message}`);
  }
};

/**
 * Update an existing complaint
 * @param {string} complaintId - Complaint ID
 * @param {Object} updates - Fields to update (status, action_taken, resolved_by, etc.)
 * @returns {Object} Updated complaint record
 */
export const updateComplaint = async (complaintId, updates) => {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // If status is being set to resolved, set resolved_at timestamp
    if (updates.status === 'resolved' && !updates.resolved_at) {
      payload.resolved_at = new Date().toISOString();
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      complaint
    };
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw new Error(`Failed to update complaint: ${error.message}`);
  }
};

/**
 * Get complaints for a restaurant with optional filters
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} filters - Optional filters (status, priority, startDate, endDate)
 * @returns {Array} Array of complaint records
 */
export const getComplaints = async (restaurantId, filters = {}) => {
  try {
    let query = supabase
      .from('complaints')
      .select('*, orders(id, order_number, table_number)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: complaints, error } = await query;

    if (error) throw error;

    return complaints || [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
};

// Update order items and totals
export const updateOrder = async (orderId, updates) => {
  // Map frontend-friendly keys to DB column names
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

  // Ensure items is JSON serializable (array or object). Supabase JSONB accepts arrays directly.
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

// Update a single item's status within an order's items JSONB array
export const updateOrderItemStatus = async (orderId, menuItemId, nextStatus) => {
  // Fetch current items to avoid race conditions
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

  // Decide overall order_status based on item statuses
  const statuses = items.map((it) => it.item_status || 'queued');
  let overallStatus = undefined;
  const allServed = statuses.length > 0 && statuses.every((s) => s === 'served');
  const allReadyOrServed = statuses.length > 0 && statuses.every((s) => s === 'ready' || s === 'served');
  const anyPreparingLike = statuses.some((s) => s === 'queued' || s === 'received' || s === 'preparing');
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

// Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  // When payment is successful, also update order_status to 'received' so it shows in chef dashboard
  const updateData = { 
    payment_status: paymentStatus, 
    updated_at: new Date().toISOString() 
  };
  
  // If payment is successful, change order status from 'pending_payment' to 'received'
  if (paymentStatus === 'paid') {
    updateData.order_status = 'received';
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Apply discount to order
/**
 * Apply discount to an order
 * @param {string} orderId - Order ID  
 * @param {Object} discountData - {type, value, amount, reason, newTotal}
 * @returns {Object} Updated order with discount applied
 */
export const applyDiscount = async (orderId, discountData) => {
  try {
    const { type, value, amount, reason, newTotal } = discountData;
    
    // Validation
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

    // Fetch current order to validate discount against original amount
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('total, subtotal, discount_amount')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    const originalTotal = currentOrder.total + (currentOrder.discount_amount || 0);
    
    // Prevent discount greater than original bill amount
    if (amount > originalTotal) {
      throw new Error(`Discount amount (₹${amount}) cannot exceed original bill amount (₹${originalTotal})`);
    }

    // Prevent negative final total
    if (newTotal < 0) {
      throw new Error('Discount would result in negative total. Please reduce the discount.');
    }

    // Note: type and value are validated but not stored in DB
    // The discount_amount and discount_reason are sufficient for tracking
    const updateData = {
      discount_amount: amount,
      discount_reason: reason,
      total: newTotal,
      updated_at: new Date().toISOString()
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

// Get orders for chef dashboard
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

// Create payment record
export const createPayment = async (paymentData) => {
  const rid = resolveRestaurantId(paymentData?.restaurant_id);
  const { data, error } = await supabase
    .from('order_payments')  // Changed from 'payments' to 'order_payments'
    .insert([{ ...paymentData, restaurant_id: rid }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update payment record
export const updatePayment = async (paymentId, paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .update(paymentData)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Process split payment (cash + online)
 * @param {string} orderId - Order ID
 * @param {number} cashAmount - Cash portion
 * @param {number} onlineAmount - Online portion
 * @param {string} razorpayPaymentId - Razorpay payment ID for online portion
 * @returns {Object} Updated order with split payment details
 */
export const processSplitPayment = async (orderId, cashAmount, onlineAmount, razorpayPaymentId = null) => {
  try {
    // Validation
    if (!orderId) throw new Error('Order ID is required');
    if (!cashAmount || cashAmount <= 0) {
      throw new Error('Cash amount must be greater than 0');
    }
    if (!onlineAmount || onlineAmount <= 0) {
      throw new Error('Online amount must be greater than 0');
    }

    // Get order to validate total
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('total, restaurant_id')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!order) throw new Error('Order not found');

    const totalPayment = cashAmount + onlineAmount;
    const orderTotal = parseFloat(order.total || 0);

    // Validate payment amount matches order total
    if (Math.abs(totalPayment - orderTotal) > 0.01) {
      throw new Error(`Split payment total (₹${totalPayment}) does not match order total (₹${orderTotal})`);
    }

    // Prepare split payment details
    const splitDetails = {
      cash_amount: cashAmount,
      online_amount: onlineAmount,
      split_timestamp: new Date().toISOString()
    };

    if (razorpayPaymentId) {
      splitDetails.razorpay_payment_id = razorpayPaymentId;
    }

    // Update order with split payment details
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: 'split',
        payment_split_details: splitDetails,
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create payment record for the online portion if razorpayPaymentId exists
    if (razorpayPaymentId) {
      await createPayment({
        order_id: orderId,
        restaurant_id: order.restaurant_id,
        razorpay_payment_id: razorpayPaymentId,
        amount: onlineAmount,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay',
        payment_details: { split_payment: true, cash_amount: cashAmount }
      });
    }

    return {
      success: true,
      order: updatedOrder,
      splitDetails
    };
  } catch (error) {
    console.error('Error processing split payment:', error);
    throw new Error(`Failed to process split payment: ${error.message}`);
  }
};

/**
 * Handle full split payment workflow including Razorpay processing
 * @param {string} orderId - Order ID
 * @param {Object} payments - {cash: number, online: number, razorpayDetails: object}
 * @returns {Object} Payment result
 */
export const handleSplitPayment = async (orderId, payments) => {
  try {
    const { cash, online, razorpayDetails } = payments;

    // Validation
    if (!cash || cash <= 0) {
      throw new Error('Cash amount must be greater than 0');
    }
    if (!online || online <= 0) {
      throw new Error('Online amount must be greater than 0');
    }

    let razorpayPaymentId = null;

    // If online payment details provided, verify/capture payment
    if (razorpayDetails) {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = razorpayDetails;
      
      if (!razorpay_payment_id) {
        throw new Error('Razorpay payment ID is required for online portion');
      }

      razorpayPaymentId = razorpay_payment_id;

      // Verify Razorpay signature via Edge Function (server-side verification)
      if (razorpay_order_id && razorpay_signature) {
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_id: orderId,
            restaurant_id: resolveRestaurantId()
          }
        });
        
        if (verifyError || !verifyResult?.success) {
          throw new Error(verifyResult?.error || 'Payment verification failed');
        }
      }
    }

    // Process the split payment
    const result = await processSplitPayment(orderId, cash, online, razorpayPaymentId);

    return result;
  } catch (error) {
    console.error('Error handling split payment:', error);
    throw new Error(`Failed to handle split payment: ${error.message}`);
  }
};

// Helper function to transform order data from database format to frontend format
const transformOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    status: order.order_status, // Map order_status to status for frontend
    total_amount: order.total, // Map total to total_amount
    subtotal_amount: order.subtotal, // Map subtotal to subtotal_amount
    tax_amount: order.tax, // Map tax to tax_amount
  };
};

// Subscribe to order updates (for real-time)
export const subscribeToOrders = async (restaurantId, onOrderChange, onError) => {
  const rid = resolveRestaurantId(restaurantId);

  try {
    // First, fetch all existing orders
    const { data: initialOrders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        tables (
          table_number,
          table_name
        )
      `)
      .eq('restaurant_id', rid)
      .neq('order_status', 'pending_payment') // Exclude orders waiting for payment
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching initial orders:', fetchError);
      throw fetchError;
    }
    

    // Transform and send initial orders to callback
    if (onOrderChange) {
      try {
        const transformedOrders = (initialOrders || []).map(transformOrder);
        onOrderChange(transformedOrders);
      } catch (transformError) {
        console.error('Error transforming orders:', transformError);
        throw transformError;
      }
    }

    // Then subscribe to changes
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
            // Refetch all orders to get updated data with joins
            const { data: updatedOrders, error: refetchError } = await supabase
              .from('orders')
              .select(`
                *,
                tables (
                  table_number,
                  table_name
                )
              `)
              .eq('restaurant_id', rid)
              .neq('order_status', 'pending_payment') // Exclude orders waiting for payment
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
        if (status === 'SUBSCRIBED') {
          // Subscription successfully established
        }
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
        if (status === 'CLOSED') {
          // Channel closed intentionally
        }
      });

    // Return unsubscribe function
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

// Subscribe to specific order updates
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

export default supabase;

// --- Demo environment provisioning ---
// Attempt to find or create a demo restaurant with minimal seed.
// Returns { id, slug: 'demo', created, seeded } or throws on unexpected errors.
export const ensureDemoRestaurant = async () => {
  const slug = 'demo';
  let id = null;
  let created = false;
  let seeded = false;

  // Try to find existing demo restaurant
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, slug')
      .ilike('slug', slug)
      .limit(1);
    if (!error && data && data.length > 0) {
      id = data[0].id;
    }
  } catch {
    // Likely RLS for unauthenticated users; continue to creation attempt
  }

  // If not found, try to create (may fail under RLS when unauthenticated)
  if (!id) {
    try {
      const { data: ins, error: insErr } = await supabase
        .from('restaurants')
        .insert([{ name: 'Demo Restaurant', slug, is_active: true }])
        .select('id')
        .single();
      if (!insErr && ins?.id) {
        id = ins.id;
        created = true;
      }
    } catch {
      // Could not create due to RLS; we'll gracefully fallback
    }
  }

  // Seed minimal data if we have an id and probably empty dataset
  if (id) {
    try {
      // Ensure at least 2 tables
      const { count: tableCount } = await supabase
        .from('tables')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', id);
      if ((tableCount || 0) < 2) {
        await supabase.from('tables').insert([
          { restaurant_id: id, table_number: '1', capacity: 4, is_active: true },
          { restaurant_id: id, table_number: '2', capacity: 4, is_active: true },
        ]);
      }

      // Ensure at least 3 menu items
      const { count: itemCount } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', id);
      if ((itemCount || 0) < 3) {
        await supabase.from('menu_items').insert([
          { restaurant_id: id, name: 'Masala Dosa', category: 'Main', price: 120, is_available: true },
          { restaurant_id: id, name: 'Butter Chicken', category: 'Main', price: 250, is_available: true },
          { restaurant_id: id, name: 'Mango Lassi', category: 'Beverages', price: 90, is_available: true },
        ]);
      }
      seeded = true;
    } catch {
      // Seeding failed (likely RLS); ignore and fallback gracefully
    }
  }

  return { id, slug, created, seeded };
};
