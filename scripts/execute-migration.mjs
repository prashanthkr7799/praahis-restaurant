#!/usr/bin/env node

/**
 * Direct Migration Executor
 * Applies the migration SQL directly to the database
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

// Use service role key for full permissions
const supabaseUrl = 'https://hpcwpkjbmcelptwwxicn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY3dwa2pibWNlbHB0d3d4aWNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ2Mjk5NiwiZXhwIjoyMDc5MDM4OTk2fQ.4wEI7A3DYEpn8B57WnU5s9zKVqXGOR8JKJpZm_kIZZI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('  MIGRATION EXECUTOR: Fix Order Items & Complaints', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  // Read migration SQL
  let sql;
  try {
    sql = readFileSync('./migrations/fix-order-items-and-complaints.sql', 'utf-8');
    log('✅ Migration SQL loaded\n', 'green');
  } catch (err) {
    log(`❌ Failed to read migration file: ${err.message}`, 'red');
    process.exit(1);
  }

  // Execute SQL using the rpc function or direct connection
  // Since Supabase JS client doesn't support raw SQL, we'll use fetch
  log('▶ Executing migration via Supabase API...\n', 'cyan');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    // This won't work as exec_sql isn't a standard function
    // Let's use a different approach - execute individual statements
    log('⚠️  Direct SQL execution not available via JS client', 'yellow');
    log('Using alternative method: Individual statement execution\n', 'cyan');

    // Execute key statements one by one
    await executeStatements();

  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    process.exit(1);
  }
}

async function executeStatements() {
  log('▶ Step 1: Create order_items table', 'cyan');
  
  // We'll use the supabase client to check and verify
  // For actual table creation, we need to guide user to SQL editor
  
  // Check if order_items exists
  const { data: orderItemsCheck, error: oiError } = await supabase
    .from('order_items')
    .select('id')
    .limit(1);

  if (oiError && oiError.message.includes('does not exist')) {
    log('  ⚠️  order_items table does not exist', 'yellow');
    log('  📋 Need to create it via SQL Editor\n', 'yellow');
  } else if (!oiError) {
    log('  ✅ order_items table already exists\n', 'green');
  }

  log('▶ Step 2: Check complaints.issue_type column', 'cyan');
  
  const { data: complaintsCheck, error: compError } = await supabase
    .from('complaints')
    .select('issue_type')
    .limit(1);

  if (compError && compError.message.includes('issue_type')) {
    log('  ⚠️  issue_type column does not exist', 'yellow');
    log('  📋 Need to add it via SQL Editor\n', 'yellow');
  } else if (!compError) {
    log('  ✅ issue_type column already exists\n', 'green');
  }

  // Manual execution required
  log('═'.repeat(70), 'cyan');
  log('  MANUAL EXECUTION REQUIRED', 'bright');
  log('═'.repeat(70) + '\n', 'cyan');

  log('The Supabase JS client cannot execute DDL statements (CREATE TABLE, ALTER TABLE).', 'yellow');
  log('\nPlease execute the migration manually:\n', 'cyan');
  
  log('1. Open Supabase SQL Editor:', 'white');
  log('   https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn/sql/new\n', 'cyan');
  
  log('2. Copy the contents of:', 'white');
  log('   migrations/fix-order-items-and-complaints.sql\n', 'cyan');
  
  log('3. Paste into the SQL Editor and click "Run"\n', 'white');
  
  log('4. After running, verify with:', 'white');
  log('   npm run test:schema\n', 'cyan');

  log('═'.repeat(70) + '\n', 'cyan');
}

executeMigration().catch(err => {
  log(`\n❌ Fatal error: ${err.message}\n`, 'red');
  process.exit(1);
});
