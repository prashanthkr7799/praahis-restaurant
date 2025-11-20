-- ============================================================================
-- 12_rls_policies.sql
-- Canonical recursion-free RLS policies using helper functions
-- ============================================================================

-- Enable RLS on all target tables (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_credential_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS owner_users_select_all ON public.users;
CREATE POLICY owner_users_select_all ON public.users FOR SELECT USING (public.is_platform_owner());
DROP POLICY IF EXISTS owner_users_insert ON public.users;
CREATE POLICY owner_users_insert ON public.users FOR INSERT WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_users_update_all ON public.users;
CREATE POLICY owner_users_update_all ON public.users FOR UPDATE USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_users_delete ON public.users;
CREATE POLICY owner_users_delete ON public.users FOR DELETE USING (public.is_platform_owner());

-- RESTAURANTS
DROP POLICY IF EXISTS owner_restaurants_select_all ON public.restaurants;
CREATE POLICY owner_restaurants_select_all ON public.restaurants FOR SELECT USING (public.is_platform_owner());
DROP POLICY IF EXISTS owner_restaurants_insert ON public.restaurants;
CREATE POLICY owner_restaurants_insert ON public.restaurants FOR INSERT WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_restaurants_update ON public.restaurants;
CREATE POLICY owner_restaurants_update ON public.restaurants FOR UPDATE USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_restaurants_delete ON public.restaurants;
CREATE POLICY owner_restaurants_delete ON public.restaurants FOR DELETE USING (public.is_platform_owner());
DROP POLICY IF EXISTS manager_restaurants_select_own ON public.restaurants;
CREATE POLICY manager_restaurants_select_own ON public.restaurants FOR SELECT USING (id IN (SELECT restaurant_id FROM public.users WHERE id = auth.uid()));
-- Public read access for active restaurants (needed for QR/customer flows before auth)
DROP POLICY IF EXISTS public_restaurants_public_select ON public.restaurants;
CREATE POLICY public_restaurants_public_select ON public.restaurants FOR SELECT
  TO anon, authenticated
  USING (is_active);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS owner_subscriptions_select_all ON public.subscriptions;
CREATE POLICY owner_subscriptions_select_all ON public.subscriptions FOR SELECT USING (public.is_platform_owner());
DROP POLICY IF EXISTS owner_subscriptions_insert ON public.subscriptions;
CREATE POLICY owner_subscriptions_insert ON public.subscriptions FOR INSERT WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_subscriptions_update ON public.subscriptions;
CREATE POLICY owner_subscriptions_update ON public.subscriptions FOR UPDATE USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS owner_subscriptions_delete ON public.subscriptions;
CREATE POLICY owner_subscriptions_delete ON public.subscriptions FOR DELETE USING (public.is_platform_owner());
DROP POLICY IF EXISTS manager_subscriptions_select_own_restaurant ON public.subscriptions;
CREATE POLICY manager_subscriptions_select_own_restaurant ON public.subscriptions FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id=auth.uid()));

-- BILLING
DROP POLICY IF EXISTS billing_owner_select_all ON public.billing;
CREATE POLICY billing_owner_select_all ON public.billing FOR SELECT USING (public.is_platform_owner());
DROP POLICY IF EXISTS billing_owner_update_all ON public.billing;
CREATE POLICY billing_owner_update_all ON public.billing FOR UPDATE USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS billing_manager_select_own ON public.billing;
CREATE POLICY billing_manager_select_own ON public.billing FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id=auth.uid()));

-- PAYMENTS (subscription)
DROP POLICY IF EXISTS payments_owner_all ON public.payments;
CREATE POLICY payments_owner_all ON public.payments FOR ALL USING (public.is_platform_owner());
DROP POLICY IF EXISTS payments_manager_select_own ON public.payments;
CREATE POLICY payments_manager_select_own ON public.payments FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id=auth.uid()));

-- ORDER PAYMENTS (customer)
DROP POLICY IF EXISTS order_payments_insert_any ON public.order_payments;
CREATE POLICY order_payments_insert_any ON public.order_payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS order_payments_select_any ON public.order_payments;
CREATE POLICY order_payments_select_any ON public.order_payments FOR SELECT USING (true);
DROP POLICY IF EXISTS order_payments_manager_select ON public.order_payments;
CREATE POLICY order_payments_manager_select ON public.order_payments FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id=auth.uid() AND role IN ('owner','manager','admin')));
DROP POLICY IF EXISTS order_payments_superadmin_all ON public.order_payments;
CREATE POLICY order_payments_superadmin_all ON public.order_payments FOR ALL USING (public.is_superadmin());

-- NOTIFICATIONS (already defined - reassert)
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (public.is_superadmin() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND (public.notifications.user_id=u.id OR public.notifications.restaurant_id=u.restaurant_id)));
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (public.is_superadmin() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND lower(u.role) IN ('admin','manager') AND u.restaurant_id=public.notifications.restaurant_id));
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (public.is_superadmin() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND (public.notifications.user_id=u.id OR (lower(u.role) IN ('admin','manager') AND u.restaurant_id=public.notifications.restaurant_id))));
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE USING (public.is_superadmin());

