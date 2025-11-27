-- ============================================================================
-- 17_split_payment_support.sql
-- Add support for split payments (cash + online) in orders
-- ============================================================================

-- Add payment_split_details column to orders table
-- This stores the breakdown of cash and online amounts for split payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='orders' 
    AND column_name='payment_split_details'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN payment_split_details JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN public.orders.payment_split_details IS 
    'JSON object storing split payment details: {cash_amount, online_amount, split_timestamp}';
  END IF;
END $$;

-- Update payment_method constraint to include 'split'
DO $$ BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_method_check' 
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;
  END IF;
  
  -- Add new constraint with 'split' option
  ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'razorpay', 'upi', 'card', 'split'));
END $$;

-- Create index for querying split payments
CREATE INDEX IF NOT EXISTS idx_orders_payment_split 
ON public.orders(payment_method) 
WHERE payment_method = 'split';

COMMENT ON INDEX idx_orders_payment_split IS 
'Index for efficiently querying split payment orders';

-- ============================================================================
-- Example usage:
-- 
-- When a split payment is made, the orders table will store:
-- {
--   payment_method: 'split',
--   payment_split_details: {
--     cash_amount: 500.00,
--     online_amount: 300.00,
--     split_timestamp: '2025-11-21T10:30:00Z'
--   }
-- }
-- ============================================================================
