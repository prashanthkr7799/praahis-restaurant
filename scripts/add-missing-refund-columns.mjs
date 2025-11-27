#!/usr/bin/env node

/**
 * Add missing refund columns to existing Supabase tables
 * This applies the refund-related columns from 01_core_schema.sql that are missing in production
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🔧 ADD MISSING REFUND COLUMNS TO SUPABASE DATABASE          ║
║                                                               ║
║  The refund columns are defined in:                          ║
║  phase3_migrations/01_core_schema.sql                        ║
║                                                               ║
║  But they don't exist in your actual Supabase database.      ║
║  You need to run this SQL in Supabase SQL Editor:            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📋 COPY THIS SQL AND RUN IN SUPABASE SQL EDITOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add missing refund columns to orders table (from 01_core_schema.sql)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add missing refund columns to order_payments table (from 01_core_schema.sql)
ALTER TABLE public.order_payments
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_method TEXT CHECK (refund_method IN ('cash','online','original_method') OR refund_method IS NULL),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add helpful indexes for refund queries
CREATE INDEX IF NOT EXISTS idx_orders_refund_amount ON public.orders(refund_amount) WHERE refund_amount > 0;
CREATE INDEX IF NOT EXISTS idx_order_payments_refund_amount ON public.order_payments(refund_amount) WHERE refund_amount > 0;

-- Add constraint to prevent refund exceeding total (with error handling)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_refund_not_exceeds_total'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT check_refund_not_exceeds_total 
      CHECK (refund_amount <= total);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_refund_not_exceeds_amount'
  ) THEN
    ALTER TABLE public.order_payments
    ADD CONSTRAINT check_payment_refund_not_exceeds_amount 
      CHECK (refund_amount <= amount);
  END IF;
END $$;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 HOW TO RUN:

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the SQL above
4. Paste and click "RUN"
5. Verify success message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ After running, verify with:
   node scripts/check-orders-schema.mjs

`);

// Check current schema
async function checkCurrentSchema() {
  console.log('\n🔍 Checking current database schema...\n');
  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  
  if (ordersError) {
    console.error('❌ Error querying orders:', ordersError.message);
    return;
  }
  
  const { data: payments, error: paymentsError } = await supabase
    .from('order_payments')
    .select('*')
    .limit(1);
  
  if (paymentsError) {
    console.error('❌ Error querying order_payments:', paymentsError.message);
    return;
  }
  
  const ordersCols = orders && orders.length > 0 ? Object.keys(orders[0]) : [];
  const paymentsCols = payments && payments.length > 0 ? Object.keys(payments[0]) : [];
  
  console.log('📊 Current columns in orders table:');
  const ordersHasRefund = ordersCols.includes('refund_amount');
  console.log(ordersHasRefund ? '  ✅ Has refund_amount' : '  ❌ Missing refund_amount');
  console.log(ordersCols.includes('refund_reason') ? '  ✅ Has refund_reason' : '  ❌ Missing refund_reason');
  console.log(ordersCols.includes('refunded_at') ? '  ✅ Has refunded_at' : '  ❌ Missing refunded_at');
  
  console.log('\n📊 Current columns in order_payments table:');
  const paymentsHasRefund = paymentsCols.includes('refund_amount');
  console.log(paymentsHasRefund ? '  ✅ Has refund_amount' : '  ❌ Missing refund_amount');
  console.log(paymentsCols.includes('refund_reason') ? '  ✅ Has refund_reason' : '  ❌ Missing refund_reason');
  console.log(paymentsCols.includes('refund_method') ? '  ✅ Has refund_method' : '  ❌ Missing refund_method');
  console.log(paymentsCols.includes('refunded_at') ? '  ✅ Has refunded_at' : '  ❌ Missing refunded_at');
  
  if (ordersHasRefund && paymentsHasRefund) {
    console.log('\n✅ ALL REFUND COLUMNS EXIST! No migration needed.\n');
  } else {
    console.log('\n⚠️  REFUND COLUMNS ARE MISSING! Please run the SQL above in Supabase.\n');
  }
}

checkCurrentSchema();
