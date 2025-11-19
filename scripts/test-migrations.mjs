#!/usr/bin/env node
/**
 * Test migration runner for phase3_migrations/12,13,14
 * Reads .env.local and executes SQL files in order to verify syntax and constraints.
 * 
 * Usage:
 *   node scripts/test-migrations.mjs
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
  } catch (err) {
    console.error('Failed to load .env.local:', err.message);
  }
}

loadEnv();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Missing DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const migrations = [
  '01_core_schema.sql',
  '02_billing_subscription_v80.sql',
  '03_billing_price_per_table_extension.sql',
  '04_billing_cron_jobs.sql',
  '05_platform_admin_and_roles.sql',
  '06_audit_logging_system.sql',
  '07_maintenance_and_backup_system.sql',
  '08_table_sessions_and_auth.sql',
  '09_notifications.sql',
  '10_ratings_and_views.sql',
  '11_rls_functions.sql',
  '12_rls_policies.sql',
  '13_indexes.sql',
  '14_seed_initial_data.sql',
  '15_compatibility_views.sql',
  '16_auto_enable_payments.sql',
];

async function runMigration(client, filename) {
  const path = join(__dirname, '..', 'phase3_migrations', filename);
  console.log(`\n📄 Running ${filename}...`);
  try {
    const sql = readFileSync(path, 'utf-8');
    await client.query(sql);
    console.log(`✅ ${filename} executed successfully`);
    return { file: filename, success: true };
  } catch (err) {
    console.error(`❌ ${filename} failed:`, err.message);
    return { file: filename, success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Testing All Phase 3 Migrations (01-16)...\n');
  console.log(`📡 Connecting to: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const results = [];
    for (const file of migrations) {
      const result = await runMigration(client, file);
      results.push(result);
    }

    console.log('\n📊 Migration Test Summary:');
    console.log('═'.repeat(50));
    results.forEach(r => {
      const status = r.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${r.file}`);
      if (!r.success) console.log(`   Error: ${r.error}`);
    });
    console.log('═'.repeat(50));

    const allPassed = results.every(r => r.success);
    if (allPassed) {
      console.log('\n🎉 All migrations executed successfully!');
      console.log('\nNext steps:');
      console.log('1. Verify in Supabase SQL Editor:');
      console.log("   SELECT * FROM public.restaurants WHERE slug='taj';");
      console.log('2. Test QR code URL in mobile browser');
      console.log('3. If changes need to be reverted, run migrations in reverse or restore from backup');
    } else {
      console.log('\n⚠️  Some migrations failed. Review errors above.');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
