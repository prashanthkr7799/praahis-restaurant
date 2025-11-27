-- ============================================================================
-- COMPLETE SQL MIGRATION - Praahis Restaurant Management System
-- Run this in Supabase SQL Editor
-- Date: November 26, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: RESTAURANT LIMITS RPC FUNCTION
-- Allows managers to check limits without direct access to restaurants table
-- ============================================================================

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

REVOKE ALL ON FUNCTION public.get_restaurant_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restaurant_limits() TO authenticated;

COMMENT ON FUNCTION public.get_restaurant_limits() IS 'Returns the resource limits and current counts for the authenticated user restaurant';

-- ============================================================================
-- SECTION 2: ENSURE USERS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Ensure full_name column exists and has proper default
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
  END IF;
END $$;

-- Ensure phone column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: LIST STAFF FOR CURRENT RESTAURANT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.list_staff_for_current_restaurant()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.*
  FROM public.users u
  WHERE u.restaurant_id = (
    SELECT restaurant_id FROM public.users WHERE id = auth.uid()
  )
  AND u.id IN (
    -- Only include users that still exist in auth.users
    SELECT id FROM auth.users
  )
  ORDER BY u.is_active DESC, u.role, u.full_name NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.list_staff_for_current_restaurant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_staff_for_current_restaurant() TO authenticated;

-- ============================================================================
-- SECTION 4: ADMIN UPSERT USER PROFILE FUNCTION
-- Used when creating new staff members
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_upsert_user_profile(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_phone text,
  p_restaurant_id uuid
) RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  outrow public.users;
  new_role text := NULLIF(TRIM(LOWER(p_role)), '');
BEGIN
  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  IF me.id IS NULL THEN RAISE EXCEPTION 'Not a staff user'; END IF;
  IF me.role NOT IN ('manager','admin') THEN RAISE EXCEPTION 'Insufficient role'; END IF;
  IF p_restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant insert not allowed';
  END IF;
  IF new_role IS NOT NULL AND new_role NOT IN ('admin','manager','chef','waiter','staff') THEN
    RAISE EXCEPTION 'Invalid role %', new_role;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, phone, restaurant_id, is_active, created_at, updated_at)
  VALUES (p_id, p_email, COALESCE(NULLIF(TRIM(p_full_name), ''), p_email), new_role, NULLIF(TRIM(p_phone), ''), p_restaurant_id, TRUE, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE public.users.role END,
        phone = EXCLUDED.phone,
        restaurant_id = EXCLUDED.restaurant_id,
        is_active = TRUE,
        updated_at = NOW()
  RETURNING * INTO outrow;
  RETURN outrow;
END$$;

REVOKE ALL ON FUNCTION public.admin_upsert_user_profile(uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_user_profile(uuid, text, text, text, text, uuid) TO authenticated;

-- ============================================================================
-- SECTION 5: ADMIN UPDATE STAFF FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_staff(
  target_id uuid,
  p_full_name text,
  p_phone text,
  p_role text,
  p_is_active boolean
) RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  target public.users;
  outrow public.users;
  new_role text := NULLIF(TRIM(LOWER(p_role)), '');
BEGIN
  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  IF me.id IS NULL THEN RAISE EXCEPTION 'Not a staff user'; END IF;
  IF me.role NOT IN ('manager','admin') THEN RAISE EXCEPTION 'Insufficient role'; END IF;

  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Target user not found'; END IF;
  IF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant update not allowed';
  END IF;
  IF new_role IS NOT NULL AND new_role NOT IN ('admin','manager','chef','waiter','staff') THEN
    RAISE EXCEPTION 'Invalid role %', new_role;
  END IF;

  UPDATE public.users SET
    full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
    phone = NULLIF(TRIM(p_phone), ''),
    role = COALESCE(new_role, role),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = target_id
  RETURNING * INTO outrow;

  RETURN outrow;
END$$;

REVOKE ALL ON FUNCTION public.admin_update_staff(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(uuid, text, text, text, boolean) TO authenticated;

-- ============================================================================
-- SECTION 6: ADMIN SET STAFF ACTIVE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_staff_active(target_id uuid, p_is_active boolean)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  target public.users;
BEGIN
  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  IF me.id IS NULL THEN RAISE EXCEPTION 'Not a staff user'; END IF;
  IF me.role NOT IN ('manager','admin') THEN RAISE EXCEPTION 'Insufficient role'; END IF;

  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Target user not found'; END IF;
  IF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant update not allowed';
  END IF;

  UPDATE public.users SET is_active = p_is_active, updated_at = NOW() WHERE id = target_id;
  RETURN target;
END$$;

REVOKE ALL ON FUNCTION public.admin_set_staff_active(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_active(uuid, boolean) TO authenticated;

-- ============================================================================
-- SECTION 7: FIX USERS WITH MISSING FULL_NAME
-- Set full_name to email prefix if NULL
-- ============================================================================

UPDATE public.users 
SET full_name = SPLIT_PART(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- ============================================================================
-- SECTION 8: ENSURE RESTAURANTS TABLE HAS LIMIT COLUMNS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'max_tables') THEN
    ALTER TABLE public.restaurants ADD COLUMN max_tables integer DEFAULT 20;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'max_users') THEN
    ALTER TABLE public.restaurants ADD COLUMN max_users integer DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'max_menu_items') THEN
    ALTER TABLE public.restaurants ADD COLUMN max_menu_items integer DEFAULT 100;
  END IF;
END $$;

-- Set default limits for restaurants that have NULL values
UPDATE public.restaurants SET max_tables = 20 WHERE max_tables IS NULL;
UPDATE public.restaurants SET max_users = 10 WHERE max_users IS NULL;
UPDATE public.restaurants SET max_menu_items = 100 WHERE max_menu_items IS NULL;

-- ============================================================================
-- SECTION 9: ENSURE SUBSCRIPTIONS TABLE HAS REQUIRED COLUMNS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'price_per_table') THEN
    ALTER TABLE public.subscriptions ADD COLUMN price_per_table numeric(10,2) DEFAULT 75;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_ends_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_end timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_start') THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_start timestamp with time zone;
  END IF;
END $$;

-- ============================================================================
-- SECTION 10: ENSURE TABLES HAVE REQUIRED COLUMNS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'zone') THEN
    ALTER TABLE public.tables ADD COLUMN zone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'capacity') THEN
    ALTER TABLE public.tables ADD COLUMN capacity integer DEFAULT 4;
  END IF;
END $$;

-- ============================================================================
-- SECTION 11: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for user lookups by restaurant
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Index for table lookups
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);

-- Index for menu items
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);

-- Index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- SECTION 12: GRANT PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can execute all RPC functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on auth.users for RPC functions (needed for list_staff_for_current_restaurant)
-- This is usually already granted but let's ensure it
GRANT SELECT ON auth.users TO postgres;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to check migration success)
-- ============================================================================

-- Check if get_restaurant_limits function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'get_restaurant_limits';

-- Check if list_staff_for_current_restaurant function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'list_staff_for_current_restaurant';

-- Check restaurants table columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name IN ('max_tables', 'max_users', 'max_menu_items');

-- Check users with missing full_name
SELECT COUNT(*) as users_without_name FROM public.users WHERE full_name IS NULL OR full_name = '';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
