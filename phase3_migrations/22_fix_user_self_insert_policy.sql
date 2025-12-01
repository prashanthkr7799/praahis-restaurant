-- ============================================================================
-- 22_fix_user_self_insert_policy.sql
-- Allow users to insert their own profile row if it matches auth.uid()
-- ============================================================================

-- Allow authenticated users to insert their OWN row (id must match auth.uid())
DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self ON public.users 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Also allow platform admins to insert any user
DROP POLICY IF EXISTS platform_admin_users_insert ON public.users;
CREATE POLICY platform_admin_users_insert ON public.users 
  FOR INSERT 
  WITH CHECK (public.is_platform_admin());

-- Allow managers to view staff in their restaurant
DROP POLICY IF EXISTS manager_users_select_restaurant ON public.users;
CREATE POLICY manager_users_select_restaurant ON public.users 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Allow managers/admins to update staff in their restaurant
DROP POLICY IF EXISTS manager_users_update_restaurant ON public.users;
CREATE POLICY manager_users_update_restaurant ON public.users 
  FOR UPDATE 
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
