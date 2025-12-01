-- ============================================================================
-- 23_fix_users_policies_recursion.sql
-- Replace problematic users policies that caused infinite recursion by
-- using helper functions instead of subselects on the same table.
-- ============================================================================

-- Drop potentially-recursive policies
DROP POLICY IF EXISTS manager_users_select_restaurant ON public.users;
DROP POLICY IF EXISTS manager_users_update_restaurant ON public.users;
DROP POLICY IF EXISTS platform_admin_users_insert ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;

-- 1) Allow authenticated users to insert their OWN profile row (id must match auth.uid())
CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- 2) Allow platform admins to insert any user (uses helper function)
CREATE POLICY platform_admin_users_insert ON public.users
  FOR INSERT
  WITH CHECK (public.is_platform_admin());

-- 3) SELECT policy: allow platform admins, self, or users in the same restaurant
DROP POLICY IF EXISTS users_select_for_managers ON public.users;
CREATE POLICY users_select_for_managers ON public.users
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_platform_admin()
    OR public.user_belongs_to_restaurant(restaurant_id)
  );

-- 4) UPDATE policy: allow platform admins or managers/admins in same restaurant
DROP POLICY IF EXISTS users_update_for_managers ON public.users;
CREATE POLICY users_update_for_managers ON public.users
  FOR UPDATE
  USING (
    public.is_platform_admin()
    OR public.user_has_role_in_restaurant(restaurant_id, ARRAY['manager','admin'])
  )
  WITH CHECK (
    public.is_platform_admin()
    OR public.user_has_role_in_restaurant(restaurant_id, ARRAY['manager','admin'])
  );

-- 5) Keep owner policies intact (platform owners already handled elsewhere)

-- Ensure the policies are active for authenticated role where needed (these are policies on table; the GRANT execute for helper functions exists already)

-- End migration
