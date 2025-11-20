-- ============================================================================
-- 08_table_sessions_and_auth.sql
-- Table dining sessions + helper functions (customer lifecycle)
-- Includes inactivity tracking and auto-cleanup (5-minute timeout)
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

-- Add last_activity_at column for inactivity tracking
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='table_sessions' AND column_name='last_activity_at'
  ) THEN
    ALTER TABLE public.table_sessions ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE public.table_sessions SET last_activity_at = COALESCE(updated_at, created_at, NOW()) WHERE status = 'active' AND last_activity_at IS NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.table_sessions.last_activity_at IS 'Timestamp of last customer activity (menu browse, cart update, etc.) - used for 5-minute timeout';

-- Add session_id columns if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='session_id') THEN
    ALTER TABLE public.orders ADD COLUMN session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedbacks' AND column_name='session_id') THEN
    ALTER TABLE public.feedbacks ADD COLUMN session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;
  END IF; 
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON public.table_sessions(table_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant ON public.table_sessions(restaurant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_sessions_activity ON public.table_sessions(status, last_activity_at DESC) WHERE status='active';
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
RETURNS UUID AS $$ 
DECLARE 
  v_id UUID; 
BEGIN 
  SELECT id INTO v_id FROM public.table_sessions WHERE table_id=p_table_id AND status='active' LIMIT 1; 
  IF v_id IS NULL THEN 
    INSERT INTO public.table_sessions(table_id, restaurant_id, status, last_activity_at) 
    VALUES (p_table_id, p_restaurant_id, 'active', NOW()) 
    RETURNING id INTO v_id; 
  ELSE
    UPDATE public.table_sessions SET last_activity_at = NOW(), updated_at = NOW() WHERE id = v_id;
  END IF; 
  RETURN v_id; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.end_table_session(p_session_id UUID)
RETURNS BOOLEAN AS $$ 
DECLARE 
  v_table UUID; 
BEGIN 
  UPDATE public.table_sessions 
  SET status='completed', ended_at=NOW(), updated_at=NOW() 
  WHERE id=p_session_id AND status='active' 
  RETURNING table_id INTO v_table; 
  
  IF v_table IS NOT NULL THEN 
    UPDATE public.tables 
    SET status='available', active_session_id=NULL, updated_at=NOW() 
    WHERE id=v_table; 
    RETURN true; 
  END IF; 
  RETURN false; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update session activity timestamp (called by frontend heartbeat)
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.table_sessions
  SET last_activity_at = NOW(), updated_at = NOW()
  WHERE id = p_session_id AND status = 'active';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup inactive sessions (called by cron job every 2 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions(p_timeout_minutes INTEGER DEFAULT 5)
RETURNS TABLE(
  session_id UUID,
  table_id UUID,
  table_number VARCHAR,
  inactive_duration INTERVAL
) AS $$
DECLARE
  v_session RECORD;
  v_table_num VARCHAR;
BEGIN
  FOR v_session IN
    SELECT ts.id, ts.table_id, ts.last_activity_at, NOW() - ts.last_activity_at AS duration
    FROM public.table_sessions ts
    WHERE ts.status = 'active' AND ts.last_activity_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL
  LOOP
    SELECT t.table_number INTO v_table_num FROM public.tables t WHERE t.id = v_session.table_id;
    PERFORM public.end_table_session(v_session.id);
    session_id := v_session.id;
    table_id := v_session.table_id;
    table_number := v_table_num;
    inactive_duration := v_session.duration;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Force release table session (manager override)
CREATE OR REPLACE FUNCTION public.force_release_table_session(
  p_session_id UUID DEFAULT NULL,
  p_table_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_table_id UUID;
  v_result JSONB;
BEGIN
  IF p_session_id IS NOT NULL THEN
    SELECT table_id INTO v_table_id FROM public.table_sessions WHERE id = p_session_id;
    v_session_id := p_session_id;
  ELSIF p_table_id IS NOT NULL THEN
    SELECT id, table_id INTO v_session_id, v_table_id FROM public.table_sessions WHERE table_id = p_table_id AND status = 'active' LIMIT 1;
  ELSE
    RAISE EXCEPTION 'Either session_id or table_id must be provided';
  END IF;

  IF v_session_id IS NULL THEN
    IF p_table_id IS NOT NULL THEN
      UPDATE public.tables SET status = 'available', active_session_id = NULL, updated_at = NOW() WHERE id = p_table_id;
      v_result := jsonb_build_object('success', true, 'message', 'Table freed (no active session found)', 'table_id', p_table_id, 'session_id', NULL);
    ELSE
      v_result := jsonb_build_object('success', false, 'message', 'No active session found', 'session_id', p_session_id, 'table_id', NULL);
    END IF;
    RETURN v_result;
  END IF;

  UPDATE public.table_sessions SET status = 'cancelled', ended_at = NOW(), updated_at = NOW() WHERE id = v_session_id;
  UPDATE public.tables SET status = 'available', active_session_id = NULL, updated_at = NOW() WHERE id = v_table_id;
  v_result := jsonb_build_object('success', true, 'message', 'Session force-released successfully', 'session_id', v_session_id, 'table_id', v_table_id);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_table_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_table_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_release_table_session TO authenticated;

COMMENT ON FUNCTION public.update_session_activity IS 'Update last_activity_at timestamp when customer interacts with menu/cart';
COMMENT ON FUNCTION public.cleanup_inactive_sessions IS 'Find and release sessions inactive for more than specified minutes (default 5)';
COMMENT ON FUNCTION public.force_release_table_session IS 'Manager override to immediately release a table session';

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_table_sessions_updated_at() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_table_sessions_updated_at ON public.table_sessions;
CREATE TRIGGER trg_table_sessions_updated_at BEFORE UPDATE ON public.table_sessions FOR EACH ROW EXECUTE FUNCTION public.update_table_sessions_updated_at();

-- END TABLE SESSIONS

