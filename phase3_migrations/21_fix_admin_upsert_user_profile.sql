-- ============================================================================
-- 21_fix_admin_upsert_user_profile.sql
-- Fix admin_upsert_user_profile to work for platform admins/superadmins
-- ============================================================================

-- Drop and recreate the function with better permissions logic
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
  is_platform_admin boolean := false;
  outrow public.users;
  new_role text := NULLIF(TRIM(LOWER(p_role)), '');
BEGIN
  -- Check if caller is a platform admin/superadmin first
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_platform_admin;

  -- Get caller's profile from users table
  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  
  -- Authorization checks:
  -- 1. Platform admins can create users for any restaurant
  -- 2. Restaurant managers/admins can only create for their own restaurant
  IF is_platform_admin THEN
    -- Platform admin - allowed to create users for any restaurant
    NULL; -- proceed
  ELSIF me.id IS NULL THEN
    RAISE EXCEPTION 'Not a staff user';
  ELSIF me.role NOT IN ('manager','admin') THEN
    RAISE EXCEPTION 'Insufficient role';
  ELSIF p_restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant insert not allowed';
  END IF;

  -- Validate role
  IF new_role IS NOT NULL AND new_role NOT IN ('admin','manager','chef','waiter') THEN
    RAISE EXCEPTION 'Invalid role %', new_role;
  END IF;

  -- Perform the upsert
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

-- Ensure grants are correct
REVOKE ALL ON FUNCTION public.admin_upsert_user_profile(uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_user_profile(uuid, text, text, text, text, uuid) TO authenticated;

-- Also fix admin_update_staff to allow platform admins
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
  is_platform_admin boolean := false;
  new_role text := NULLIF(TRIM(LOWER(p_role)), '');
BEGIN
  -- Check if caller is a platform admin/superadmin first
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_platform_admin;

  SELECT * INTO me FROM public.users WHERE id = auth.uid();
  
  -- Get target user
  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Target user not found'; END IF;

  -- Authorization checks
  IF is_platform_admin THEN
    -- Platform admin can update any user
    NULL;
  ELSIF me.id IS NULL THEN 
    RAISE EXCEPTION 'Not a staff user'; 
  ELSIF me.role NOT IN ('manager','admin') THEN 
    RAISE EXCEPTION 'Insufficient role'; 
  ELSIF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cross-restaurant update not allowed';
  END IF;

  -- Validate role
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

-- Also fix admin_set_staff_active
CREATE OR REPLACE FUNCTION public.admin_set_staff_active(target_id uuid, p_is_active boolean)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  target public.users;
  is_platform_admin boolean := false;
BEGIN
  -- Check if caller is a platform admin/superadmin first
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_platform_admin;

  SELECT * INTO me FROM public.users WHERE id = auth.uid();

  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Authorization checks
  IF is_platform_admin THEN
    -- Platform admin can update any user
    NULL;
  ELSIF me.id IS NULL THEN
    RAISE EXCEPTION 'Not a staff user';
  ELSIF me.role NOT IN ('manager','admin') THEN
    RAISE EXCEPTION 'Insufficient role';
  ELSIF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
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

-- Also fix admin_delete_staff_member
CREATE OR REPLACE FUNCTION public.admin_delete_staff_member(target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.users;
  target public.users;
  is_platform_admin boolean := false;
BEGIN
  -- Check if caller is a platform admin/superadmin first
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_platform_admin;

  SELECT * INTO me FROM public.users WHERE id = auth.uid();

  -- Get target user
  SELECT * INTO target FROM public.users WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Authorization checks
  IF is_platform_admin THEN
    -- Platform admin can delete any user
    NULL;
  ELSIF me.id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  ELSIF me.role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  ELSIF target.id = me.id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  ELSIF target.restaurant_id IS DISTINCT FROM me.restaurant_id THEN
    RAISE EXCEPTION 'Cannot delete staff from other restaurants';
  END IF;

  -- Delete from public.users (this should cascade to related tables)
  DELETE FROM public.users WHERE id = target_id;
  
  -- Try to delete from auth.users (this requires admin privileges)
  BEGIN
    DELETE FROM auth.users WHERE id = target_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete from auth.users: %', SQLERRM;
  END;
  
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_staff_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_staff_member(uuid) TO authenticated;
