-- ============================================================================
-- Quick Multi-Device Cart Testing Queries
-- Run these in Supabase SQL Editor to verify and test your setup
-- ============================================================================

-- 1. Check if you have any restaurants
SELECT id, name, slug FROM restaurants LIMIT 5;

-- 2. Check if you have any tables
SELECT 
  t.id,
  t.table_number,
  t.status,
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM tables t
JOIN restaurants r ON r.id = t.restaurant_id
WHERE t.is_active = true
LIMIT 10;

-- 3. Check if you have menu items
SELECT 
  mi.id,
  mi.name,
  mi.price,
  r.name as restaurant_name
FROM menu_items mi
JOIN restaurants r ON r.id = mi.restaurant_id
WHERE mi.is_available = true
LIMIT 10;

-- 4. After you open a table in browser, run this to see the active session:
SELECT 
  ts.id as session_id,
  t.table_number,
  ts.status,
  ts.cart_items,
  jsonb_array_length(ts.cart_items) as item_count,
  ts.created_at,
  ts.last_activity_at
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'active'
ORDER BY ts.created_at DESC;

-- 5. After adding items to cart, run this to see cart contents:
SELECT 
  ts.id as session_id,
  t.table_number,
  ts.cart_items,
  ts.last_activity_at
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'active'
  AND jsonb_array_length(ts.cart_items) > 0
ORDER BY ts.last_activity_at DESC;

-- 6. Test: Manually create a session for testing (optional)
-- Replace the UUIDs with real IDs from your tables/restaurants
-- INSERT INTO table_sessions (table_id, restaurant_id, status, cart_items)
-- SELECT 
--   t.id as table_id,
--   t.restaurant_id,
--   'active' as status,
--   '[]'::jsonb as cart_items
-- FROM tables t
-- WHERE t.table_number = 1
-- LIMIT 1
-- RETURNING id, table_id;

-- 7. Clean up all test sessions (use carefully!)
-- UPDATE table_sessions
-- SET status = 'completed', ended_at = NOW()
-- WHERE status = 'active';

-- ============================================================================
-- Testing Workflow:
-- ============================================================================
-- 1. Run query #1, #2, #3 to verify you have data
-- 2. Open table in browser: http://localhost:5173/table/[TABLE_ID]?restaurant=[SLUG]
-- 3. Open browser console (F12) → Should see "Database-driven session ID"
-- 4. Run query #4 → Should now see 1 active session
-- 5. Add item to cart in browser
-- 6. Run query #5 → Should see cart_items with your item
-- 7. Open same URL in another tab/device → Should see same items
-- ============================================================================
