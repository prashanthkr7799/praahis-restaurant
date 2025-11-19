#!/usr/bin/env node
/* eslint-env node */
/* global process */
import dotenv from 'dotenv';
import fs from 'fs';
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[verify] Missing env: VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    const { data: users, error: uerr } = await supabase.auth.admin.listUsers();
    if (uerr) throw uerr;
    console.log(`[verify] Connected to: ${SUPABASE_URL}`);
    console.log(`[verify] Users count: ${users?.users?.length ?? 0}`);

    const { data: tables, error: terr } = await supabase.from('restaurants').select('id, slug, is_active').limit(5);
    if (terr) throw terr;
    console.log(`[verify] Sample restaurants:`, tables || []);

    process.exit(0);
  } catch (e) {
    console.error('[verify] Failed:', e.message || e);
    process.exit(2);
  }
})();
