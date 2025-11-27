-- ============================================================================
-- 01_core_schema.sql
-- Canonical core schema: base entities, ordering, customers, staff, multi-tenant
-- Excludes billing/subscription special fields (added later in 02/03) and RLS functions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid

-- ============================================================================
-- TABLE: restaurants (core + fields required by later billing functions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  max_tables INT DEFAULT 10 CHECK (max_tables >= 0),
  max_menu_items INT DEFAULT 100 CHECK (max_menu_items >= 0),
  max_users INT DEFAULT 10 CHECK (max_users >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.restaurants IS 'Tenant restaurants';
COMMENT ON COLUMN public.restaurants.slug IS 'Unique restaurant slug used for invoice numbers and URLs';

-- ============================================================================
-- TABLE: tables (physical dining tables)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number VARCHAR(10) NOT NULL,
  table_name TEXT,
  capacity INT DEFAULT 4 CHECK (capacity > 0),
  status TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning')),
  qr_code_url TEXT,
  active_session_id UUID, -- linked later by sessions system
  booked_at TIMESTAMPTZ, -- when table was occupied/reserved
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- ============================================================================
-- TABLE: menu_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_vegetarian BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  preparation_time INT DEFAULT 15,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  table_number VARCHAR(10),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  order_type TEXT DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_address TEXT,
  items JSONB NOT NULL, -- array of item objects
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(10,2) DEFAULT 0 CHECK (tax >= 0),
  tax_amount NUMERIC(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount NUMERIC(10,2) DEFAULT 0 CHECK (discount >= 0),
  discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) CHECK (discount_value >= 0),
  discount_reason TEXT,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','partially_refunded')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','razorpay','upi','card','online','split')),
  payment_split_details JSONB DEFAULT NULL, -- For split payments: {cash_amount: number, online_amount: number, razorpay_payment_id: string, split_timestamp: string}
  order_status TEXT DEFAULT 'received' CHECK (order_status IN ('pending_payment','received','preparing','ready','served','completed','cancelled')),
  special_instructions TEXT,
  order_token TEXT,
  feedback_submitted BOOLEAN DEFAULT false,
  feedback_submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_notes TEXT,
  refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  marked_ready_at TIMESTAMPTZ,
  customer_notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: feedbacks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID -- added later by sessions system
);

