#!/usr/bin/env node

/**
 * Run the owner_create_manager RPC migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://hpcwpkjbmcelptwwxicn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY3dwa2pibWNlbHB0d3d4aWNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ2Mjk5NiwiZXhwIjoyMDc5MDM4OTk2fQ.4wEI7A3DYEpn8B57WnU5s9zKVqXGOR8JKJpZm_kIZZI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running owner_create_manager RPC migration...\n');

  // Read the SQL file
  const sql = readFileSync('./migrations/owner_create_manager_rpc.sql', 'utf-8');
  
  try {
    // Execute SQL via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      }
    });

    // Since we can't run raw SQL via REST, we need to use the Supabase SQL API
    // Let's try the SQL endpoint
    const sqlResponse = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!sqlResponse.ok) {
      // If direct SQL doesn't work, show manual instructions
      console.log('⚠️  Direct SQL execution requires Supabase SQL Editor');
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn/sql');
      console.log('   2. Paste the contents of migrations/owner_create_manager_rpc.sql');
      console.log('   3. Click "Run"\n');
      
      // Try to verify if function already exists
      const { data, error } = await supabase.rpc('owner_create_manager', {
        p_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@test.com',
        p_full_name: 'Test',
        p_phone: null,
        p_restaurant_id: '00000000-0000-0000-0000-000000000000'
      });

      if (error?.message?.includes('function') || error?.code === '42883') {
        console.log('❌ Function does NOT exist yet. Please run the SQL manually.\n');
      } else if (error?.message?.includes('platform owners')) {
        console.log('✅ Function EXISTS and is working correctly!\n');
      } else {
        console.log('⚠️  Function status unclear. Error:', error?.message, '\n');
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();
