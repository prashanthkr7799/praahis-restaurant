-- ============================================================================
-- 06_audit_logging_system.sql
-- Unified audit + security logging: audit_trail, auth_activity_logs, system_logs, triggers & views
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('created','updated','deleted','restored','activated','deactivated','suspended','reactivated','payment_made','payment_verified','billing_generated','backup_created','backup_restored','settings_updated','login','logout','password_reset','role_changed','bulk_action')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('restaurant','user','manager','subscription','billing','payment','menu_item','table','order','platform_settings','backup','system')),
  entity_id UUID,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  request_method TEXT,
  request_path TEXT,
  description TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_trail(created_at DESC);

-- FUNCTION: log_audit_trail
CREATE OR REPLACE FUNCTION public.log_audit_trail(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_old JSONB DEFAULT NULL,
  p_new JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE v_id UUID; v_actor UUID; v_email TEXT; v_role TEXT; v_changed TEXT[]; BEGIN
  v_actor := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id=v_actor;
  SELECT role INTO v_role FROM public.users WHERE id=v_actor;
  IF p_old IS NOT NULL AND p_new IS NOT NULL THEN
    SELECT array_agg(key) INTO v_changed FROM jsonb_each(p_new) WHERE value IS DISTINCT FROM COALESCE(p_old->key,'null'::jsonb);
  END IF;
  INSERT INTO public.audit_trail(actor_id,actor_email,actor_role,action,entity_type,entity_id,entity_name,old_values,new_values,changed_fields,description,severity,metadata)
  VALUES (v_actor,v_email,v_role,p_action,p_entity_type,p_entity_id,p_entity_name,p_old,p_new,v_changed,p_description,p_severity,p_metadata) RETURNING id INTO v_id;
  RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger helpers (example for restaurants, billing, payments, users)
CREATE OR REPLACE FUNCTION public.audit_restaurants() RETURNS TRIGGER AS $$ BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_audit_trail('created','restaurant',NEW.id,NEW.name,NULL,row_to_json(NEW)::jsonb,'Restaurant created');
  ELSIF TG_OP='UPDATE' THEN PERFORM public.log_audit_trail('updated','restaurant',NEW.id,NEW.name,row_to_json(OLD)::jsonb,row_to_json(NEW)::jsonb,'Restaurant updated');
  ELSIF TG_OP='DELETE' THEN PERFORM public.log_audit_trail('deleted','restaurant',OLD.id,OLD.name,row_to_json(OLD)::jsonb,NULL,'Restaurant deleted','warning'); END IF;
  RETURN COALESCE(NEW,OLD); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.audit_billing() RETURNS TRIGGER AS $$ BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_audit_trail('billing_generated','billing',NEW.id,'Billing '||NEW.invoice_number,NULL,row_to_json(NEW)::jsonb,'Bill generated');
  ELSIF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit_trail(CASE WHEN NEW.status='paid' THEN 'payment_verified' WHEN NEW.status='overdue' THEN 'suspended' ELSE 'updated' END,'billing',NEW.id,'Billing '||NEW.invoice_number,row_to_json(OLD)::jsonb,row_to_json(NEW)::jsonb,'Billing status changed');
  END IF; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.audit_payments() RETURNS TRIGGER AS $$ BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_audit_trail('payment_made','payment',NEW.id,'Payment '||NEW.id::TEXT,NULL,row_to_json(NEW)::jsonb,'Payment recorded'); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.audit_users() RETURNS TRIGGER AS $$ BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.log_audit_trail('created','user',NEW.id,COALESCE(NEW.full_name,NEW.name,NEW.email),NULL,row_to_json(NEW)::jsonb,'User created');
  ELSIF TG_OP='UPDATE' THEN PERFORM public.log_audit_trail(CASE WHEN OLD.is_active<>NEW.is_active THEN (CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END) WHEN OLD.role<>NEW.role THEN 'role_changed' ELSE 'updated' END,'user',NEW.id,COALESCE(NEW.full_name,NEW.name,NEW.email),row_to_json(OLD)::jsonb,row_to_json(NEW)::jsonb,'User updated');
  ELSIF TG_OP='DELETE' THEN PERFORM public.log_audit_trail('deleted','user',OLD.id,COALESCE(OLD.full_name,OLD.name,OLD.email),row_to_json(OLD)::jsonb,NULL,'User deleted','warning'); END IF; RETURN COALESCE(NEW,OLD); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers
DROP TRIGGER IF EXISTS audit_restaurants_trigger ON public.restaurants;
CREATE TRIGGER audit_restaurants_trigger AFTER INSERT OR UPDATE OR DELETE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.audit_restaurants();
DROP TRIGGER IF EXISTS audit_billing_trigger ON public.billing;
CREATE TRIGGER audit_billing_trigger AFTER INSERT OR UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.audit_billing();
DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_payments();
DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.audit_users();

-- AUTH ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.auth_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON public.auth_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON public.auth_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON public.auth_activity_logs(created_at DESC);

-- SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at DESC);