-- TABLE SESSIONS
DROP POLICY IF EXISTS table_sessions_select_any ON public.table_sessions;
CREATE POLICY table_sessions_select_any ON public.table_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS table_sessions_insert_any ON public.table_sessions;
CREATE POLICY table_sessions_insert_any ON public.table_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS table_sessions_update_any ON public.table_sessions;
CREATE POLICY table_sessions_update_any ON public.table_sessions FOR UPDATE USING (true);
DROP POLICY IF EXISTS table_sessions_delete_authenticated ON public.table_sessions;
CREATE POLICY table_sessions_delete_authenticated ON public.table_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- MENU ITEM RATINGS
DROP POLICY IF EXISTS menu_item_ratings_select ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_select ON public.menu_item_ratings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS menu_item_ratings_insert ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_insert ON public.menu_item_ratings FOR INSERT TO anon, authenticated WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS menu_item_ratings_update ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_update ON public.menu_item_ratings FOR UPDATE TO authenticated USING (true) WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS menu_item_ratings_delete ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_delete ON public.menu_item_ratings FOR DELETE TO authenticated USING (true);

-- FEEDBACKS (simple open insert/select; rating constrained by CHECK)
DROP POLICY IF EXISTS feedbacks_select ON public.feedbacks;
CREATE POLICY feedbacks_select ON public.feedbacks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS feedbacks_insert ON public.feedbacks;
CREATE POLICY feedbacks_insert ON public.feedbacks FOR INSERT TO anon, authenticated WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS feedbacks_update ON public.feedbacks;
CREATE POLICY feedbacks_update ON public.feedbacks FOR UPDATE TO authenticated USING (true) WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS feedbacks_delete ON public.feedbacks;
CREATE POLICY feedbacks_delete ON public.feedbacks FOR DELETE TO authenticated USING (true);

-- PAYMENT CREDENTIAL AUDIT
DROP POLICY IF EXISTS payment_credential_audit_select ON public.payment_credential_audit;
CREATE POLICY payment_credential_audit_select ON public.payment_credential_audit FOR SELECT USING (
  public.is_superadmin() OR public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.restaurant_id = public.payment_credential_audit.restaurant_id AND u.role IN ('owner','manager'))
);
DROP POLICY IF EXISTS payment_credential_audit_insert ON public.payment_credential_audit;
CREATE POLICY payment_credential_audit_insert ON public.payment_credential_audit FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS payment_credential_audit_service ON public.payment_credential_audit;
CREATE POLICY payment_credential_audit_service ON public.payment_credential_audit FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PLATFORM ADMINS
DROP POLICY IF EXISTS platform_admins_superadmin_all ON public.platform_admins;
CREATE POLICY platform_admins_superadmin_all ON public.platform_admins FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS platform_admins_self_select ON public.platform_admins;
CREATE POLICY platform_admins_self_select ON public.platform_admins FOR SELECT USING (user_id = auth.uid());

-- BACKUPS
DROP POLICY IF EXISTS backups_superadmin_all ON public.backups;
CREATE POLICY backups_superadmin_all ON public.backups FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS backups_subadmin_select ON public.backups;
CREATE POLICY backups_subadmin_select ON public.backups FOR SELECT USING (public.is_platform_admin());
DROP POLICY IF EXISTS backup_schedules_superadmin_all ON public.backup_schedules;
CREATE POLICY backup_schedules_superadmin_all ON public.backup_schedules FOR ALL USING (public.is_superadmin());

-- AUDIT TRAIL
DROP POLICY IF EXISTS audit_superadmin_all ON public.audit_trail;
CREATE POLICY audit_superadmin_all ON public.audit_trail FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS audit_manager_restaurant ON public.audit_trail;
CREATE POLICY audit_manager_restaurant ON public.audit_trail FOR SELECT USING (
  entity_type='restaurant' AND entity_id IN (SELECT restaurant_id FROM public.users WHERE id=auth.uid() AND role IN ('manager','admin','owner'))
);

-- AUTH ACTIVITY LOGS
DROP POLICY IF EXISTS auth_activity_logs_select_policy ON public.auth_activity_logs;
CREATE POLICY auth_activity_logs_select_policy ON public.auth_activity_logs FOR SELECT USING (
  public.is_superadmin() OR user_id = auth.uid()
);
DROP POLICY IF EXISTS auth_activity_logs_insert_self ON public.auth_activity_logs;
CREATE POLICY auth_activity_logs_insert_self ON public.auth_activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS auth_activity_logs_service_policy ON public.auth_activity_logs;
CREATE POLICY auth_activity_logs_service_policy ON public.auth_activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SYSTEM LOGS
DROP POLICY IF EXISTS system_logs_superadmin_all ON public.system_logs;
CREATE POLICY system_logs_superadmin_all ON public.system_logs FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS system_logs_service_insert ON public.system_logs;
CREATE POLICY system_logs_service_insert ON public.system_logs FOR INSERT TO service_role WITH CHECK (true);

-- END RLS POLICIES
