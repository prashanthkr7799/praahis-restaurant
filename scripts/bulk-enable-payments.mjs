#!/usr/bin/env node
/**
 * Bulk enable payment gateway for ALL restaurants
 * Run this once to ensure all existing restaurants can accept payments
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
  console.log('🔧 Bulk Enabling Payment Gateway for All Restaurants\n');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();

    // Get current state
    const { rows: beforeRows } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE payment_gateway_enabled = true) as enabled,
        COUNT(*) FILTER (WHERE payment_gateway_enabled = false OR payment_gateway_enabled IS NULL) as disabled
      FROM public.restaurants
    `);

    const before = beforeRows[0];
    console.log('📊 Current State:');
    console.log('═'.repeat(60));
    console.log(`Total restaurants: ${before.total}`);
    console.log(`Payment enabled: ${before.enabled}`);
    console.log(`Payment disabled: ${before.disabled}`);

    if (before.disabled === '0') {
      console.log('\n✅ All restaurants already have payments enabled!');
      console.log('Nothing to do.');
      process.exit(0);
    }

    console.log(`\n🔄 Enabling payments for ${before.disabled} restaurant(s)...`);

    // Update all restaurants
    const { rowCount } = await client.query(`
      UPDATE public.restaurants 
      SET payment_gateway_enabled = true 
      WHERE payment_gateway_enabled IS NULL OR payment_gateway_enabled = false
    `);

    console.log(`✅ Updated ${rowCount} restaurant(s)`);

    // Get updated state
    const { rows: afterRows } = await client.query(`
      SELECT slug, name, payment_gateway_enabled 
      FROM public.restaurants 
      ORDER BY created_at
    `);

    console.log('\n📋 All Restaurants Status:');
    console.log('═'.repeat(60));
    afterRows.forEach(r => {
      const status = r.payment_gateway_enabled ? '✅' : '❌';
      console.log(`${status} ${r.slug.padEnd(20)} - ${r.name}`);
    });

    console.log('\n🎉 Success! All restaurants can now accept payments.');
    console.log('\n💡 New restaurants will automatically have payments enabled via database trigger.');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
