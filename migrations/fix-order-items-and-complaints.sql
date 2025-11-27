-- ============================================================================
-- Migration: Fix Order Items Table and Complaints Issue Type Column
-- Date: 2025-11-22
-- Description: 
--   1. Create order_items table if it doesn't exist
--   2. Add issue_type column to complaints table if it doesn't exist
-- ============================================================================

-- ============================================================================
-- PART 1: Create order_items table
-- ============================================================================

-- Check if table exists and create it
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  item_status TEXT DEFAULT 'received' CHECK (item_status IN ('received', 'preparing', 'ready', 'served', 'cancelled')),
  is_veg BOOLEAN DEFAULT true,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(item_status);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read order_items"
ON public.order_items FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow authenticated users to insert
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update order_items"
ON public.order_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete order_items"
ON public.order_items FOR DELETE
TO authenticated
USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_items_updated_at ON public.order_items;
CREATE TRIGGER trigger_update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_items_updated_at();

-- ============================================================================
-- PART 2: Add issue_type column to complaints table
-- ============================================================================

-- Add issue_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'issue_type'
  ) THEN
    ALTER TABLE public.complaints 
    ADD COLUMN issue_type TEXT NOT NULL DEFAULT 'other' 
    CHECK (issue_type IN ('food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other'));
    
    -- Remove the default after adding (so new rows require explicit value)
    ALTER TABLE public.complaints 
    ALTER COLUMN issue_type DROP DEFAULT;
  END IF;
END $$;

-- Add priority column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.complaints 
    ADD COLUMN priority TEXT DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.complaints 
    ADD COLUMN status TEXT DEFAULT 'open' 
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
  END IF;
END $$;

-- Add other helpful columns if they don't exist
DO $$ 
BEGIN
  -- action_taken column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'action_taken'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN action_taken TEXT;
  END IF;

  -- reported_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE public.complaints 
    ADD COLUMN reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- resolved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE public.complaints 
    ADD COLUMN resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- resolved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;

  -- updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add trigger to update updated_at on complaints
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaints_updated_at();

-- Create indexes for complaints
CREATE INDEX IF NOT EXISTS idx_complaints_restaurant_id ON public.complaints(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_order_id ON public.complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_table_id ON public.complaints(table_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON public.complaints(issue_type);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify order_items table
SELECT 
  'order_items table' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'order_items'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Verify complaints.issue_type column
SELECT 
  'complaints.issue_type column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaints' 
    AND column_name = 'issue_type'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show order_items table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Show complaints table structure (key columns)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'complaints'
  AND column_name IN ('id', 'issue_type', 'priority', 'status', 'description')
ORDER BY ordinal_position;
