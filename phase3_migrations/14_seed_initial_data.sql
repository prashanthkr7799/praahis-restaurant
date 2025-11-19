-- ============================================================================
-- 14_seed_initial_data.sql
-- Minimal canonical seed: sample restaurant, trial subscription, platform admin placeholder
-- Safe/idempotent; adjust emails/IDs in deployment pipeline.
-- ============================================================================

-- Sample Restaurant (only if none exist)
INSERT INTO public.restaurants(name, slug, description)
SELECT 'Demo Restaurant','demo','Initial demo tenant'
WHERE NOT EXISTS (SELECT 1 FROM public.restaurants WHERE slug='demo');

-- Ensure Taj restaurant exists & active (idempotent upsert by slug)
INSERT INTO public.restaurants(name, slug, description, is_active)
VALUES ('Taj Restaurant','taj','Taj primary tenant', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- Create trial subscription for demo if missing
DO $$ DECLARE v_rest UUID; v_sub UUID; BEGIN
  SELECT id INTO v_rest FROM public.restaurants WHERE slug='demo';
  IF v_rest IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE restaurant_id=v_rest) THEN
    v_sub := public.create_trial_subscription(v_rest, 3);
  END IF; END $$;

-- Placeholder platform superadmin mapping (requires existing auth.users record)
-- Replace <SUPERADMIN_AUTH_ID> with actual auth.users.id after auth provisioning.
DO $$ DECLARE v_auth UUID; BEGIN
  SELECT id INTO v_auth FROM auth.users WHERE email='admin@praahis.com';
  IF v_auth IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id=v_auth) THEN
    INSERT INTO public.platform_admins(user_id,email,full_name,role,is_active) VALUES (v_auth,'admin@praahis.com','Super Administrator','superadmin',true);
  END IF; END $$;

-- Seed a sample menu item (depends on restaurant)
DO $$ DECLARE v_rest UUID; BEGIN
  SELECT id INTO v_rest FROM public.restaurants WHERE slug='demo';
  IF v_rest IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.menu_items WHERE restaurant_id=v_rest) THEN
    INSERT INTO public.menu_items(restaurant_id,name,category,price,description) VALUES (v_rest,'Masala Dosa','Main',120.00,'Signature crispy dosa');
  END IF; END $$;

-- Confirm seed
DO $$ BEGIN RAISE NOTICE 'Seed complete: demo restaurant, trial subscription (if new), platform admin placeholder (if auth user present), sample menu item.'; END $$;

-- END SEED DATA
