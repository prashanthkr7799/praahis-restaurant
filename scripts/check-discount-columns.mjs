#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDiscountColumns() {
  console.log('🔍 Checking for discount columns in orders table...\n');

  try {
    // Try to query with discount_type and discount_value
    const { data, error } = await supabase
      .from('orders')
      .select('id, discount_type, discount_value, discount_amount')
      .limit(1);

    if (error) {
      console.error('❌ Error querying discount columns:', error.message);
      console.log('\n💡 These columns likely don\'t exist in the database yet.');
      console.log('📝 You need to run the migration to add them.\n');
      return false;
    }

    console.log('✅ Discount columns exist in database!');
    console.log('   - discount_type');
    console.log('   - discount_value');
    console.log('   - discount_amount');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

checkDiscountColumns();
