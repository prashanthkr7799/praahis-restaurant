#!/usr/bin/env node
/**
 * Enable payment gateway for Taj restaurant
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
  console.log('🔧 Enabling payment gateway for Taj restaurant...\n');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();

    await client.query(`
      UPDATE public.restaurants 
      SET payment_gateway_enabled = true 
      WHERE slug = 'taj'
    `);

    const { rows } = await client.query(`
      SELECT id, name, slug, payment_gateway_enabled 
      FROM public.restaurants 
      WHERE slug='taj'
    `);

    console.log('✅ Successfully enabled payment gateway for Taj');
    console.log('\n📊 Current Status:');
    console.log('═'.repeat(60));
    console.log(`Name: ${rows[0].name}`);
    console.log(`Slug: ${rows[0].slug}`);
    console.log(`Payment Gateway: ${rows[0].payment_gateway_enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log('\n💡 Now customers can complete payments using the fallback Razorpay key');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
