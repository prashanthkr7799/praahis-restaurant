#!/usr/bin/env node
/**
 * Verify critical RLS policies after migration
 * Specifically checks public restaurant access and Taj restaurant visibility
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

async function main() {
  console.log('🔍 Verifying RLS Policies & Taj Restaurant Access\n');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Count all policies
    console.log('📊 Policy Statistics:');
    console.log('═'.repeat(60));
    const { rows: countRows } = await client.query(`
      SELECT COUNT(*) as total FROM pg_policies WHERE schemaname='public'
    `);
    console.log(`Total RLS policies: ${countRows[0].total}`);

    // 2. Check critical restaurant policies
    console.log('\n🔐 Restaurant Table Policies:');
    console.log('═'.repeat(60));
    const { rows: restPolicies } = await client.query(`
      SELECT policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE schemaname='public' AND tablename='restaurants'
      ORDER BY policyname
    `);
    
    if (restPolicies.length === 0) {
      console.log('⚠️  No policies found for restaurants table!');
    } else {
      restPolicies.forEach(p => {
        const rolesStr = Array.isArray(p.roles) ? p.roles.join(', ') : String(p.roles);
        const icon = rolesStr.includes('anon') ? '🌐' : '🔒';
        console.log(`${icon} ${p.policyname}`);
        console.log(`   Roles: ${rolesStr}`);
        console.log(`   Type: ${p.cmd}`);
      });
    }

    // 3. Check for the critical public_select policy
    console.log('\n✨ Critical Policy Check:');
    console.log('═'.repeat(60));
    const publicSelectExists = restPolicies.some(p => 
      p.policyname === 'public_restaurants_public_select'
    );
    if (publicSelectExists) {
      console.log('✅ public_restaurants_public_select policy FOUND');
      console.log('   → Anonymous QR lookups are ENABLED');
    } else {
      console.log('❌ public_restaurants_public_select policy MISSING');
      console.log('   → QR code lookups will FAIL for unauthenticated users');
    }

    // 4. Check Taj restaurant exists
    console.log('\n🏢 Taj Restaurant Check:');
    console.log('═'.repeat(60));
    const { rows: tajRows } = await client.query(`
      SELECT id, name, slug, is_active, created_at 
      FROM public.restaurants 
      WHERE slug = 'taj'
    `);
    
    if (tajRows.length === 0) {
      console.log('❌ Taj restaurant NOT FOUND');
      console.log('   → QR codes with ?restaurant=taj will fail');
    } else {
      const taj = tajRows[0];
      console.log(`✅ Taj Restaurant EXISTS`);
      console.log(`   ID: ${taj.id}`);
      console.log(`   Name: ${taj.name}`);
      console.log(`   Slug: ${taj.slug}`);
      console.log(`   Active: ${taj.is_active ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${taj.created_at}`);
    }

    // 5. Test anon access simulation (via same connection, but we can check the policy logic)
    console.log('\n🧪 Testing Anonymous Access Logic:');
    console.log('═'.repeat(60));
    
    // Check if there are any active restaurants (what anon would see)
    const { rows: activeRests } = await client.query(`
      SELECT slug, name, is_active 
      FROM public.restaurants 
      WHERE is_active = true
      ORDER BY slug
    `);
    
    console.log(`Active restaurants visible: ${activeRests.length}`);
    activeRests.forEach(r => {
      console.log(`  - ${r.slug} (${r.name})`);
    });

    // 6. Check indexes on slug
    console.log('\n📇 Slug Indexes:');
    console.log('═'.repeat(60));
    const { rows: indexes } = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname='public' 
        AND tablename='restaurants' 
        AND indexname LIKE '%slug%'
    `);
    
    indexes.forEach(idx => {
      console.log(`✅ ${idx.indexname}`);
      console.log(`   ${idx.indexdef}`);
    });

    // Final verdict
    console.log('\n🎯 Final Verdict:');
    console.log('═'.repeat(60));
    
    const allGood = publicSelectExists && 
                    tajRows.length > 0 && 
                    tajRows[0].is_active;
    
    if (allGood) {
      console.log('✅ ALL CHECKS PASSED');
      console.log('\n🎉 Your QR codes should work now!');
      console.log('\nTest URL format:');
      console.log('  https://your-domain.vercel.app/table/1?restaurant=taj');
      console.log('\nWhat happens when scanned:');
      console.log('  1. Mobile browser opens URL');
      console.log('  2. RestaurantContext reads ?restaurant=taj');
      console.log('  3. Calls: SELECT * FROM restaurants WHERE slug ILIKE \'taj\' AND is_active=true');
      console.log('  4. RLS policy public_restaurants_public_select allows anon read');
      console.log('  5. Returns Taj restaurant data');
      console.log('  6. Customer sees menu and can order');
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
      if (!publicSelectExists) {
        console.log('   - Add public SELECT policy for restaurants');
      }
      if (tajRows.length === 0) {
        console.log('   - Create Taj restaurant record');
      }
      if (tajRows.length > 0 && !tajRows[0].is_active) {
        console.log('   - Activate Taj restaurant (is_active=true)');
      }
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed\n');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
