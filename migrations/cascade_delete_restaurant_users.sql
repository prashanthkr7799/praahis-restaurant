-- ============================================================================
-- TRIGGER: Cascade delete auth users when restaurant is deleted
-- This ensures users are removed from both the users table AND auth.users
-- ============================================================================

-- Function to delete auth users when restaurant is deleted
CREATE OR REPLACE FUNCTION public.delete_restaurant_auth_users()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users belonging to the deleted restaurant
  -- Exclude owners (is_owner = true) as they may manage multiple restaurants
  FOR user_record IN 
    SELECT id, email FROM public.users 
    WHERE restaurant_id = OLD.id AND (is_owner IS NULL OR is_owner = false)
  LOOP
    BEGIN
      -- Delete related audit trail records first
      DELETE FROM public.audit_trail WHERE actor_id = user_record.id;
      
      -- Delete from auth.users
      DELETE FROM auth.users WHERE id = user_record.id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue - user might already be deleted or not exist
      RAISE WARNING 'Could not delete auth user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_delete_restaurant_auth_users ON public.restaurants;

-- Create trigger that fires BEFORE delete (so we can access users before cascade)
CREATE TRIGGER trigger_delete_restaurant_auth_users
  BEFORE DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_restaurant_auth_users();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.delete_restaurant_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_restaurant_auth_users() TO service_role;

-- ============================================================================
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- 
-- This trigger will:
-- 1. Fire BEFORE a restaurant is deleted
-- 2. Find all users belonging to that restaurant (except owners)
-- 3. Delete them from auth.users
-- 4. The CASCADE on the foreign key will then delete from public.users
-- ============================================================================
