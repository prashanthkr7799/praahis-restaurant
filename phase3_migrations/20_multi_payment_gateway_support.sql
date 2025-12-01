-- ============================================================================
-- 20_multi_payment_gateway_support.sql
-- Add support for multiple payment gateways (Razorpay, PhonePe, Paytm)
-- ============================================================================

-- Add payment_provider column to restaurants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='restaurants' 
    AND column_name='payment_provider'
  ) THEN
    ALTER TABLE public.restaurants 
    ADD COLUMN payment_provider TEXT DEFAULT 'razorpay' 
    CHECK (payment_provider IN ('razorpay', 'phonepe', 'paytm'));
    
    COMMENT ON COLUMN public.restaurants.payment_provider IS 
    'Active payment gateway provider for this restaurant';
  END IF;
END $$;

-- Add PhonePe credential columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='restaurants' 
    AND column_name='phonepe_merchant_id'
  ) THEN
    ALTER TABLE public.restaurants 
    ADD COLUMN phonepe_merchant_id TEXT,
    ADD COLUMN phonepe_salt_key TEXT,
    ADD COLUMN phonepe_salt_index TEXT DEFAULT '1';
    
    COMMENT ON COLUMN public.restaurants.phonepe_merchant_id IS 'PhonePe merchant ID';
    COMMENT ON COLUMN public.restaurants.phonepe_salt_key IS 'PhonePe salt key for signature';
    COMMENT ON COLUMN public.restaurants.phonepe_salt_index IS 'PhonePe salt index';
  END IF;
END $$;

-- Add Paytm credential columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='restaurants' 
    AND column_name='paytm_merchant_id'
  ) THEN
    ALTER TABLE public.restaurants 
    ADD COLUMN paytm_merchant_id TEXT,
    ADD COLUMN paytm_merchant_key TEXT;
    
    COMMENT ON COLUMN public.restaurants.paytm_merchant_id IS 'Paytm merchant ID';
    COMMENT ON COLUMN public.restaurants.paytm_merchant_key IS 'Paytm merchant secret key';
  END IF;
END $$;

-- Update payment_method constraint on orders to include all gateways
DO $$ BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_method_check' 
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;
  END IF;
  
  -- Add new constraint with all gateway options
  ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'razorpay', 'phonepe', 'paytm', 'upi', 'card', 'online', 'split'));
END $$;

-- Add gateway_provider to order_payments for tracking which gateway processed the payment
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='order_payments' 
    AND column_name='gateway_provider'
  ) THEN
    ALTER TABLE public.order_payments 
    ADD COLUMN gateway_provider TEXT DEFAULT 'razorpay'
    CHECK (gateway_provider IN ('razorpay', 'phonepe', 'paytm'));
    
    -- Add generic gateway columns (rename from razorpay-specific)
    ALTER TABLE public.order_payments 
    ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
    ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS gateway_signature TEXT;
    
    -- Migrate existing razorpay data to generic columns
    UPDATE public.order_payments 
    SET 
      gateway_order_id = razorpay_order_id,
      gateway_payment_id = razorpay_payment_id,
      gateway_signature = razorpay_signature,
      gateway_provider = 'razorpay'
    WHERE razorpay_order_id IS NOT NULL;
    
    COMMENT ON COLUMN public.order_payments.gateway_provider IS 'Payment gateway that processed this payment';
    COMMENT ON COLUMN public.order_payments.gateway_order_id IS 'Gateway-specific order/transaction ID';
    COMMENT ON COLUMN public.order_payments.gateway_payment_id IS 'Gateway-specific payment ID';
    COMMENT ON COLUMN public.order_payments.gateway_signature IS 'Gateway signature for verification';
  END IF;
END $$;

-- Create index for querying by gateway provider
CREATE INDEX IF NOT EXISTS idx_order_payments_gateway 
ON public.order_payments(gateway_provider);

CREATE INDEX IF NOT EXISTS idx_restaurants_payment_provider 
ON public.restaurants(payment_provider) 
WHERE payment_gateway_enabled = true;

-- ============================================================================
-- Function to validate restaurant has required credentials for selected gateway
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_payment_credentials()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if payment gateway is enabled
  IF NEW.payment_gateway_enabled = true THEN
    CASE NEW.payment_provider
      WHEN 'razorpay' THEN
        IF NEW.razorpay_key_id IS NULL AND 
           (NEW.payment_settings->>'razorpay_key_id') IS NULL THEN
          RAISE WARNING 'Restaurant % has Razorpay enabled but no key_id configured', NEW.name;
        END IF;
      WHEN 'phonepe' THEN
        IF NEW.phonepe_merchant_id IS NULL THEN
          RAISE WARNING 'Restaurant % has PhonePe enabled but no merchant_id configured', NEW.name;
        END IF;
      WHEN 'paytm' THEN
        IF NEW.paytm_merchant_id IS NULL THEN
          RAISE WARNING 'Restaurant % has Paytm enabled but no merchant_id configured', NEW.name;
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment_credentials ON public.restaurants;
CREATE TRIGGER trg_validate_payment_credentials
  BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_credentials();

-- ============================================================================
-- Audit logging for payment provider changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_payment_provider_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_provider IS DISTINCT FROM NEW.payment_provider THEN
    INSERT INTO public.payment_credential_audit (
      restaurant_id,
      action,
      notes,
      created_at
    ) VALUES (
      NEW.id,
      'provider_changed',
      format('Payment provider changed from %s to %s', 
             COALESCE(OLD.payment_provider, 'none'), 
             NEW.payment_provider),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_payment_provider_change ON public.restaurants;
CREATE TRIGGER trg_log_payment_provider_change
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_provider_change();

-- ============================================================================
-- Usage Examples:
-- 
-- Set restaurant to use PhonePe:
-- UPDATE restaurants 
-- SET payment_provider = 'phonepe',
--     phonepe_merchant_id = 'YOUR_MERCHANT_ID',
--     phonepe_salt_key = 'YOUR_SALT_KEY',
--     phonepe_salt_index = '1'
-- WHERE id = 'restaurant-uuid';
--
-- Set restaurant to use Paytm:
-- UPDATE restaurants 
-- SET payment_provider = 'paytm',
--     paytm_merchant_id = 'YOUR_MID',
--     paytm_merchant_key = 'YOUR_KEY'
-- WHERE id = 'restaurant-uuid';
-- ============================================================================
