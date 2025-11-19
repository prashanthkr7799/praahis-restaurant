#!/usr/bin/env node

// Creates a SuperAdmin/Owner account end-to-end:
// 1) Auth user (email/password, email confirmed)
// 2) public.users profile with id = auth.users.id (is_owner = true, role = 'owner')
// 3) public.platform_admins row with role = 'superadmin'
//
// Usage (zsh):
//   SUPERADMIN_EMAIL="you@example.com" SUPERADMIN_PASSWORD="StrongPass!123" node scripts/seed-superadmin.mjs
// If not provided, defaults to owner@praahis.app and generates a strong password.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  // Load .env.local manually (simple parser) so this can run without dotenv
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

function generatePassword(length = 16) {
  // At least one upper, one lower, one digit, one symbol
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const all = upper + lower + digits + symbols;
  const pick = (chars) => chars[Math.floor(crypto.randomInt(0, chars.length))];
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = pwd.length; i < length; i++) pwd += pick(all);
  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!connectionString) {
  console.error('Missing DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const DEFAULT_EMAIL = 'owner@praahis.app';
const DEFAULT_PASSWORD = generatePassword(18);

const EMAIL = process.env.SUPERADMIN_EMAIL || process.env.OWNER_EMAIL || DEFAULT_EMAIL;
const PASSWORD = process.env.SUPERADMIN_PASSWORD || process.env.OWNER_PASSWORD || DEFAULT_PASSWORD;
const FULL_NAME = process.env.SUPERADMIN_NAME || 'Platform Owner';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pgClient = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function getAuthUserByEmail(email) {
  // listUsers doesn't allow filtering, but DB is small. We'll fetch first 1000 and filter client-side.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
  return user || null;
}

async function ensureAuthUser(email, password) {
  const existing = await getAuthUserByEmail(email);
  if (existing) return { user: existing, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME, role: 'superadmin' }
  });
  if (error) {
    // If exists race condition, fallback to read
    const again = await getAuthUserByEmail(email);
    if (again) return { user: again, created: false };
    throw error;
  }
  return { user: data.user, created: true };
}

async function upsertPublicUsers(id, email, fullName) {
  // Insert or update profile with matching id
  const { error } = await supabase
    .from('users')
    .upsert({ id, email, full_name: fullName, name: fullName, role: 'owner', is_owner: true, is_active: true }, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertPlatformAdmin(userId, email, fullName) {
  const { error } = await supabase
    .from('platform_admins')
    .upsert({ user_id: userId, email, full_name: fullName, role: 'superadmin', is_active: true }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function verify(email) {
  await pgClient.connect();
  try {
    const q = `
      SELECT 
        au.id as auth_id,
        au.email,
        COALESCE(u.is_owner, false) as is_owner,
        u.role as user_role,
        pa.role as platform_role,
        pa.is_active as platform_active
      FROM auth.users au
      LEFT JOIN public.users u ON u.id = au.id
      LEFT JOIN public.platform_admins pa ON pa.user_id = au.id
      WHERE lower(au.email) = lower($1)
      LIMIT 1;
    `;
    const { rows } = await pgClient.query(q, [email]);
    return rows[0] || null;
  } finally {
    await pgClient.end();
  }
}

async function main() {
  console.log('--- Seeding SuperAdmin (Owner) ---');
  console.log(`Email: ${EMAIL}`);
  const createdPwd = PASSWORD === DEFAULT_PASSWORD ? PASSWORD : null;
  if (createdPwd) console.log(`Generated password: ${createdPwd}`);

  const { user, created } = await ensureAuthUser(EMAIL, PASSWORD);
  const userId = user.id;

  await upsertPublicUsers(userId, EMAIL, FULL_NAME);
  await upsertPlatformAdmin(userId, EMAIL, FULL_NAME);

  const v = await verify(EMAIL);
  if (!v) throw new Error('Verification failed');

  console.log('\nResult:');
  console.table([
    {
      email: v.email,
      auth_id: v.auth_id,
      users_role: v.user_role || '(none)',
      users_is_owner: !!v.is_owner,
      platform_role: v.platform_role || '(none)',
      platform_active: !!v.platform_active,
    }
  ]);

  console.log('\nNext:');
  console.log('  - Login at /superadmin-login');
  if (created) {
    console.log('  - The account was created now. If you prefer, change the password via Forgot Password.');
  } else {
    console.log('  - Account already existed; ensured owner + platform admin linkage.');
  }
  if (createdPwd) {
    console.log(`\nCredentials\n  Email: ${EMAIL}\n  Password: ${createdPwd}`);
  }
}

main().catch((err) => {
  console.error('Failed to seed superadmin:', err.message);
  process.exit(1);
});
