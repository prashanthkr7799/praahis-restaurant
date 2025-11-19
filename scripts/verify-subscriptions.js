#!/usr/bin/env node
/* eslint-disable */

/**
 * Verify Subscriptions Status
 * Shows detailed subscription info for all restaurants
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n📊 Subscription Status Report\n');
console.log('='.repeat(80));

async function showDetailedStatus() {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      slug,
      max_tables,
      subscriptions:subscriptions(
        id,
        plan_name,
        status,
        price,
        price_per_table,
        billing_cycle,
        current_period_start,
        current_period_end,
        created_at
      )
    `)
    .order('name');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`\n📈 Found ${restaurants.length} restaurants\n`);

  restaurants.forEach((r, index) => {
    const sub = r.subscriptions?.[0];
    
    console.log(`\n${index + 1}. 🏢 ${r.name}`);
    console.log('   ' + '─'.repeat(70));
    console.log(`   Slug: ${r.slug}`);
    console.log(`   Max Tables: ${r.max_tables}`);
    
    if (sub) {
      const daysRemaining = Math.ceil((new Date(sub.current_period_end) - new Date()) / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;
      const statusIcon = sub.status === 'active' ? '✅' : sub.status === 'trial' ? '🔶' : '❌';
      
      console.log(`\n   ${statusIcon} Subscription Details:`);
      console.log(`      • Plan Name: ${sub.plan_name}`);
      console.log(`      • Status: ${sub.status.toUpperCase()}`);
      console.log(`      • Price: ₹${sub.price?.toLocaleString() || 'N/A'}/${sub.billing_cycle}`);
      if (sub.price_per_table) {
        console.log(`      • Per Table: ₹${sub.price_per_table}/day`);
      }
      console.log(`      • Started: ${new Date(sub.current_period_start).toLocaleDateString()}`);
      console.log(`      • Expires: ${new Date(sub.current_period_end).toLocaleDateString()}`);
      console.log(`      • Days Remaining: ${isExpired ? '⚠️  EXPIRED' : `${daysRemaining} days`}`);
      console.log(`      • Created: ${new Date(sub.created_at).toLocaleDateString()}`);
    } else {
      console.log(`\n   ❌ NO SUBSCRIPTION FOUND!`);
    }
  });

  console.log('\n' + '='.repeat(80));
  
  // Summary
  const withSubs = restaurants.filter(r => r.subscriptions?.length > 0).length;
  const withoutSubs = restaurants.length - withSubs;
  const active = restaurants.filter(r => r.subscriptions?.[0]?.status === 'active').length;
  const trial = restaurants.filter(r => r.subscriptions?.[0]?.status === 'trial').length;
  const expired = restaurants.filter(r => {
    const sub = r.subscriptions?.[0];
    if (!sub) return false;
    return new Date(sub.current_period_end) < new Date();
  }).length;

  console.log('\n📊 Summary:');
  console.log(`   • Total Restaurants: ${restaurants.length}`);
  console.log(`   • With Subscriptions: ${withSubs} ✅`);
  console.log(`   • Without Subscriptions: ${withoutSubs} ${withoutSubs > 0 ? '❌' : '✅'}`);
  console.log(`   • Active: ${active} 🟢`);
  console.log(`   • Trial: ${trial} 🔶`);
  console.log(`   • Expired: ${expired} ${expired > 0 ? '⚠️' : '✅'}`);
  
  console.log('\n');
}

showDetailedStatus();