-- ============================================================================
-- TABLE: complaints (issue/complaint tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  table_number VARCHAR(10),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other')),
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  action_taken TEXT,
  reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: users (staff / platform user accounts - canonical unified)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- may be NULL if external auth provider
  full_name TEXT,
  name TEXT, -- kept in sync with full_name via trigger
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff', -- waiter, chef, admin, manager, owner, staff
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT false, -- legacy ownership flag
  -- Track last successful login for UI and audits
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill sync alignment (idempotent)
UPDATE public.users SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
UPDATE public.users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Ensure last_login exists for existing databases (idempotent for reruns)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Sync trigger
CREATE OR REPLACE FUNCTION public.sync_user_names()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN NEW.full_name = NEW.name; END IF;
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN NEW.name = NEW.full_name; END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sync_user_names_trigger ON public.users;
CREATE TRIGGER sync_user_names_trigger BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_names();

-- ============================================================================
-- TABLE: order_payments (customer checkout payments - distinct from subscription billing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created','authorized','captured','failed','refunded','partially_refunded')),
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  payment_details JSONB DEFAULT '{}',
  refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
  refund_reason TEXT,
  refund_method TEXT CHECK (refund_method IN ('cash','online','original_method') OR refund_method IS NULL),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(razorpay_payment_id)
);

-- ============================================================================
-- TABLE: daily_reconciliation (cash reconciliation tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  
  -- Cash Breakdown
  dinein_cash_amount NUMERIC(10,2) DEFAULT 0 CHECK (dinein_cash_amount >= 0),
  dinein_cash_orders_count INT DEFAULT 0,
  takeaway_cash_amount NUMERIC(10,2) DEFAULT 0 CHECK (takeaway_cash_amount >= 0),
  takeaway_cash_orders_count INT DEFAULT 0,
  split_payment_cash_amount NUMERIC(10,2) DEFAULT 0 CHECK (split_payment_cash_amount >= 0),
  split_payment_orders_count INT DEFAULT 0,
  
  -- Total Expected vs Actual
  total_expected_cash NUMERIC(10,2) NOT NULL CHECK (total_expected_cash >= 0),
  actual_cash_counted NUMERIC(10,2) NOT NULL CHECK (actual_cash_counted >= 0),
  difference NUMERIC(10,2) DEFAULT 0,
  
  -- Denomination Breakdown
  denomination_details JSONB DEFAULT '{}', -- e.g., {"2000": 5, "500": 10, "200": 8, ...}
  
  -- Reconciliation Info
  reason_for_difference TEXT,
  reconciled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(restaurant_id, reconciliation_date)
);

-- ============================================================================
-- FUNCTIONS: generic utility
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE today TEXT; cnt INT; num TEXT; BEGIN
  today := TO_CHAR(NOW(),'YYYYMMDD');
  SELECT COUNT(*) INTO cnt FROM public.orders WHERE order_number LIKE 'ORD-'||today||'-%';
  num := 'ORD-'||today||'-'||LPAD((cnt+1)::TEXT,4,'0');
  RETURN num; END;$$ LANGUAGE plpgsql;

-- Generate takeaway-specific order number (T001, T002, etc.)
CREATE OR REPLACE FUNCTION public.generate_takeaway_order_number()
RETURNS TEXT AS $$
DECLARE today TEXT; cnt INT; num TEXT; BEGIN
  today := TO_CHAR(NOW(),'YYYYMMDD');
  SELECT COUNT(*) INTO cnt FROM public.orders WHERE order_type IN ('takeaway', 'delivery') AND order_number LIKE 'T%';
  num := 'T'||LPAD((cnt+1)::TEXT,3,'0');
  RETURN num; END;$$ LANGUAGE plpgsql;

-- Assign order_number before insert based on order_type
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS TRIGGER AS $$ BEGIN 
  IF NEW.order_number IS NULL THEN 
    IF NEW.order_type IN ('takeaway', 'delivery') THEN
      NEW.order_number := public.generate_takeaway_order_number();
    ELSE
      NEW.order_number := public.generate_order_number();
    END IF;
  END IF; 
  RETURN NEW; 
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_assign_number ON public.orders;
CREATE TRIGGER trg_orders_assign_number BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.assign_order_number();

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS restaurants_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS tables_updated_at ON public.tables;
CREATE TRIGGER tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS menu_items_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS order_payments_updated_at ON public.order_payments;
CREATE TRIGGER order_payments_updated_at BEFORE UPDATE ON public.order_payments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS complaints_updated_at ON public.complaints;
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
DROP TRIGGER IF EXISTS daily_reconciliation_updated_at ON public.daily_reconciliation;
CREATE TRIGGER daily_reconciliation_updated_at BEFORE UPDATE ON public.daily_reconciliation FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Indexes for complaints table
CREATE INDEX IF NOT EXISTS idx_complaints_restaurant_id ON public.complaints(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_order_id ON public.complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_at ON public.complaints(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON public.complaints(issue_type);

-- Indexes for daily_reconciliation table
CREATE INDEX IF NOT EXISTS idx_daily_reconciliation_restaurant ON public.daily_reconciliation(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_reconciliation_date ON public.daily_reconciliation(reconciliation_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reconciliation_status ON public.daily_reconciliation(status);

-- Ensure compatibility columns on restaurants (idempotent for reruns)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS max_menu_items INT DEFAULT 100;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 10;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='restaurants' AND column_name='max_menu_items'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN public.restaurants.max_menu_items IS ''Maximum allowed menu items for this restaurant''';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='restaurants' AND column_name='max_users'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN public.restaurants.max_users IS ''Maximum allowed users for this restaurant''';
  END IF;
END $$;

-- ============================================================================
-- INDEXES (core; additional in 13)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON public.orders(cancelled_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at ON public.orders(refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_restaurant ON public.users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments(order_id);

-- Ensure compatibility columns and constraints for existing databases
-- Add tables.booked_at if missing
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- Add takeaway/delivery support columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine_in';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Update order_type constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_order_type_check' 
      AND conrelid = 'public.orders'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT orders_order_type_check';
  END IF;
  EXECUTE 'ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN (''dine_in'', ''takeaway'', ''delivery''))';
END $$;

-- Update payment_method constraint to include 'online'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_method_check' 
      AND conrelid = 'public.orders'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check';
  END IF;
  EXECUTE 'ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN (''cash'',''razorpay'',''upi'',''card'',''online''))';
END $$;

-- Relax/align orders.order_status to include 'pending_payment' and 'completed'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_order_status_check' 
      AND conrelid = 'public.orders'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT orders_order_status_check';
  END IF;
  EXECUTE 'ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN (''pending_payment'',''received'',''preparing'',''ready'',''served'',''completed'',''cancelled''))';
END $$;

-- ============================================================================
-- FUNCTION: Cascade order status to all items
-- Updates both orders.order_status AND all items[].item_status in one operation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_order_status_cascade(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS TABLE (
  id UUID,
  order_status TEXT,
  items JSONB,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_updated_items JSONB := '[]'::JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Validate status
  IF p_new_status NOT IN ('pending_payment', 'received', 'preparing', 'ready', 'served', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_new_status;
  END IF;

  -- Fetch current items
  SELECT o.items INTO v_items
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_items IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Update each item's status to match order status
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    -- Set item_status to match order status
    v_item := jsonb_set(v_item, '{item_status}', to_jsonb(p_new_status));
    
    -- Set timestamps based on status
    IF p_new_status = 'preparing' AND (v_item->>'started_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{started_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    IF p_new_status = 'ready' AND (v_item->>'ready_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{ready_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    IF p_new_status = 'served' AND (v_item->>'served_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{served_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    v_updated_items := v_updated_items || jsonb_build_array(v_item);
  END LOOP;

  -- Update order with new status and updated items
  RETURN QUERY
  UPDATE public.orders o
  SET 
    order_status = p_new_status,
    items = v_updated_items,
    updated_at = v_now
  WHERE o.id = p_order_id
  RETURNING o.id, o.order_status, o.items, o.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_order_status_cascade IS 
'Cascades order status updates to all order items. Updates both orders.order_status and all items[].item_status in one atomic operation.';

-- ============================================================================
-- END CORE SCHEMA
-- ============================================================================
