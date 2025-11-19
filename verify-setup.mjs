#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) return;
      const key = m[1];
      let value = m[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
    console.log('🧩 Loaded environment from .env.local');
  } catch (e) {
    console.warn('⚠️  Could not load .env.local, relying on process env');
  }
}

loadEnv();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ No connection string found (DIRECT_URL/DATABASE_URL)');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const checks = {
  tables: `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public';`,
  functions: `SELECT COUNT(*)::int AS cnt FROM information_schema.routines WHERE routine_schema='public';`,
  policies: `SELECT COUNT(*)::int AS cnt FROM pg_policies WHERE schemaname='public';`,
  superadmin: `SELECT email, role, is_active FROM public.platform_admins WHERE email='superadmin@paacs.app';`,
  buckets: `SELECT id, public FROM storage.buckets WHERE id IN ('menu-images','restaurant-logos') ORDER BY id;`
};

async function main() {
  try {
    await client.connect();
    console.log('🔍 Verifying setup...');

    const results = {};
    for (const [name, sql] of Object.entries(checks)) {
      const res = await client.query(sql);
      results[name] = res.rows;
    }

    console.log('\n📊 Verification Summary');
    console.log('═'.repeat(60));
    console.table({
      tables: results.tables?.[0]?.cnt,
      functions: results.functions?.[0]?.cnt,
      policies: results.policies?.[0]?.cnt
    });

    console.log('\n👑 Superadmin row');
    console.table(results.superadmin);

    console.log('\n🗂️  Buckets');
    console.table(results.buckets);

  } catch (e) {
    console.error('❌ Verification failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
