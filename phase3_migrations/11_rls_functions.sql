-- ============================================================================
-- 11_rls_functions.sql
-- Recursion-free SECURITY DEFINER helper functions for RLS
-- ============================================================================

-- user_belongs_to_restaurant(restaurant_id)
CREATE OR REPLACE FUNCTION public.user_belongs_to_restaurant(p_restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND restaurant_id = p_restaurant_id);
END;$$;

-- user_has_role_in_restaurant(restaurant_id, roles[])
CREATE OR REPLACE FUNCTION public.user_has_role_in_restaurant(p_restaurant_id UUID, p_roles TEXT[])
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND restaurant_id = p_restaurant_id AND role = ANY(p_roles));
END;$$;

-- is_platform_admin()
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active);
END;$$;

-- is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND role='superadmin' AND is_active);
END;$$;

-- is_platform_owner() (legacy owner flag)
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_owner BOOLEAN; BEGIN SELECT is_owner INTO v_owner FROM public.users WHERE id = auth.uid() LIMIT 1; RETURN COALESCE(v_owner,false); EXCEPTION WHEN OTHERS THEN RETURN false; END; $$;

GRANT EXECUTE ON FUNCTION public.user_belongs_to_restaurant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_restaurant(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

-- END RLS FUNCTIONS

-- ============================================================================
-- Staff admin helper RPCs (SECURITY DEFINER)
-- Provide manager/admin staff operations without relying on recursive RLS
-- These functions perform their own authorization checks and run as definer.
-- ============================================================================

-- 1) List staff for the current user's restaurant
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

-- 2) Activate/Deactivate a staff member in same restaurant (manager/admin only)
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
  IF me.id IS NULL THEN
    RAISE EXCEPTION 'Not a staff user';
  END IF;
  IF me.role NOT IN ('manager','admin') THEN
    RAISE EXCEPTION 'Insufficient role';
  END IF;

  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  IF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant update not allowed';
  END IF;

  UPDATE public.users
    SET is_active = COALESCE(p_is_active, target.is_active),
        updated_at = NOW()
    WHERE id = target.id
    RETURNING * INTO target;
  RETURN target;
END$$;

REVOKE ALL ON FUNCTION public.admin_set_staff_active(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_active(uuid, boolean) TO authenticated;

-- 3) Update staff profile fields (manager/admin only, same restaurant)
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

  IF new_role IS NOT NULL AND new_role NOT IN ('admin','manager','chef','waiter') THEN
    RAISE EXCEPTION 'Invalid role %', new_role;
  END IF;

  UPDATE public.users
    SET full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), target.full_name),
        phone = COALESCE(NULLIF(TRIM(p_phone), ''), target.phone),
        role = COALESCE(new_role, target.role),
        is_active = COALESCE(p_is_active, target.is_active),
        updated_at = NOW()
    WHERE id = target.id
    RETURNING * INTO target;
  RETURN target;
END$$;

REVOKE ALL ON FUNCTION public.admin_update_staff(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(uuid, text, text, text, boolean) TO authenticated;

-- 4) Upsert a user profile row for a staff member (manager/admin only)
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
  IF new_role IS NOT NULL AND new_role NOT IN ('admin','manager','chef','waiter') THEN
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

-- 5) Permanently delete a staff member (manager/admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_staff_member(target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  target public.users;
BEGIN
  -- Get current user
  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  IF me.id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only managers and admins can delete staff
  IF me.role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Get target user
  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Prevent deleting yourself
  IF target.id = me.id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  
  -- Prevent cross-restaurant deletion
  IF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cannot delete staff from other restaurants';
  END IF;

  -- Delete from public.users (this should cascade to related tables)
  DELETE FROM public.users WHERE id = target_id;
  
  -- Try to delete from auth.users (this requires admin privileges)
  -- Note: This might fail if not running as service role, but that's okay
  -- The auth.users entry will be orphaned but won't affect the UI
  BEGIN
    DELETE FROM auth.users WHERE id = target_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the operation
      RAISE NOTICE 'Could not delete from auth.users: %', SQLERRM;
  END;
  
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_staff_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_staff_member(uuid) TO authenticated;

-- END STAFF ADMIN RPCs
