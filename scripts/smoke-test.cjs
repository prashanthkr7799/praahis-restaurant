#!/usr/bin/env node

/**
 * Automated Smoke Test for Praahis Platform
 * 
 * Verifies that critical files exist and basic configuration is correct.
 * This doesn't replace manual browser testing but catches obvious issues.
 * 
 * Run: node scripts/smoke-test.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

function checkFile(filePath, description) {
  const fullPath = path.join(ROOT, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`  ✓ ${description}`, colors.green);
    return true;
  } else {
    log(`  ✗ ${description}`, colors.red);
    return false;
  }
}

function checkContent(filePath, searchString, description) {
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
    return false;
  }
}

function runTests() {
  log('\n' + '='.repeat(60), colors.bold);
  log('Praahis Platform - Smoke Test', colors.cyan + colors.bold);
  log('='.repeat(60) + '\n', colors.bold);

  let total = 0;
  let passed = 0;

  // Test 1: Core Files
  log('1. Core Application Files:', colors.blue + colors.bold);
  total++; if (checkFile('src/main.jsx', 'main.jsx exists')) passed++;
  total++; if (checkFile('src/App.jsx', 'App.jsx exists')) passed++;
  total++; if (checkFile('index.html', 'index.html exists')) passed++;
  total++; if (checkFile('package.json', 'package.json exists')) passed++;
  total++; if (checkFile('vite.config.js', 'vite.config.js exists')) passed++;
  console.log();

  // Test 2: Auth Error Handler
  log('2. Authentication Error Handler:', colors.blue + colors.bold);
  total++; if (checkFile('src/shared/utils/helpers/authErrorHandler.js', 'authErrorHandler.js exists')) passed++;
  total++; if (checkContent('src/main.jsx', 'initAuthErrorHandling', 'initAuthErrorHandling imported in main.jsx')) passed++;
  total++; if (checkContent('src/shared/utils/api/supabaseClient.js', 'handleAuthError', 'handleAuthError imported in supabaseClient')) passed++;
  console.log();

  // Test 3: Password Reset Pages
  log('3. Password Reset Implementation:', colors.blue + colors.bold);
  total++; if (checkFile('src/pages/auth/ForgotPassword.jsx', 'ForgotPassword page exists')) passed++;
  total++; if (checkFile('src/pages/auth/ResetPassword.jsx', 'ResetPassword page exists')) passed++;
  total++; if (checkContent('src/App.jsx', 'forgot-password', 'ForgotPassword route in App.jsx')) passed++;
  total++; if (checkContent('src/App.jsx', 'reset-password', 'ResetPassword route in App.jsx')) passed++;
  console.log();

  // Test 4: Forgot Password Links
  log('4. Forgot Password Links:', colors.blue + colors.bold);
  total++; if (checkContent('src/pages/auth/UnifiedLogin.jsx', 'forgot-password', 'UnifiedLogin has link')) passed++;
  total++; if (checkContent('src/pages/waiter/WaiterLogin.jsx', 'forgot-password', 'WaiterLogin has link')) passed++;
  total++; if (checkContent('src/pages/chef/ChefLogin.jsx', 'forgot-password', 'ChefLogin has link')) passed++;
  console.log();

  // Test 5: No Legacy References
  log('5. Legacy Reference Cleanup:', colors.blue + colors.bold);
  const hasLegacy = checkContent('src/shared/contexts/RestaurantContext.jsx', 'mealmate', 'No mealmate references');
  total++;
  if (!hasLegacy) {
    log(`  ✓ No mealmate references found`, colors.green);
    passed++;
  }
  console.log();

  // Test 6: Environment Variables
  log('6. Environment Configuration:', colors.blue + colors.bold);
  const envExample = checkFile('.env.example', '.env.example exists (template)');
  total++; if (envExample) passed++;
  console.log();

  // Test 7: Documentation
  log('7. Documentation Files:', colors.blue + colors.bold);
  total++; if (checkFile('README.md', 'README.md exists')) passed++;
  total++; if (checkFile('PASSWORD_RESET_TESTING_GUIDE.md', 'Password reset testing guide exists')) passed++;
  total++; if (checkFile('AUTH_ERROR_FIXES.md', 'Auth error fixes doc exists')) passed++;
  total++; if (checkFile('LIVE_TESTING_SESSION.md', 'Live testing session doc exists')) passed++;
  console.log();

  // Test 8: Scripts
  log('8. Utility Scripts:', colors.blue + colors.bold);
  total++; if (checkFile('scripts/cleanup-console-logs.cjs', 'Console cleanup script exists')) passed++;
  total++; if (checkFile('scripts/cleanup-legacy-references.cjs', 'Legacy cleanup script exists')) passed++;
  total++; if (checkFile('scripts/verify-password-reset.cjs', 'Password reset verification script exists')) passed++;
  console.log();

  // Summary
  log('='.repeat(60), colors.bold);
  log('Test Summary:', colors.cyan + colors.bold);
  log('='.repeat(60), colors.bold);
  
  const percentage = Math.round((passed / total) * 100);
  const status = percentage >= 90 ? '✓ EXCELLENT' : percentage >= 70 ? '⚠ GOOD' : '✗ NEEDS ATTENTION';
  const statusColor = percentage >= 90 ? colors.green : percentage >= 70 ? colors.yellow : colors.red;
  
  log(`\nTotal Tests: ${total}`, colors.blue);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${total - passed}`, colors.red);
  log(`Success Rate: ${percentage}%`, colors.cyan);
  log(`\n${status}`, statusColor + colors.bold);
  
  if (percentage >= 90) {
    log('\n✓ Core functionality appears intact!', colors.green + colors.bold);
    log('✓ Ready for manual browser testing', colors.green);
    log('\nNext steps:', colors.cyan);
    log('  1. Open http://localhost:5174/ in browser', colors.reset);
    log('  2. Check console for auth initialization', colors.reset);
    log('  3. Test password reset flow', colors.reset);
    log('  4. Follow LIVE_TESTING_SESSION.md', colors.reset);
  } else if (percentage >= 70) {
    log('\n⚠ Most tests passed, but some issues detected', colors.yellow + colors.bold);
    log('⚠ Review failures above before testing', colors.yellow);
  } else {
    log('\n✗ Multiple critical issues detected', colors.red + colors.bold);
    log('✗ Fix failures before manual testing', colors.red);
  }
  
  console.log();
  
  return percentage >= 90 ? 0 : 1;
}

// Run tests
const exitCode = runTests();
process.exit(exitCode);
