-- ============================================================================
-- 08_table_sessions_and_auth.sql
-- Table dining sessions + helper functions (customer lifecycle)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_id columns if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='session_id') THEN
    ALTER TABLE public.orders ADD COLUMN session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedbacks' AND column_name='session_id') THEN
    ALTER TABLE public.feedbacks ADD COLUMN session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;
  END IF; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON public.table_sessions(table_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant ON public.table_sessions(restaurant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_session ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_session ON public.feedbacks(session_id);

-- Unique: one active session per table
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_active_unique ON public.table_sessions(table_id) WHERE status='active';

-- RLS
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS table_sessions_select_any ON public.table_sessions;
CREATE POLICY table_sessions_select_any ON public.table_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS table_sessions_insert_any ON public.table_sessions;
CREATE POLICY table_sessions_insert_any ON public.table_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS table_sessions_update_authenticated ON public.table_sessions;
CREATE POLICY table_sessions_update_authenticated ON public.table_sessions FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS table_sessions_delete_authenticated ON public.table_sessions;
CREATE POLICY table_sessions_delete_authenticated ON public.table_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- Functions
CREATE OR REPLACE FUNCTION public.get_or_create_table_session(p_table_id UUID, p_restaurant_id UUID)
RETURNS UUID AS $$ DECLARE v_id UUID; BEGIN SELECT id INTO v_id FROM public.table_sessions WHERE table_id=p_table_id AND status='active' LIMIT 1; IF v_id IS NULL THEN INSERT INTO public.table_sessions(table_id,restaurant_id,status) VALUES (p_table_id,p_restaurant_id,'active') RETURNING id INTO v_id; END IF; RETURN v_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.end_table_session(p_session_id UUID)
RETURNS BOOLEAN AS $$ DECLARE v_table UUID; BEGIN UPDATE public.table_sessions SET status='completed', ended_at=NOW(), updated_at=NOW() WHERE id=p_session_id AND status='active' RETURNING table_id INTO v_table; IF v_table IS NOT NULL THEN UPDATE public.tables SET status='available', active_session_id=NULL, updated_at=NOW() WHERE id=v_table; RETURN true; END IF; RETURN false; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_table_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_table_session TO anon, authenticated;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_table_sessions_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_table_sessions_updated_at ON public.table_sessions;
CREATE TRIGGER trg_table_sessions_updated_at BEFORE UPDATE ON public.table_sessions FOR EACH ROW EXECUTE FUNCTION public.update_table_sessions_updated_at();

-- END TABLE SESSIONS
