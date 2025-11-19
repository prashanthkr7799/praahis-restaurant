-- ============================================================================
-- 07_maintenance_and_backup_system.sql
-- Backup tracking, schedules, completion + maintenance placeholder
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: backups
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full','incremental','restaurant','manual')),
  backup_name TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  restaurant_name TEXT,
  file_path TEXT,
  storage_location TEXT DEFAULT 'supabase_storage',
  file_size BIGINT,
  compressed BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed','deleted')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INT,
  tables_backed_up TEXT[],
  row_count BIGINT,
  initiated_by UUID REFERENCES auth.users(id),
  initiated_by_email TEXT,
  error_message TEXT,
  error_details JSONB,
  can_restore BOOLEAN DEFAULT true,
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  retention_days INT DEFAULT 30,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backups_type ON public.backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_status ON public.backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_expires ON public.backups(expires_at);

-- TABLE: backup_schedules
CREATE TABLE IF NOT EXISTS public.backup_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full','incremental','restaurant')),
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly','daily','weekly','monthly')),
  schedule_time TIME,
  schedule_day INT,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  include_all_restaurants BOOLEAN DEFAULT false,
  retention_days INT DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  last_backup_id UUID REFERENCES public.backups(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active ON public.backup_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON public.backup_schedules(next_run);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.create_backup_record(p_backup_type TEXT, p_backup_name TEXT, p_restaurant_id UUID DEFAULT NULL, p_initiated_by UUID DEFAULT NULL)
RETURNS UUID AS $$ DECLARE v_id UUID; v_rest_name TEXT; v_email TEXT; v_expires TIMESTAMPTZ; BEGIN IF p_restaurant_id IS NOT NULL THEN SELECT name INTO v_rest_name FROM public.restaurants WHERE id=p_restaurant_id; END IF; SELECT email INTO v_email FROM auth.users WHERE id=p_initiated_by; v_expires := NOW() + INTERVAL '30 days'; INSERT INTO public.backups(backup_type,backup_name,restaurant_id,restaurant_name,initiated_by,initiated_by_email,status,started_at,expires_at,retention_days) VALUES (p_backup_type,p_backup_name,p_restaurant_id,v_rest_name,p_initiated_by,v_email,'in_progress',NOW(),v_expires,30) RETURNING id INTO v_id; PERFORM public.log_audit_trail('backup_created','backup',v_id,p_backup_name,NULL, NULL,'Backup initiated','info'); RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.complete_backup(p_backup_id UUID, p_file_path TEXT, p_file_size BIGINT, p_tables TEXT[], p_row_count BIGINT DEFAULT 0)
RETURNS BOOLEAN AS $$ DECLARE v_dur INT; BEGIN UPDATE public.backups SET status='completed', completed_at=NOW(), duration_seconds=EXTRACT(EPOCH FROM (NOW()-started_at))::INT, file_path=p_file_path, file_size=p_file_size, tables_backed_up=p_tables, row_count=p_row_count WHERE id=p_backup_id RETURNING duration_seconds INTO v_dur; PERFORM public.log_audit_trail('backup_restored','backup',p_backup_id,'Backup #'||p_backup_id::TEXT,NULL,NULL,'Backup completed','info'); RETURN true; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- SIMPLE MAINTENANCE: prune expired backups
CREATE OR REPLACE FUNCTION public.prune_expired_backups()
RETURNS INT AS $$ DECLARE v_count INT; BEGIN DELETE FROM public.backups WHERE status='completed' AND expires_at < NOW() RETURNING id; GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backups_superadmin_all ON public.backups;
CREATE POLICY backups_superadmin_all ON public.backups FOR ALL USING (public.is_superadmin());
DROP POLICY IF EXISTS backups_subadmin_select ON public.backups;
CREATE POLICY backups_subadmin_select ON public.backups FOR SELECT USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id=auth.uid() AND role='subadmin' AND is_active));
DROP POLICY IF EXISTS backup_schedules_superadmin_all ON public.backup_schedules;
CREATE POLICY backup_schedules_superadmin_all ON public.backup_schedules FOR ALL USING (public.is_superadmin());

-- END MAINTENANCE & BACKUP SYSTEM
