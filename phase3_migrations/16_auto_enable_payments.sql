-- ============================================================================
-- 16_auto_enable_payments.sql
-- Automatically enable payment gateway for new restaurants
-- Also provides bulk enablement for existing restaurants
-- ============================================================================

-- Set payment_gateway_enabled = true for all existing restaurants
-- (Safe to run multiple times - idempotent)
UPDATE public.restaurants 
SET payment_gateway_enabled = true 
WHERE payment_gateway_enabled IS NULL OR payment_gateway_enabled = false;

-- Create trigger function to auto-enable payments for new restaurants
CREATE OR REPLACE FUNCTION public.auto_enable_payment_gateway()
RETURNS TRIGGER AS $$
BEGIN
  -- Always enable payment gateway for new restaurants by default
  -- They can disable it later via Manager dashboard if needed
  IF NEW.payment_gateway_enabled IS NULL THEN
    NEW.payment_gateway_enabled := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS trg_auto_enable_payment_gateway ON public.restaurants;

-- Create trigger to run before insert on restaurants table
CREATE TRIGGER trg_auto_enable_payment_gateway
  BEFORE INSERT ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enable_payment_gateway();

-- Verify current state
DO $$ 
DECLARE 
  v_enabled_count INT;
  v_total_count INT;
BEGIN
  SELECT COUNT(*) INTO v_enabled_count FROM public.restaurants WHERE payment_gateway_enabled = true;
  SELECT COUNT(*) INTO v_total_count FROM public.restaurants;
  
  RAISE NOTICE '═════════════════════════════════════════════════════════';
  RAISE NOTICE 'Payment Gateway Auto-Enable Setup Complete';
  RAISE NOTICE '═════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total restaurants: %', v_total_count;
  RAISE NOTICE 'Payment-enabled: %', v_enabled_count;
  RAISE NOTICE 'Trigger: auto_enable_payment_gateway ACTIVE';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  All new restaurants will have payments enabled by default';
  RAISE NOTICE '═════════════════════════════════════════════════════════';
END $$;

-- END AUTO-ENABLE PAYMENTS

