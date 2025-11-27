#!/usr/bin/env node

/**
 * Test all orders queries to identify the 400 error source
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🔍 TESTING ORDERS API QUERIES                               ║
║                                                               ║
║  This will test all possible query patterns to find the      ║
║  source of the 400 error.                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function runTests() {
  // Get a sample restaurant_id
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1);
  
  const restaurantId = restaurants?.[0]?.id;
  
  if (!restaurantId) {
    console.log('⚠️  No restaurants found in database');
    return;
  }
  
  console.log(`✅ Using restaurant_id: ${restaurantId.substring(0, 8)}...\n`);
  
  const tests = [
    {
      name: 'Simple select *',
      query: async () => await supabase.from('orders').select('*').limit(1)
    },
    {
      name: 'Select * with restaurant filter',
      query: async () => await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).limit(1)
    },
    {
      name: 'Select with inner join',
      query: async () => await supabase.from('orders').select('*, tables(table_number)').eq('restaurant_id', restaurantId).limit(1)
    },
    {
      name: 'Select with left join',
      query: async () => await supabase.from('orders').select('*, tables!left(table_number)').eq('restaurant_id', restaurantId).limit(1)
    },
    {
      name: 'Select specific columns',
      query: async () => await supabase.from('orders').select('id, order_number, order_status').eq('restaurant_id', restaurantId).limit(1)
    },
    {
      name: 'Count query',
      query: async () => await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId)
    },
  ];
  
  console.log('Running tests...\n');
  
  for (const test of tests) {
    try {
      const { data, error } = await test.query();
      if (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Details: ${JSON.stringify(error.details)}\n`);
      } else {
        console.log(`✅ ${test.name}`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}`);
      console.log(`   Exception: ${err.message}\n`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 SUMMARY:');
  console.log('   If all tests pass, the 400 error might be:');
  console.log('   1. Browser cache (try hard refresh: Cmd+Shift+R)');
  console.log('   2. A different component making the query');
  console.log('   3. RLS policy issue when not authenticated\n');
  console.log('🔧 NEXT STEPS:');
  console.log('   1. Clear browser cache and hard refresh');
  console.log('   2. Check browser Network tab for the failing URL');
  console.log('   3. Check if error happens before login/authentication\n');
}

runTests();
