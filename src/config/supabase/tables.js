/**
 * Table Management Functions
 * Handle table queries, status updates, and sessions
 */

import { supabase } from './client';
import { resolveRestaurantId } from './restaurant';

/**
 * Fetch table info by ID, table number, or 'demo'
 */
export const getTable = async (tableIdOrNumber, restaurantSlug = null) => {
  // Check if it's a UUID or table number
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    tableIdOrNumber
  );
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

  let query = supabase.from('tables').select('*').eq('is_active', true);

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
    throw new Error(
      `Table not found: ${tableIdOrNumber}${restaurantSlug ? ` at restaurant ${restaurantSlug}` : ''}`
    );
  }

  // Return the first table (in case of duplicates)
  return data[0];
};

/**
 * Fetch all tables for a restaurant
 */
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

/**
 * Mark table as occupied when customer enters
 */
export const markTableOccupied = async (tableId) => {
  try {
    // Import dynamically to avoid circular dependency
    const { getOrCreateActiveSessionId } = await import('./sessions');

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
