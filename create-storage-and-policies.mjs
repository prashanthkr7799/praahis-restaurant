#!/usr/bin/env node

/**
 * Creates Supabase Storage buckets and RLS policies via direct Postgres connection
 * Idempotent: safe to run multiple times
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

const SQL = `
-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images','menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-logos','restaurant-logos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Policies for menu-images
DROP POLICY IF EXISTS "Public view menu images" ON storage.objects;
CREATE POLICY "Public view menu images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated upload menu images" ON storage.objects;
CREATE POLICY "Authenticated upload menu images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated delete menu images" ON storage.objects;
CREATE POLICY "Authenticated delete menu images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-images');

-- Policies for restaurant-logos
DROP POLICY IF EXISTS "Public view restaurant logos" ON storage.objects;
CREATE POLICY "Public view restaurant logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'restaurant-logos');

DROP POLICY IF EXISTS "Authenticated upload restaurant logos" ON storage.objects;
CREATE POLICY "Authenticated upload restaurant logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

DROP POLICY IF EXISTS "Authenticated delete restaurant logos" ON storage.objects;
CREATE POLICY "Authenticated delete restaurant logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'restaurant-logos');
`;

async function main() {
  console.log('🚀 Creating storage buckets and policies');
  console.log('═'.repeat(60));
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('✅ Storage setup complete');
  } catch (e) {
    console.error('❌ Storage setup failed:', e.message);
    try { await client.query('ROLLBACK'); } catch {}
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

main();
