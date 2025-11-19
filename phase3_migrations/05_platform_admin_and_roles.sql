-- ============================================================================
-- 05_platform_admin_and_roles.sql
-- Platform admin role system (enum + platform_admins) + permission helper
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM for admin roles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('superadmin','subadmin','support');
  END IF;
END$$;

-- TABLE: platform_admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'subadmin',
  permissions JSONB DEFAULT '{"restaurants":{"create":true,"read":true,"update":true,"delete":false},"billing":{"read":true,"update":true,"delete":false},"audit":{"read":true},"backups":{"read":false}}',
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  last_login TIMESTAMPTZ,
  login_count INT DEFAULT 0,
  last_ip INET,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.platform_admins(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON public.platform_admins(is_active);

-- FUNCTION: check_admin_permission(module, action)
CREATE OR REPLACE FUNCTION public.check_admin_permission(p_user_id UUID, p_module TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$ DECLARE v_role admin_role; v_perm JSONB; v_allowed BOOLEAN; BEGIN SELECT role, permissions INTO v_role, v_perm FROM public.platform_admins WHERE user_id=p_user_id AND is_active; IF NOT FOUND THEN RETURN false; END IF; IF v_role='superadmin' THEN RETURN true; END IF; v_allowed := COALESCE( (v_perm->p_module->>p_action)::BOOLEAN, false ); RETURN v_allowed; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: get_admin_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(p_user_id UUID)
RETURNS JSONB AS $$ DECLARE v_role admin_role; v_perm JSONB; v_stats JSONB; BEGIN SELECT role, permissions INTO v_role, v_perm FROM public.platform_admins WHERE user_id=p_user_id; v_stats := jsonb_build_object(
  'role', v_role,
  'restaurants_count', (SELECT COUNT(*) FROM public.restaurants),
  'active_restaurants', (SELECT COUNT(*) FROM public.restaurants WHERE is_active),
  'pending_bills', (SELECT COUNT(*) FROM public.billing WHERE status='pending'),
  'overdue_bills', (SELECT COUNT(*) FROM public.billing WHERE status='overdue')
); RETURN v_stats; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_platform_admins_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_platform_admins_timestamp ON public.platform_admins;
CREATE TRIGGER trg_platform_admins_timestamp BEFORE UPDATE ON public.platform_admins FOR EACH ROW EXECUTE FUNCTION public.update_platform_admins_timestamp();

-- RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Superadmin full access to platform_admins" ON public.platform_admins;
CREATE POLICY "Superadmin full access to platform_admins" ON public.platform_admins FOR ALL USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id=auth.uid() AND pa.role='superadmin' AND pa.is_active));
DROP POLICY IF EXISTS "Admins view own profile" ON public.platform_admins;
CREATE POLICY "Admins view own profile" ON public.platform_admins FOR SELECT USING (user_id = auth.uid());

-- END PLATFORM ADMIN & ROLES
