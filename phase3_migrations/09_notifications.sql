-- ============================================================================
-- 09_notifications.sql
-- App notifications system with RLS & helper creation function
-- ============================================================================

-- Try to create pgcrypto extension (may already exist in Supabase)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  RAISE NOTICE '✅ pgcrypto extension available';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ pgcrypto extension handling: %', SQLERRM;
END$$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'system' CHECK (type IN ('order','payment','system','staff','alert')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_created ON public.notifications(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(restaurant_id, is_read, created_at DESC);

-- Policies (use recursion-free helper functions later for ownership)
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND (
      public.notifications.user_id = u.id OR public.notifications.restaurant_id = u.restaurant_id)
  )
);
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND lower(u.role) IN ('admin','manager') AND u.restaurant_id = public.notifications.restaurant_id)
);
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND (
      public.notifications.user_id = u.id OR (lower(u.role) IN ('admin','manager') AND u.restaurant_id = public.notifications.restaurant_id))
  )
);
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE USING (public.is_superadmin());

CREATE OR REPLACE FUNCTION public.update_notifications_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_notifications_timestamp();

CREATE OR REPLACE FUNCTION public.create_notification(p_type TEXT, p_title TEXT, p_body TEXT DEFAULT NULL, p_data JSONB DEFAULT '{}'::jsonb, p_restaurant_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL)
RETURNS UUID AS $$ DECLARE v_id UUID; BEGIN INSERT INTO public.notifications(type, title, body, data, restaurant_id, user_id) VALUES (p_type,p_title,p_body,p_data,p_restaurant_id,p_user_id) RETURNING id INTO v_id; RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Add to realtime publication idempotently
DO $$
BEGIN
  -- Try to add table to realtime publication
  -- Use exception handling instead of checking pg_publication_tables
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  RAISE NOTICE '✅ Added notifications to supabase_realtime publication';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️ notifications already in realtime publication';
  WHEN undefined_object THEN
    RAISE NOTICE 'ℹ️ supabase_realtime publication does not exist - will be auto-created by Supabase';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not add to publication: %', SQLERRM;
END$$;

-- END NOTIFICATIONS
