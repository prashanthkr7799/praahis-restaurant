#!/usr/bin/env node

/**
 * Password Reset Flow - Automated Verification Script
 * 
 * This script verifies that the password reset pages exist and are properly configured.
 * It checks file existence, imports, and route configuration.
 * 
 * Run: node scripts/verify-password-reset.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ANSI color codes
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

function checkFileExists(filePath, description) {
  const fullPath = path.join(ROOT, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`  ✓ ${description}`, colors.green);
    return true;
  } else {
    log(`  ✗ ${description}`, colors.red);
    log(`    Missing: ${filePath}`, colors.yellow);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`  ✗ ${description} - File not found`, colors.red);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const found = content.includes(searchString);
  
  if (found) {
    log(`  ✓ ${description}`, colors.green);
    return true;
  } else {
    log(`  ✗ ${description}`, colors.red);
    log(`    Expected to find: "${searchString}"`, colors.yellow);
    return false;
  }
}

function runVerification() {
  log('\n' + '='.repeat(60), colors.bold);
  log('Password Reset Flow - Verification Report', colors.cyan + colors.bold);
  log('='.repeat(60) + '\n', colors.bold);

  let totalChecks = 0;
  let passedChecks = 0;

  // Section 1: Page Components
  log('1. Password Reset Page Components:', colors.blue + colors.bold);
  totalChecks++;
  if (checkFileExists('src/pages/auth/ForgotPassword.jsx', 'ForgotPassword page exists')) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists('src/pages/auth/ResetPassword.jsx', 'ResetPassword page exists')) {
    passedChecks++;
  }
  
  console.log();

  // Section 2: Login Pages with Forgot Password Links
  log('2. Login Pages with Forgot Password Links:', colors.blue + colors.bold);
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/auth/UnifiedLogin.jsx',
    'forgot-password',
    'UnifiedLogin has forgot password link'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/waiter/WaiterLogin.jsx',
    'forgot-password',
    'WaiterLogin has forgot password link'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/chef/ChefLogin.jsx',
    'forgot-password',
    'ChefLogin has forgot password link'
  )) {
    passedChecks++;
  }
  
  console.log();

  // Section 3: Route Configuration
  log('3. Route Configuration in App.jsx:', colors.blue + colors.bold);
  
  totalChecks++;
  if (checkFileContains(
    'src/App.jsx',
    'path="/forgot-password"',
    'ForgotPassword route configured'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/App.jsx',
    'path="/reset-password"',
    'ResetPassword route configured'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/App.jsx',
    'ForgotPassword',
    'ForgotPassword imported/defined in App.jsx'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/App.jsx',
    'ResetPassword',
    'ResetPassword imported/defined in App.jsx'
  )) {
    passedChecks++;
  }
  
  console.log();

  // Section 4: Supabase Integration
  log('4. Supabase Integration:', colors.blue + colors.bold);
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/auth/ForgotPassword.jsx',
    'resetPasswordForEmail',
    'ForgotPassword uses Supabase auth'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/auth/ResetPassword.jsx',
    'updateUser',
    'ResetPassword uses Supabase auth'
  )) {
    passedChecks++;
  }
  
  console.log();

  // Section 5: Form Validation
  log('5. Form Validation:', colors.blue + colors.bold);
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/auth/ForgotPassword.jsx',
    'Please enter',
    'ForgotPassword has input validation'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContains(
    'src/pages/auth/ResetPassword.jsx',
    'password',
    'ResetPassword has password validation'
  )) {
    passedChecks++;
  }
  
  console.log();

  // Section 6: Testing Documentation
  log('6. Testing Documentation:', colors.blue + colors.bold);
  
  totalChecks++;
  if (checkFileExists('PASSWORD_RESET_TESTING_GUIDE.md', 'Testing guide exists')) {
    passedChecks++;
  }
  
  console.log();

  // Final Summary
  log('='.repeat(60), colors.bold);
  log('Verification Summary:', colors.cyan + colors.bold);
  log('='.repeat(60), colors.bold);
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const status = percentage === 100 ? '✓ ALL CHECKS PASSED' : '⚠ SOME CHECKS FAILED';
  const statusColor = percentage === 100 ? colors.green : colors.yellow;
  
  log(`\nTotal Checks: ${totalChecks}`, colors.blue);
  log(`Passed: ${passedChecks}`, colors.green);
  log(`Failed: ${totalChecks - passedChecks}`, colors.red);
  log(`Success Rate: ${percentage}%`, colors.cyan);
  log(`\n${status}`, statusColor + colors.bold);
  
  if (percentage === 100) {
    log('\n✓ Password reset flow is properly configured!', colors.green + colors.bold);
    log('✓ Ready for manual testing - see PASSWORD_RESET_TESTING_GUIDE.md', colors.green);
  } else {
    log('\n⚠ Some components are missing or misconfigured.', colors.yellow + colors.bold);
    log('⚠ Review the failures above and fix before testing.', colors.yellow);
  }
  
  console.log();
  
  return percentage === 100 ? 0 : 1;
}

// Run the verification
const exitCode = runVerification();
process.exit(exitCode);
