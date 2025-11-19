#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getFirstTable() {
  const { data: tables, error } = await supabase
    .from('tables')
    .select('id, table_number, restaurant_id')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (tables && tables.length > 0) {
    const table = tables[0];
    
    // Get restaurant name separately
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', table.restaurant_id)
      .single();
    
    const url = `http://localhost:5173/table/${table.id}`;
    console.log('\n✅ Found table:');
    console.log(`   Restaurant: ${restaurant?.name || 'Unknown'}`);
    console.log(`   Table Number: ${table.table_number}`);
    console.log(`   Table ID: ${table.id}`);
    console.log(`\n🔗 Customer URL:`);
    console.log(`   ${url}\n`);
  } else {
    console.log('❌ No tables found in database');
  }
}

getFirstTable();
