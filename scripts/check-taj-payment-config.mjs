#!/usr/bin/env node
/**
 * Check Taj restaurant payment configuration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) return;
      const key = m[1];
      let value = m[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {}
}

loadEnv();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function main() {
  console.log('🔍 Checking Taj Restaurant Payment Configuration\n');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();

    const { rows } = await client.query(`
      SELECT 
        id,
        name,
        slug,
        payment_gateway_enabled,
        razorpay_key_id,
        razorpay_key_secret,
        payment_settings
      FROM public.restaurants 
      WHERE slug = 'taj'
    `);

    if (rows.length === 0) {
      console.log('❌ Taj restaurant not found');
      process.exit(1);
    }

    const taj = rows[0];
    console.log('🏢 Restaurant Details:');
    console.log('═'.repeat(60));
    console.log(`Name: ${taj.name}`);
    console.log(`Slug: ${taj.slug}`);
    console.log(`ID: ${taj.id}`);
    console.log(`\n💳 Payment Configuration:`);
    console.log('═'.repeat(60));
    console.log(`Payment Gateway Enabled: ${taj.payment_gateway_enabled ? '✅ YES' : '❌ NO'}`);
    console.log(`Top-level Razorpay Key ID: ${taj.razorpay_key_id || '❌ NOT SET'}`);
    console.log(`Top-level Razorpay Secret: ${taj.razorpay_key_secret ? '✅ SET (hidden)' : '❌ NOT SET'}`);
    
    console.log(`\nPayment Settings JSONB:`);
    if (taj.payment_settings && typeof taj.payment_settings === 'object') {
      const ps = taj.payment_settings;
      console.log(`  razorpay_key_id: ${ps.razorpay_key_id || '❌ NOT SET'}`);
      console.log(`  razorpay_key_secret: ${ps.razorpay_key_secret ? '✅ SET (hidden)' : '❌ NOT SET'}`);
      console.log(`  razorpay_webhook_secret: ${ps.razorpay_webhook_secret ? '✅ SET (hidden)' : '❌ NOT SET'}`);
      console.log(`  currency: ${ps.currency || 'INR (default)'}`);
      console.log(`  accepted_methods: ${ps.accepted_methods?.join(', ') || 'card, netbanking, wallet, upi (default)'}`);
    } else {
      console.log('  ❌ Empty or null');
    }

    console.log(`\n🔑 Fallback Environment Key:`);
    console.log('═'.repeat(60));
    const fallbackKey = process.env.VITE_RAZORPAY_KEY_ID;
    console.log(`VITE_RAZORPAY_KEY_ID: ${fallbackKey || '❌ NOT SET'}`);

    console.log(`\n📊 Payment Flow Status:`);
    console.log('═'.repeat(60));
    
    const hasDirectKey = taj.razorpay_key_id || taj.payment_settings?.razorpay_key_id;
    const hasFallback = !!fallbackKey;
    
    if (hasDirectKey) {
      console.log('✅ READY: Restaurant has own Razorpay credentials');
    } else if (taj.payment_gateway_enabled && hasFallback) {
      console.log('⚠️  FALLBACK MODE: Using platform key (VITE_RAZORPAY_KEY_ID)');
      console.log('   → Works for demo/test, but restaurant should add their own keys');
    } else if (!taj.payment_gateway_enabled && hasFallback) {
      console.log('⚠️  FALLBACK AVAILABLE: Gateway disabled but platform key exists');
      console.log('   → Will use fallback key despite gateway_enabled=false');
    } else {
      console.log('❌ BLOCKED: No credentials available');
      console.log('   → Customers will see "Payment gateway not enabled" error');
      console.log('\n💡 Fix options:');
      console.log('   1. Add VITE_RAZORPAY_KEY_ID to .env.local and Vercel');
      console.log('   2. Set restaurant Razorpay credentials via Manager dashboard');
      console.log('   3. Enable payment_gateway_enabled flag');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
