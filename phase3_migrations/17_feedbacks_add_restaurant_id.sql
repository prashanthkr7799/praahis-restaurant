-- ============================================================================
-- 17_feedbacks_add_restaurant_id.sql
-- Adds restaurant_id to feedbacks, backfills data, indexes & RLS policies
-- ============================================================================

-- Add restaurant_id column if missing
ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Backfill restaurant_id from related orders (if order_id present)
UPDATE public.feedbacks f
SET restaurant_id = o.restaurant_id
FROM public.orders o
WHERE f.restaurant_id IS NULL AND f.order_id = o.id;

-- Defensive: if some feedback rows created only with session_id, attempt backfill via session -> orders
-- (Assumes table_sessions has restaurant_id)
UPDATE public.feedbacks f
SET restaurant_id = ts.restaurant_id
FROM public.table_sessions ts
WHERE f.restaurant_id IS NULL AND f.session_id = ts.id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_restaurant ON public.feedbacks(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_session ON public.feedbacks(session_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON public.feedbacks(created_at DESC);

-- Enable RLS and add basic policies (idempotent)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedbacks_select ON public.feedbacks;
CREATE POLICY feedbacks_select ON public.feedbacks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS feedbacks_insert ON public.feedbacks;
CREATE POLICY feedbacks_insert ON public.feedbacks FOR INSERT TO anon, authenticated WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS feedbacks_update ON public.feedbacks;
CREATE POLICY feedbacks_update ON public.feedbacks FOR UPDATE TO authenticated USING (true) WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS feedbacks_delete ON public.feedbacks;
CREATE POLICY feedbacks_delete ON public.feedbacks FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT ON public.feedbacks TO anon, authenticated;
GRANT UPDATE, DELETE ON public.feedbacks TO authenticated;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
