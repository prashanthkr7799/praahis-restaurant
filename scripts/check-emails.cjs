#!/usr/bin/env node

/**
 * Check Supabase User Emails
 * 
 * This script helps you view user emails configured in your Supabase project.
 * Note: This requires proper Supabase credentials in .env.local
 * 
 * Run: node scripts/check-emails.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n' + '='.repeat(60), colors.bold);
  log('Supabase Email Configuration Checker', colors.cyan + colors.bold);
  log('='.repeat(60) + '\n', colors.bold);

  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found!', colors.red + colors.bold);
    log('\nCreate .env.local with:', colors.yellow);
    log('VITE_SUPABASE_URL=https://your-project.supabase.co', colors.reset);
    log('VITE_SUPABASE_ANON_KEY=your-anon-key', colors.reset);
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  let supabaseUrl = null;
  let supabaseKey = null;
  
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]?.trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1]?.trim();
    }
  });

  log('📋 Environment Configuration:', colors.blue + colors.bold);
  
  if (supabaseUrl) {
    log(`  ✓ Supabase URL: ${supabaseUrl}`, colors.green);
  } else {
    log('  ✗ Supabase URL: NOT FOUND', colors.red);
  }
  
  if (supabaseKey) {
    const keyPreview = supabaseKey.substring(0, 20) + '...';
    log(`  ✓ Supabase Key: ${keyPreview}`, colors.green);
  } else {
    log('  ✗ Supabase Key: NOT FOUND', colors.red);
  }
  
  console.log();

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase configuration!', colors.red + colors.bold);
    return null;
  }

  return { supabaseUrl, supabaseKey };
}

function showEmailInfo(config) {
  if (!config) return;

  const projectId = config.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  log('🔗 Quick Links:', colors.blue + colors.bold);
  console.log();
  
  if (projectId) {
    log(`  Dashboard:`, colors.cyan);
    log(`  https://supabase.com/dashboard/project/${projectId}`, colors.reset);
    console.log();
    
    log(`  Users List:`, colors.cyan);
    log(`  https://supabase.com/dashboard/project/${projectId}/auth/users`, colors.reset);
    console.log();
    
    log(`  Email Templates:`, colors.cyan);
    log(`  https://supabase.com/dashboard/project/${projectId}/auth/templates`, colors.reset);
    console.log();
    
    log(`  SMTP Settings:`, colors.cyan);
    log(`  https://supabase.com/dashboard/project/${projectId}/settings/auth`, colors.reset);
    console.log();
    
    log(`  Auth Logs:`, colors.cyan);
    log(`  https://supabase.com/dashboard/project/${projectId}/logs/auth-logs`, colors.reset);
    console.log();
  }
  
  log('📧 To View User Emails:', colors.blue + colors.bold);
  console.log();
  log('  1. Go to Dashboard → Authentication → Users', colors.reset);
  log('  2. You\'ll see a table with all registered emails', colors.reset);
  log('  3. Check confirmation status and last sign-in', colors.reset);
  console.log();
  
  log('🧪 To Test Password Reset:', colors.blue + colors.bold);
  console.log();
  log('  1. Start your dev server: npm run dev', colors.reset);
  log('  2. Go to: http://localhost:5174/forgot-password', colors.reset);
  log('  3. Enter a registered email address', colors.reset);
  log('  4. Check your email inbox (and spam folder!)', colors.reset);
  console.log();
  
  log('📝 To Add a Test User:', colors.blue + colors.bold);
  console.log();
  log('  Via Dashboard:', colors.cyan);
  log('  1. Go to Authentication → Users', colors.reset);
  log('  2. Click "Add User"', colors.reset);
  log('  3. Enter email and password', colors.reset);
  log('  4. Click "Create User"', colors.reset);
  console.log();
  
  log('  Via SQL Editor:', colors.cyan);
  log('  Run this query:', colors.reset);
  console.log();
  log('  SELECT email FROM auth.users ORDER BY created_at DESC;', colors.yellow);
  console.log();
  
  log('💡 Pro Tips:', colors.blue + colors.bold);
  console.log();
  log('  • Use temp-mail.org for quick test emails', colors.reset);
  log('  • Check spam folder if email doesn\'t arrive', colors.reset);
  log('  • Supabase free tier has email rate limits', colors.reset);
  log('  • Password reset links expire in 1 hour', colors.reset);
  log('  • Custom SMTP recommended for production', colors.reset);
  console.log();
  
  log('🔍 Check Email Configuration:', colors.blue + colors.bold);
  console.log();
  log('  Dashboard → Project Settings → Authentication', colors.reset);
  log('  • Verify SMTP is configured', colors.reset);
  log('  • Check email templates are enabled', colors.reset);
  log('  • Ensure "Reset Password" template is active', colors.reset);
  console.log();
  
  log('📖 More Info:', colors.blue + colors.bold);
  console.log();
  log('  See: HOW_TO_CHECK_EMAILS.md', colors.cyan);
  log('  Supabase Docs: https://supabase.com/docs/guides/auth', colors.cyan);
  console.log();
}

function showCurrentEnvInfo() {
  log('📂 Project Files:', colors.blue + colors.bold);
  console.log();
  
  const files = [
    { path: '.env.local', desc: 'Local environment config' },
    { path: '.env.example', desc: 'Example environment template' },
    { path: 'src/pages/auth/ForgotPassword.jsx', desc: 'Password reset request page' },
    { path: 'src/pages/auth/ResetPassword.jsx', desc: 'New password entry page' },
    { path: 'HOW_TO_CHECK_EMAILS.md', desc: 'Email testing guide' },
  ];
  
  files.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file.path));
    const status = exists ? '✓' : '✗';
    const color = exists ? colors.green : colors.red;
    log(`  ${status} ${file.path}`, color);
    if (exists) {
      log(`    ${file.desc}`, colors.reset);
    }
  });
  
  console.log();
}

// Run the checker
const config = checkEnvFile();
showEmailInfo(config);
showCurrentEnvInfo();

log('='.repeat(60), colors.bold);
log('✅ Configuration check complete!', colors.green + colors.bold);
log('='.repeat(60) + '\n', colors.bold);
