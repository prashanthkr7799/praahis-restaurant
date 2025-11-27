#!/usr/bin/env node

/**
 * Regenerate QR Codes for All Tables
 * 
 * This script updates all existing tables to have QR codes with the correct URL pattern.
 * Old pattern: /menu/:restaurantId?table=:tableNumber (doesn't work)
 * New pattern: /table/:tableId (correct)
 */

import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use production URL or fallback to localhost
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

async function regenerateQRCodes() {
  console.log('🔄 Starting QR code regeneration for all tables...\n');

  try {
    // Fetch all tables
    const { data: tables, error: fetchError } = await supabase
      .from('tables')
      .select('id, table_number, restaurant_id, qr_code_url')
      .order('table_number');

    if (fetchError) {
      throw new Error(`Failed to fetch tables: ${fetchError.message}`);
    }

    if (!tables || tables.length === 0) {
      console.log('ℹ️  No tables found in the database.');
      return;
    }

    console.log(`📊 Found ${tables.length} tables to update\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const table of tables) {
      try {
        // Generate new QR code with correct URL pattern
        const menuUrl = `${BASE_URL}/table/${table.id}`;
        const qrCodeData = await QRCode.toDataURL(menuUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        // Update table with new QR code
        const { error: updateError } = await supabase
          .from('tables')
          .update({ qr_code_url: qrCodeData })
          .eq('id', table.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log(`✅ Table #${table.table_number} (ID: ${table.id.substring(0, 8)}...) - QR code updated`);
        console.log(`   URL: ${menuUrl}`);
        updated++;
      } catch (err) {
        console.error(`❌ Table #${table.table_number} (ID: ${table.id.substring(0, 8)}...) - Failed: ${err.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✨ QR code regeneration completed successfully!');
      console.log('💡 All tables now have QR codes pointing to: /table/:tableId');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
regenerateQRCodes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
