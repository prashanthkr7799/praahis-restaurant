-- ============================================================================
-- 10_ratings_and_views.sql
-- Menu item ratings + summary & enriched views (security_invoker)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.menu_item_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_item_ratings_item ON public.menu_item_ratings(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_ratings_restaurant ON public.menu_item_ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_item_ratings_order ON public.menu_item_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_item_ratings_created ON public.menu_item_ratings(created_at DESC);

ALTER TABLE public.menu_item_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS menu_item_ratings_select ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_select ON public.menu_item_ratings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS menu_item_ratings_insert ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_insert ON public.menu_item_ratings FOR INSERT TO anon, authenticated WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS menu_item_ratings_update ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_update ON public.menu_item_ratings FOR UPDATE TO authenticated USING (true) WITH CHECK (rating BETWEEN 1 AND 5);
DROP POLICY IF EXISTS menu_item_ratings_delete ON public.menu_item_ratings;
CREATE POLICY menu_item_ratings_delete ON public.menu_item_ratings FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT ON public.menu_item_ratings TO anon, authenticated;
GRANT UPDATE, DELETE ON public.menu_item_ratings TO authenticated;

-- Summary view (security_invoker)
CREATE OR REPLACE VIEW public.menu_item_ratings_summary WITH (security_invoker = true) AS
SELECT mir.menu_item_id, COUNT(*)::INT AS total_ratings, ROUND(AVG(mir.rating)::NUMERIC,2) AS avg_rating
FROM public.menu_item_ratings mir GROUP BY mir.menu_item_id;

-- Enriched menu items view (security_invoker)
CREATE OR REPLACE VIEW public.menu_items_with_ratings WITH (security_invoker = true) AS
SELECT mi.*, COALESCE(s.avg_rating,0) AS avg_rating, COALESCE(s.total_ratings,0) AS total_ratings
FROM public.menu_items mi LEFT JOIN public.menu_item_ratings_summary s ON s.menu_item_id = mi.id;

GRANT SELECT ON public.menu_item_ratings_summary TO anon, authenticated;
GRANT SELECT ON public.menu_items_with_ratings TO anon, authenticated;

-- END RATINGS & VIEWS
