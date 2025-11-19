-- ============================================================================
-- 03_billing_price_per_table_extension.sql
-- Adds per-table pricing extension & custom pricing support to restaurants and billing
-- ============================================================================

-- Add pricing configuration columns (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='pricing_type') THEN
    ALTER TABLE public.restaurants ADD COLUMN pricing_type TEXT DEFAULT 'per_table' CHECK (pricing_type IN ('per_table','custom'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='custom_monthly_amount') THEN
    ALTER TABLE public.restaurants ADD COLUMN custom_monthly_amount NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='trial_days') THEN
    ALTER TABLE public.restaurants ADD COLUMN trial_days INT DEFAULT 3 CHECK (trial_days >= 0);
  END IF; END $$;

COMMENT ON COLUMN public.restaurants.pricing_type IS 'Pricing model: per_table or custom';
COMMENT ON COLUMN public.restaurants.custom_monthly_amount IS 'Custom flat monthly amount if pricing_type=custom';
COMMENT ON COLUMN public.restaurants.trial_days IS 'Number of trial days granted to new restaurant';

-- Ensure billing has pricing_type & custom_amount columns (already in v80 script, safe reassert)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='billing' AND column_name='pricing_type') THEN
    ALTER TABLE public.billing ADD COLUMN pricing_type TEXT DEFAULT 'per_table' CHECK (pricing_type IN ('per_table','custom'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='billing' AND column_name='custom_amount') THEN
    ALTER TABLE public.billing ADD COLUMN custom_amount NUMERIC(10,2);
  END IF; END $$;

-- END EXTENSION
