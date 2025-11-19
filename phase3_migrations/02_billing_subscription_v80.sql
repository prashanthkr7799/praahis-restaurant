-- ============================================================================
-- 02_billing_subscription_v80.sql
-- Canonical billing & subscription system (v80 features)
-- Includes: subscriptions, billing, payments (subscription), trial + grace, processing
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron; -- used later by cron scheduling

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','grace','suspended','expired','cancelled','inactive')),
  plan_name TEXT DEFAULT 'Per-Table Plan',
  price NUMERIC(10,2), -- optional fixed price (legacy)
  price_per_table NUMERIC(10,2) DEFAULT 100.00,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- legacy compatibility
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  grace_period_days INT DEFAULT 3,
  grace_period_end TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: billing (monthly bills)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  billing_month INT NOT NULL,
  billing_year INT NOT NULL,
  billing_period DATE NOT NULL, -- first day of month
  table_count INT,
  rate_per_table_per_day NUMERIC(10,2),
  days_in_month INT,
  pricing_type TEXT DEFAULT 'per_table' CHECK (pricing_type IN ('per_table','custom')),
  custom_amount NUMERIC(10,2),
  base_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  due_date DATE,
  grace_period_days INT DEFAULT 3,
  grace_end_date DATE,
  invoice_number TEXT UNIQUE,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: payments (subscription / billing payments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID REFERENCES public.billing(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_type TEXT DEFAULT 'monthly_subscription',
  payment_method TEXT,
  payment_gateway_id TEXT, -- transaction id
  payment_gateway_order_id TEXT,
  status TEXT DEFAULT 'created' CHECK (status IN ('created','completed','failed')),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT CREDENTIAL AUDIT (from canonical integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_credential_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('added','updated','removed','verified')),
  old_key_id TEXT,
  new_key_id TEXT,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD restaurant payment credential columns (multi-tenant gateway)
-- ============================================================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_key_secret TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS payment_gateway_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- FUNCTIONS: billing calculations & helpers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_restaurant_billing(
  p_restaurant_id UUID,
  p_billing_month INT,
  p_billing_year INT
) RETURNS NUMERIC AS $$
DECLARE v_pricing_type TEXT; v_custom NUMERIC; v_table_count INT; v_rate NUMERIC := 100.00; v_days INT; v_total NUMERIC; BEGIN
  SELECT pricing_type, custom_monthly_amount, max_tables INTO v_pricing_type, v_custom, v_table_count FROM public.restaurants WHERE id = p_restaurant_id;
  v_days := EXTRACT(DAY FROM (DATE(p_billing_year||'-'||p_billing_month||'-01') + INTERVAL '1 month - 1 day'));
  IF v_pricing_type = 'custom' AND v_custom IS NOT NULL THEN v_total := v_custom; ELSE v_total := v_table_count * v_rate * v_days; END IF; RETURN v_total; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  p_restaurant_id UUID,
  p_billing_year INT,
  p_billing_month INT
) RETURNS TEXT AS $$
DECLARE v_slug TEXT; v_inv TEXT; BEGIN SELECT slug INTO v_slug FROM public.restaurants WHERE id = p_restaurant_id; v_inv := 'INV-'||UPPER(COALESCE(v_slug,'REST'))||'-'||p_billing_year||LPAD(p_billing_month::TEXT,2,'0'); RETURN v_inv; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_monthly_bills(
  p_billing_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  p_billing_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS TABLE(restaurant_id UUID, restaurant_name TEXT, pricing_type TEXT, table_count INT, custom_amount NUMERIC, total_amount NUMERIC, invoice_number TEXT, due_date DATE, status TEXT) AS $$
DECLARE v_rec RECORD; v_total NUMERIC; v_days INT; v_period DATE; v_due DATE; v_grace DATE; v_invoice TEXT; v_rate NUMERIC := 100.00; BEGIN
  v_period := DATE(p_billing_year||'-'||p_billing_month||'-01');
  v_due := v_period + INTERVAL '1 month';
  v_grace := v_due + INTERVAL '3 days';
  v_days := EXTRACT(DAY FROM (v_period + INTERVAL '1 month - 1 day'));
  FOR v_rec IN SELECT r.id,r.name,r.pricing_type,r.custom_monthly_amount,r.max_tables,s.status FROM public.restaurants r JOIN public.subscriptions s ON s.restaurant_id = r.id WHERE r.is_active AND s.status IN ('active','grace') LOOP
    v_total := public.calculate_restaurant_billing(v_rec.id, p_billing_month, p_billing_year);
    v_invoice := public.generate_invoice_number(v_rec.id, p_billing_year, p_billing_month);
    IF NOT EXISTS (SELECT 1 FROM public.billing b WHERE b.restaurant_id = v_rec.id AND b.billing_year = p_billing_year AND b.billing_month = p_billing_month) THEN
      INSERT INTO public.billing(restaurant_id, subscription_id, billing_month, billing_year, billing_period, table_count, rate_per_table_per_day, days_in_month, pricing_type, custom_amount, base_amount, total_amount, status, due_date, grace_period_days, grace_end_date, invoice_number)
      VALUES (v_rec.id, (SELECT id FROM public.subscriptions WHERE restaurant_id = v_rec.id LIMIT 1), p_billing_month, p_billing_year, v_period, v_rec.max_tables, v_rate, v_days, v_rec.pricing_type, v_rec.custom_monthly_amount, CASE WHEN v_rec.pricing_type='custom' THEN 0 ELSE v_total END, v_total, 'pending', v_due, 3, v_grace, v_invoice);
      RETURN QUERY SELECT v_rec.id, v_rec.name, v_rec.pricing_type, v_rec.max_tables, v_rec.custom_monthly_amount, v_total, v_invoice, v_due, 'created';
    ELSE
      RETURN QUERY SELECT v_rec.id, v_rec.name, v_rec.pricing_type, v_rec.max_tables, v_rec.custom_monthly_amount, v_total, v_invoice, v_due, 'already_exists';
    END IF;
  END LOOP; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_trial_subscription(p_restaurant_id UUID, p_trial_days INT DEFAULT 3)
RETURNS UUID AS $$ DECLARE v_id UUID; v_end TIMESTAMPTZ; BEGIN v_end := NOW() + (p_trial_days||' days')::INTERVAL; INSERT INTO public.subscriptions(restaurant_id,status,start_date,end_date,current_period_start,current_period_end,trial_ends_at,grace_period_days,plan_name,price_per_table) VALUES (p_restaurant_id,'trial',NOW(),v_end,NOW(),v_end,v_end,3,'3-Day Trial',100.00) RETURNING id INTO v_id; RETURN v_id; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.expire_trial_subscriptions()
RETURNS TABLE(restaurant_id UUID, restaurant_name TEXT, trial_ended_at TIMESTAMPTZ, status TEXT) AS $$ DECLARE v_rec RECORD; BEGIN FOR v_rec IN SELECT s.id AS subscription_id,s.restaurant_id,r.name,s.trial_ends_at FROM public.subscriptions s JOIN public.restaurants r ON r.id=s.restaurant_id WHERE s.status='trial' AND s.trial_ends_at <= NOW() LOOP UPDATE public.subscriptions SET status='expired', updated_at=NOW() WHERE id=v_rec.subscription_id; UPDATE public.restaurants SET is_active=false, updated_at=NOW() WHERE id=v_rec.restaurant_id; RETURN QUERY SELECT v_rec.restaurant_id,v_rec.name,v_rec.trial_ends_at,'expired'; END LOOP; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.process_subscription_payment(p_billing_id UUID, p_amount NUMERIC, p_payment_method TEXT DEFAULT 'razorpay', p_transaction_id TEXT DEFAULT NULL, p_gateway_order_id TEXT DEFAULT NULL, p_receipt_url TEXT DEFAULT NULL)
RETURNS JSONB AS $$ DECLARE v_rest UUID; v_bill NUMERIC; v_sub UUID; v_current_end TIMESTAMPTZ; v_new_end TIMESTAMPTZ; v_payment UUID; v_result JSONB; BEGIN SELECT restaurant_id,total_amount INTO v_rest,v_bill FROM public.billing WHERE id=p_billing_id; IF v_rest IS NULL THEN RETURN jsonb_build_object('success',false,'error','Billing not found'); END IF; IF p_amount < v_bill THEN RETURN jsonb_build_object('success',false,'error','Insufficient amount'); END IF; SELECT id,current_period_end,end_date INTO v_sub,v_current_end,v_new_end FROM public.subscriptions WHERE restaurant_id=v_rest; v_current_end := COALESCE(v_current_end,v_new_end,NOW()); v_new_end := GREATEST(v_current_end,NOW()) + INTERVAL '30 days'; INSERT INTO public.payments(billing_id, restaurant_id, subscription_id, amount, payment_type, payment_method, payment_gateway_id, payment_gateway_order_id, status, payment_date, completed_at, receipt_url) VALUES (p_billing_id,v_rest,v_sub,p_amount,'monthly_subscription',p_payment_method,p_transaction_id,p_gateway_order_id,'completed',NOW(),NOW(),p_receipt_url) RETURNING id INTO v_payment; UPDATE public.billing SET status='paid', paid_at=NOW(), receipt_url=p_receipt_url, updated_at=NOW() WHERE id=p_billing_id; UPDATE public.subscriptions SET status='active', current_period_end=v_new_end, end_date=v_new_end, last_payment_date=NOW(), next_billing_date=v_new_end, suspended_at=NULL, suspended_reason=NULL, updated_at=NOW() WHERE restaurant_id=v_rest; UPDATE public.restaurants SET is_active=true, updated_at=NOW() WHERE id=v_rest; v_result := jsonb_build_object('success',true,'payment_id',v_payment,'restaurant_id',v_rest,'subscription_extended_to',v_new_end,'restaurant_reactivated',true); RETURN v_result; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.suspend_overdue_subscriptions()
RETURNS TABLE(restaurant_id UUID, restaurant_name TEXT, billing_amount NUMERIC, days_overdue INT, status TEXT) AS $$ DECLARE v_rec RECORD; v_days INT; BEGIN FOR v_rec IN SELECT b.id AS billing_id,b.restaurant_id,r.name,b.total_amount,b.grace_end_date,s.id AS subscription_id FROM public.billing b JOIN public.restaurants r ON r.id=b.restaurant_id JOIN public.subscriptions s ON s.restaurant_id=b.restaurant_id WHERE b.status IN ('pending','overdue') AND b.grace_end_date < CURRENT_DATE AND s.status NOT IN ('suspended','cancelled') LOOP v_days := CURRENT_DATE - v_rec.grace_end_date; UPDATE public.billing SET status='overdue', suspended_at=NOW(), updated_at=NOW() WHERE id=v_rec.billing_id; UPDATE public.subscriptions SET status='suspended', suspended_at=NOW(), suspended_reason='Payment overdue', updated_at=NOW() WHERE id=v_rec.subscription_id; UPDATE public.restaurants SET is_active=false, updated_at=NOW() WHERE id=v_rec.restaurant_id; RETURN QUERY SELECT v_rec.restaurant_id,v_rec.name,v_rec.total_amount,v_days,'suspended'; END LOOP; END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_restaurant_billing_summary(p_restaurant_id UUID)
RETURNS JSONB AS $$ DECLARE v_bill RECORD; v_sub RECORD; v_total_paid NUMERIC; v_outstanding NUMERIC; v_summary JSONB; BEGIN SELECT * INTO v_bill FROM public.billing WHERE restaurant_id=p_restaurant_id AND billing_year=EXTRACT(YEAR FROM CURRENT_DATE) AND billing_month=EXTRACT(MONTH FROM CURRENT_DATE) ORDER BY created_at DESC LIMIT 1; SELECT * INTO v_sub FROM public.subscriptions WHERE restaurant_id=p_restaurant_id LIMIT 1; SELECT COALESCE(SUM(total_amount),0) INTO v_total_paid FROM public.billing WHERE restaurant_id=p_restaurant_id AND status='paid' AND billing_year=EXTRACT(YEAR FROM CURRENT_DATE); SELECT COALESCE(SUM(total_amount),0) INTO v_outstanding FROM public.billing WHERE restaurant_id=p_restaurant_id AND status IN ('pending','overdue'); v_summary := jsonb_build_object('restaurant_id',p_restaurant_id,'current_bill',row_to_json(v_bill),'subscription',row_to_json(v_sub),'total_paid_this_year',v_total_paid,'outstanding_amount',v_outstanding,'subscription_status',v_sub.status,'subscription_end_date',COALESCE(v_sub.current_period_end,v_sub.end_date)); RETURN v_summary; END;$$ LANGUAGE plpgsql;

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_billing_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS billing_updated_at_trigger ON public.billing;
CREATE TRIGGER billing_updated_at_trigger BEFORE UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.update_billing_timestamp();
DROP TRIGGER IF EXISTS subscriptions_updated_at_trigger ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at_trigger BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_billing_timestamp();
DROP TRIGGER IF EXISTS payments_updated_at_trigger ON public.payments;
CREATE TRIGGER payments_updated_at_trigger BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_billing_timestamp();

-- ============================================================================
-- BASIC INDEXES (more in 13)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_billing_restaurant_month ON public.billing(restaurant_id, billing_year, billing_month);
CREATE INDEX IF NOT EXISTS idx_payments_billing ON public.payments(billing_id);

-- ============================================================================
-- END BILLING SUBSCRIPTION V80
-- ============================================================================
