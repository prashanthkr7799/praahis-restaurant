/**
 * Restaurant Context Helper
 * Utilities for resolving restaurant ID and scoping queries
 */

import { supabase } from './client';
import { getActiveRestaurantId } from '@shared/services/restaurantContextStore';

// Default restaurant ID (from seed data)
const DEFAULT_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Resolve restaurant id from param or runtime context
 */
export const resolveRestaurantId = (maybeId) => {
  return maybeId || getActiveRestaurantId(DEFAULT_RESTAURANT_ID) || DEFAULT_RESTAURANT_ID;
};

/**
 * Helper to scope queries by restaurant automatically
 * Usage: fromRestaurant('orders').select('*').gte(...)
 * Note: In supabase-js v2, filters like .eq() are available AFTER .select()/update()/delete()
 * so this helper exposes those methods and applies the restaurant_id filter for you.
 */
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

/**
 * Fetch restaurant info by ID
 */
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

/**
 * Ensure demo restaurant exists with minimal data
 */
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
          {
            restaurant_id: id,
            name: 'Masala Dosa',
            category: 'Main',
            price: 120,
            is_available: true,
          },
          {
            restaurant_id: id,
            name: 'Butter Chicken',
            category: 'Main',
            price: 250,
            is_available: true,
          },
          {
            restaurant_id: id,
            name: 'Mango Lassi',
            category: 'Beverages',
            price: 90,
            is_available: true,
          },
        ]);
      }
      seeded = true;
    } catch {
      // Seeding failed (likely RLS); ignore and fallback gracefully
    }
  }

  return { id, slug, created, seeded };
};

export { DEFAULT_RESTAURANT_ID };
