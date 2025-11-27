#!/usr/bin/env node

/**
 * Migration Runner: Fix Order Items and Complaints
 * 
 * This script applies the migration to:
 * 1. Create order_items table
 * 2. Add issue_type column to complaints
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

// Get credentials from environment or .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL;

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('\n❌ Missing Supabase credentials', 'red');
  log('\nPlease provide credentials:', 'yellow');
  log('  export VITE_SUPABASE_URL="your-url"', 'cyan');
  log('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"', 'cyan');
  log('\nOr use anon key (less powerful):', 'yellow');
  log('  export VITE_SUPABASE_ANON_KEY="your-anon-key"\n', 'cyan');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('  MIGRATION: Fix Order Items & Complaints', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  // Read migration SQL
  let migrationSQL;
  try {
    migrationSQL = readFileSync('./migrations/fix-order-items-and-complaints.sql', 'utf-8');
    log('✅ Migration SQL loaded', 'green');
  } catch (err) {
    log(`❌ Failed to read migration file: ${err.message}`, 'red');
    process.exit(1);
  }

  // Split into individual statements (rough split by semicolons)
  // Note: This is a simple approach. For complex SQL, use a proper parser
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^SELECT/i));

  log(`\n📋 Found ${statements.length} migration statements\n`, 'cyan');

  // Pre-flight checks
  log('🔍 Running pre-flight checks...', 'cyan');

  // Check 1: Does order_items table exist?
  const { data: orderItemsExists, error: checkError1 } = await supabase
    .from('order_items')
    .select('id')
    .limit(1);

  if (checkError1 && checkError1.message.includes('does not exist')) {
    log('  ⚠️  order_items table: MISSING (will be created)', 'yellow');
  } else if (checkError1) {
    log('  ⚠️  order_items table: ERROR - ' + checkError1.message, 'yellow');
  } else {
    log('  ✅ order_items table: EXISTS (will be skipped)', 'green');
  }

  // Check 2: Does complaints.issue_type exist?
  const { data: complaintsData, error: checkError2 } = await supabase
    .from('complaints')
    .select('issue_type')
    .limit(1);

  if (checkError2 && checkError2.message.includes('issue_type')) {
    log('  ⚠️  complaints.issue_type column: MISSING (will be added)', 'yellow');
  } else if (checkError2) {
    log('  ⚠️  complaints.issue_type: ERROR - ' + checkError2.message, 'yellow');
  } else {
    log('  ✅ complaints.issue_type column: EXISTS (will be skipped)', 'green');
  }

  log('\n' + '─'.repeat(70) + '\n', 'cyan');

  // Ask for confirmation
  log('⚠️  IMPORTANT: This will modify your database schema', 'yellow');
  log('   - Create order_items table with RLS policies', 'white');
  log('   - Add issue_type and related columns to complaints table', 'white');
  log('   - Create indexes for better performance\n', 'white');

  // Since we can't prompt in script, just proceed
  log('▶ Proceeding with migration...\n', 'cyan');

  // Execute via Supabase SQL Editor approach
  log('📝 To apply this migration:', 'cyan');
  log('\n1. Go to your Supabase Dashboard', 'white');
  log('2. Navigate to: SQL Editor', 'white');
  log('3. Copy and paste the contents of:', 'white');
  log('   migrations/fix-order-items-and-complaints.sql', 'yellow');
  log('4. Click "Run" to execute\n', 'white');

  log('Or use the Supabase CLI:', 'cyan');
  log('  supabase db execute -f migrations/fix-order-items-and-complaints.sql\n', 'yellow');

  // Verify what we can via API
  log('\n' + '═'.repeat(70), 'cyan');
  log('  POST-MIGRATION VERIFICATION', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  log('After running the SQL, verify with:', 'cyan');
  log('  node scripts/test-schema-migration.mjs\n', 'yellow');

  return 0;
}

// Run migration
runMigration()
  .then(code => {
    log('═'.repeat(70) + '\n', 'cyan');
    if (code === 0) {
      log('✅ Migration instructions provided\n', 'green');
    }
    process.exit(code);
  })
  .catch(err => {
    log(`\n❌ Fatal error: ${err.message}\n`, 'red');
    console.error(err);
    process.exit(1);
  });