-- Logging helper functions
CREATE OR REPLACE FUNCTION public.log_auth_event(p_user_id UUID, p_action TEXT, p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID AS $$ DECLARE v_id UUID; BEGIN INSERT INTO public.auth_activity_logs(user_id,action,metadata) VALUES (p_user_id,p_action,p_metadata) RETURNING id INTO v_id; RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.log_system_event(p_level TEXT, p_source TEXT, p_message TEXT, p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID AS $$ DECLARE v_id UUID; BEGIN INSERT INTO public.system_logs(level,source,message,metadata) VALUES (p_level,p_source,p_message,p_metadata) RETURNING id INTO v_id; RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views (security_invoker enforced later again in security fixes; include here directly)
CREATE OR REPLACE VIEW public.recent_failed_logins WITH (security_invoker = true) AS
SELECT al.user_id, u.email, u.role, al.action, al.metadata->>'error' AS error_message, al.created_at
FROM public.auth_activity_logs al LEFT JOIN public.users u ON u.id = al.user_id
WHERE al.action IN ('login_failed','superadmin_login_failed') AND al.created_at > NOW() - INTERVAL '24 hours' ORDER BY al.created_at DESC;

CREATE OR REPLACE VIEW public.cross_restaurant_violations WITH (security_invoker = true) AS
SELECT al.user_id, u.email, u.role, u.restaurant_id AS user_restaurant_id, al.metadata->>'attempted_restaurant_id' AS attempted_restaurant_id, al.metadata->>'reason' AS reason, al.created_at
FROM public.auth_activity_logs al LEFT JOIN public.users u ON u.id = al.user_id
WHERE al.action = 'cross_restaurant_access_attempt' ORDER BY al.created_at DESC;

CREATE OR REPLACE VIEW public.auth_activity_summary WITH (security_invoker = true) AS
SELECT DATE_TRUNC('day', created_at) AS date, action, COUNT(*) AS count
FROM public.auth_activity_logs WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), action ORDER BY date DESC, count DESC;

-- Cleanup old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(retention_days INT DEFAULT 90)
RETURNS TABLE(deleted_auth_logs BIGINT, deleted_system_logs BIGINT) AS $$ DECLARE v_a BIGINT; v_s BIGINT; BEGIN WITH del AS (DELETE FROM public.auth_activity_logs WHERE created_at < NOW() - (retention_days||' days')::INTERVAL RETURNING *) SELECT COUNT(*) INTO v_a FROM del; WITH del2 AS (DELETE FROM public.system_logs WHERE created_at < NOW() - (retention_days||' days')::INTERVAL AND level NOT IN ('ERROR','CRITICAL') RETURNING *) SELECT COUNT(*) INTO v_s FROM del2; PERFORM public.log_system_event('INFO','LOG_CLEANUP','Automatic log cleanup', jsonb_build_object('retention_days',retention_days,'auth_logs_deleted',v_a,'system_logs_deleted',v_s)); RETURN QUERY SELECT v_a, v_s; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS enable
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (refined in 12)
DROP POLICY IF EXISTS audit_superadmin_all ON public.audit_trail;
CREATE POLICY audit_superadmin_all ON public.audit_trail FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS auth_logs_select_self ON public.auth_activity_logs;
CREATE POLICY auth_logs_select_self ON public.auth_activity_logs FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS system_logs_superadmin_select ON public.system_logs;
CREATE POLICY system_logs_superadmin_select ON public.system_logs FOR SELECT USING (public.is_superadmin());

-- Grants for views
GRANT SELECT ON public.recent_failed_logins, public.cross_restaurant_violations, public.auth_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_event TO authenticated;

-- END AUDIT LOGGING SYSTEM
