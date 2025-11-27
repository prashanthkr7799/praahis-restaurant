#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Get Supabase credentials
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// If not in env, try to find in running dev server or index.html
if (!supabaseUrl) {
  try {
    // Try reading from vite dev server output or index.html
    const html = readFileSync('./index.html', 'utf-8');
    
    // Look for meta tags or script tags with credentials
    const urlMatch = html.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    if (urlMatch) supabaseUrl = urlMatch[0];
    
    log('\n💡 Supabase URL found in index.html', 'yellow');
  } catch (err) {
    // Ignore
  }
}

if (!supabaseUrl || !supabaseKey) {
  log('\n❌ Missing Supabase credentials', 'red');
  log('\nPlease provide credentials in one of these ways:', 'yellow');
  log('1. Set environment variables:', 'cyan');
  log('   export VITE_SUPABASE_URL="your-url"', 'white');
  log('   export VITE_SUPABASE_ANON_KEY="your-key"', 'white');
  log('\n2. Or run: npm run dev (credentials loaded from .env.local)', 'cyan');
  log('   Then run this test in another terminal\n', 'white');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test definitions
const tests = [
  { 
    table: 'restaurants', 
    name: 'Restaurants',
    cols: 'id,name,slug,address,phone,email'
  },
  { 
    table: 'tables', 
    name: 'Tables',
    cols: 'id,restaurant_id,table_number,capacity,qr_code_url,is_active'
  },
  { 
    table: 'table_sessions', 
    name: 'Table Sessions',
    cols: 'id,table_id,restaurant_id,status,started_at'
  },
  { 
    table: 'menu_items', 
    name: 'Menu Items',
    cols: 'id,restaurant_id,name,price,category,is_available,is_vegetarian'
  },
  { 
    table: 'orders', 
    name: 'Orders (Critical)',
    cols: 'id,restaurant_id,order_number,order_type,order_status,payment_status,payment_method,subtotal,tax_amount,discount_amount,total,items'
  },
  { 
    table: 'order_items', 
    name: 'Order Items',
    cols: 'id,order_id,menu_item_id,name,quantity,price,item_status'
  },
  { 
    table: 'order_payments', 
    name: 'Order Payments',
    cols: 'id,order_id,restaurant_id,amount,currency,status,payment_method'
  },
  { 
    table: 'feedbacks', 
    name: 'Feedbacks',
    cols: 'id,order_id,restaurant_id,rating,comment'
  },
  { 
    table: 'complaints', 
    name: 'Complaints',
    cols: 'id,restaurant_id,issue_type,description,priority,status'
  },
  { 
    table: 'users', 
    name: 'Users (Staff)',
    cols: 'id,email,full_name,role,restaurant_id,is_active'
  }
];

async function runTests() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('  DATABASE SCHEMA MIGRATION TEST', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  log(`Testing ${tests.length} core tables...\n`, 'cyan');

  let passed = 0;
  let failed = 0;
  const warnings = [];
  const errors = [];

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    
    try {
      const { data, error, count } = await supabase
        .from(test.table)
        .select(test.cols, { count: 'exact' })
        .limit(1);
      
      if (error) {
        log(`❌ FAILED`, 'red');
        log(`  Error: ${error.message}`, 'red');
        failed++;
        errors.push({ table: test.name, error: error.message });
        
        // Check for specific missing columns
        if (error.message.includes('discount_type') || error.message.includes('discount_value')) {
          warnings.push('Optional discount tracking columns (discount_type, discount_value) are missing');
        }
        if (error.message.includes('refund_amount') || error.message.includes('refund_reason')) {
          warnings.push('Refund columns may be missing - refund feature may not work');
        }
      } else {
        log(`✅ OK (${count || 0} records)`, 'green');
        passed++;
      }
    } catch (err) {
      log(`❌ FAILED`, 'red');
      log(`  Error: ${err.message}`, 'red');
      failed++;
      errors.push({ table: test.name, error: err.message });
    }
  }

  // Summary
  log('\n' + '═'.repeat(70), 'cyan');
  log('  TEST SUMMARY', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  log(`✅ Passed: ${passed}/${tests.length}`, passed === tests.length ? 'green' : 'yellow');
  log(`❌ Failed: ${failed}/${tests.length}`, failed > 0 ? 'red' : 'green');

  // Show errors
  if (errors.length > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    errors.forEach(e => {
      log(`  • ${e.table}`, 'red');
      log(`    ${e.error}`, 'yellow');
    });
  }

  // Show warnings
  if (warnings.length > 0) {
    const uniqueWarnings = [...new Set(warnings)];
    log('\n⚠️  WARNINGS:', 'yellow');
    uniqueWarnings.forEach(w => log(`  • ${w}`, 'yellow'));
    log('\n💡 The app will work but some optional features may be limited.', 'cyan');
  }

  // Feature-specific checks
  log('\n' + '═'.repeat(70), 'cyan');
  log('  FEATURE AVAILABILITY', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  // Check critical features
  const ordersTest = errors.find(e => e.table === 'Orders (Critical)');
  if (!ordersTest) {
    log('✅ Core ordering system: OPERATIONAL', 'green');
  } else {
    log('❌ Core ordering system: BROKEN', 'red');
  }

  const paymentsTest = errors.find(e => e.table === 'Order Payments');
  if (!paymentsTest) {
    log('✅ Payment processing: OPERATIONAL', 'green');
  } else {
    log('❌ Payment processing: BROKEN', 'red');
  }

  const usersTest = errors.find(e => e.table === 'Users (Staff)');
  if (!usersTest) {
    log('✅ Staff management: OPERATIONAL', 'green');
  } else {
    log('❌ Staff management: BROKEN', 'red');
  }

  log('\n' + '═'.repeat(70) + '\n', 'cyan');

  // Final result
  if (failed === 0) {
    log('✅ ALL TESTS PASSED - Database schema is properly migrated!\n', 'green');
    return 0;
  } else if (failed <= 2 && warnings.length > 0) {
    log('⚠️  TESTS PASSED WITH WARNINGS - Some optional features unavailable\n', 'yellow');
    return 0;
  } else {
    log('❌ TESTS FAILED - Critical database schema issues detected\n', 'red');
    log('🔧 Please run migrations to fix these issues\n', 'yellow');
    return 1;
  }
}

// Run tests
runTests()
  .then(code => process.exit(code))
  .catch(err => {
    log(`\n❌ Fatal error: ${err.message}\n`, 'red');
    console.error(err);
    process.exit(1);
  });
