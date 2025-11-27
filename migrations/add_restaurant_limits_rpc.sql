-- Migration: Add RPC function to get restaurant limits
-- This allows managers to check their restaurant's limits without needing direct access to restaurants table

-- Function to get restaurant limits for the current user's restaurant
CREATE OR REPLACE FUNCTION public.get_restaurant_limits()
RETURNS TABLE (
  max_tables integer,
  max_users integer,
  max_menu_items integer,
  current_tables bigint,
  current_users bigint,
  current_menu_items bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_restaurant_id uuid;
BEGIN
  -- Get the current user's restaurant_id
  SELECT restaurant_id INTO my_restaurant_id 
  FROM public.users 
  WHERE id = auth.uid();

  IF my_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with a restaurant';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(r.max_tables, 999) as max_tables,
    COALESCE(r.max_users, 999) as max_users,
    COALESCE(r.max_menu_items, 999) as max_menu_items,
    (SELECT COUNT(*) FROM public.tables t WHERE t.restaurant_id = my_restaurant_id) as current_tables,
    (SELECT COUNT(*) FROM public.users u WHERE u.restaurant_id = my_restaurant_id AND u.role IN ('chef', 'waiter', 'staff')) as current_users,
    (SELECT COUNT(*) FROM public.menu_items m WHERE m.restaurant_id = my_restaurant_id) as current_menu_items
  FROM public.restaurants r
  WHERE r.id = my_restaurant_id;
END;
$$;

-- Grant access to authenticated users
REVOKE ALL ON FUNCTION public.get_restaurant_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restaurant_limits() TO authenticated;

COMMENT ON FUNCTION public.get_restaurant_limits() IS 'Returns the resource limits and current counts for the authenticated user''s restaurant';
