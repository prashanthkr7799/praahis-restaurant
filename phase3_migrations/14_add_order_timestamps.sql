-- ============================================================================
-- Add Missing Timestamp Columns to Orders Table
-- These columns are defined in the schema but may not exist in the actual database
-- ============================================================================

-- Add started_at column (when chef accepts order)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.started_at IS 'Timestamp when chef accepted and started preparing the order';

-- Add marked_ready_at column (when chef marks order ready)
-- This column is already in the schema but adding IF NOT EXISTS for safety
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS marked_ready_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.marked_ready_at IS 'Timestamp when chef marked the order as ready for service';

-- Add served_at column (when waiter marks order served)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.served_at IS 'Timestamp when waiter marked the order as served to customer';

-- Add customer_notified_at column (when customer is notified for takeaway)
-- This column is already in the schema but adding IF NOT EXISTS for safety
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.customer_notified_at IS 'Timestamp when customer was notified that their order is ready';

-- Create index for performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_orders_started_at ON public.orders(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_marked_ready_at ON public.orders(marked_ready_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_served_at ON public.orders(served_at DESC);

-- ============================================================================
-- Update existing orders to set timestamps based on status
-- (One-time backfill for existing data)
-- ============================================================================

-- For orders in 'preparing' status without started_at, use created_at
UPDATE public.orders 
SET started_at = created_at 
WHERE order_status IN ('preparing', 'ready', 'served') 
  AND started_at IS NULL;

-- For orders in 'ready' status without marked_ready_at, use updated_at
UPDATE public.orders 
SET marked_ready_at = updated_at 
WHERE order_status IN ('ready', 'served') 
  AND marked_ready_at IS NULL;

-- For orders in 'served' status without served_at, use updated_at
UPDATE public.orders 
SET served_at = updated_at 
WHERE order_status = 'served' 
  AND served_at IS NULL;

-- ============================================================================
-- Create trigger to auto-set timestamps on status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set started_at when order moves to preparing
  IF NEW.order_status = 'preparing' AND OLD.order_status != 'preparing' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;
  
  -- Set marked_ready_at when order moves to ready
  IF NEW.order_status = 'ready' AND OLD.order_status != 'ready' AND NEW.marked_ready_at IS NULL THEN
    NEW.marked_ready_at = NOW();
  END IF;
  
  -- Set served_at when order moves to served
  IF NEW.order_status = 'served' AND OLD.order_status != 'served' AND NEW.served_at IS NULL THEN
    NEW.served_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_set_order_timestamps ON public.orders;

-- Create trigger
CREATE TRIGGER trg_set_order_timestamps
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_timestamps();

COMMENT ON FUNCTION public.set_order_timestamps IS 'Automatically sets timestamp columns when order status changes';

-- ============================================================================
-- Verification Query
-- Run this to verify the columns exist
-- ============================================================================

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'orders'
--   AND column_name IN ('started_at', 'marked_ready_at', 'served_at', 'customer_notified_at')
-- ORDER BY column_name;
