-- ============================================================================
-- TRIGGER: Cascade delete auth users when a user is deleted from users table
-- This ensures users are removed from auth.users when deleted from public.users
-- ============================================================================

-- Function to delete auth user when user record is deleted
CREATE OR REPLACE FUNCTION public.delete_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is an owner (they shouldn't be auto-deleted)
  IF OLD.is_owner = true THEN
    RETURN OLD;
  END IF;
  
  -- Delete audit trail (ignore errors)
  DELETE FROM public.audit_trail WHERE actor_id = OLD.id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't block the delete
  RAISE WARNING 'Trigger error for user %: %', OLD.email, SQLERRM;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_delete_restaurant_auth_users ON public.restaurants;
DROP TRIGGER IF EXISTS trigger_delete_user_from_auth ON public.users;

-- Create trigger on USERS table (fires when a user is deleted, including by CASCADE)
CREATE TRIGGER trigger_delete_user_from_auth
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_from_auth();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.delete_user_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_from_auth() TO service_role;

-- ============================================================================
-- HOW IT WORKS:
-- 1. Restaurant has CASCADE delete on users (restaurant_id foreign key)
-- 2. When restaurant is deleted, users with that restaurant_id are deleted
-- 3. This trigger fires BEFORE each user delete
-- 4. Trigger deletes the corresponding auth.users entry
-- ============================================================================
