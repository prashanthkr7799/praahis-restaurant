-- ============================================================================
-- RPC Function: owner_create_manager
-- Allows platform owners to create manager accounts for any restaurant
-- This bypasses RLS using SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.owner_create_manager(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_restaurant_id uuid,
  p_role text DEFAULT 'manager',
  p_is_active boolean DEFAULT true
) RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_owner BOOLEAN;
  outrow public.users;
  new_role text;
BEGIN
  -- Check if caller is a platform owner
  SELECT COALESCE(is_owner, false) INTO caller_is_owner 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF NOT COALESCE(caller_is_owner, false) THEN
    RAISE EXCEPTION 'Only platform owners can create managers';
  END IF;
  
  -- Validate role
  new_role := LOWER(TRIM(COALESCE(p_role, 'manager')));
  IF new_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be manager or admin', new_role;
  END IF;
  
  -- Validate restaurant exists
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
  END IF;
  
  -- Insert or update the user
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    name,
    phone, 
    restaurant_id, 
    role, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    p_id, 
    LOWER(TRIM(p_email)), 
    COALESCE(NULLIF(TRIM(p_full_name), ''), p_email),
    COALESCE(NULLIF(TRIM(p_full_name), ''), p_email),
    NULLIF(TRIM(p_phone), ''), 
    p_restaurant_id, 
    new_role, 
    p_is_active, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        restaurant_id = EXCLUDED.restaurant_id,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
  RETURNING * INTO outrow;
  
  RETURN outrow;
END;
$$;

-- Grant execute to authenticated users (function itself checks for owner role)
REVOKE ALL ON FUNCTION public.owner_create_manager(uuid, text, text, text, uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_create_manager(uuid, text, text, text, uuid, text, boolean) TO authenticated;

-- ============================================================================
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- ============================================================================
