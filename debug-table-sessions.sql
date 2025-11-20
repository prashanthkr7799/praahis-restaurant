-- Debug query to check table_sessions
SELECT 
  id,
  table_id,
  status,
  cart_items,
  created_at,
  last_activity_at,
  updated_at
FROM public.table_sessions
WHERE id = '0ddfb2c5-4a47-4bbd-ae3c-a409e82d3e6a';

-- Also check all active sessions
SELECT 
  id,
  table_id,
  status,
  jsonb_array_length(COALESCE(cart_items, '[]'::jsonb)) as cart_item_count,
  last_activity_at
FROM public.table_sessions
WHERE status = 'active'
ORDER BY last_activity_at DESC
LIMIT 5;
