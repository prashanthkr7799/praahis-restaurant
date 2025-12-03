/**
 * Authentication Setup for E2E Tests
 * Creates authenticated state for other tests to use
 *
 * IMPORTANT: Set these environment variables before running E2E tests:
 * - TEST_USER_EMAIL: Email of a test user in your Supabase database
 * - TEST_USER_PASSWORD: Password for the test user
 *
 * Example:
 *   TEST_USER_EMAIL=manager@test.com TEST_USER_PASSWORD=test123 npm run test:e2e
 */
/* eslint-env node */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Get test credentials from environment variables
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  // Check if credentials are provided
  if (!testEmail || !testPassword) {
    console.warn('⚠️ TEST_USER_EMAIL or TEST_USER_PASSWORD not set.');
    console.warn('⚠️ E2E tests requiring authentication will be skipped.');
    console.warn(
      '⚠️ Set environment variables: TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpassword'
    );

    // Create empty auth state so tests can still run (but will redirect to login)
    await page.goto('/');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Navigate to staff login page
  await page.goto('/login');

  // Wait for page to load completely
  await page.waitForLoadState('domcontentloaded');

  // Wait for any loading spinners to disappear
  await page.waitForTimeout(1000);

  // Wait for and fill email input
  await page.waitForSelector('#email', { timeout: 30000, state: 'visible' });
  await page.fill('#email', testEmail);

  // Fill password
  await page.fill('#password', testPassword);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page (to manager dashboard or other page)
  try {
    await page.waitForURL(/\/(manager|chef|waiter|superadmin)/, { timeout: 15000 });
    console.log('✅ Authentication successful');
  } catch {
    // Check if there's an error message
    const errorVisible = await page.locator('[role="alert"], .error-message').isVisible();
    if (errorVisible) {
      const errorText = await page.locator('[role="alert"], .error-message').textContent();
      console.error('❌ Login failed with error:', errorText);
    }
    console.error('❌ Authentication failed - check credentials');
    // Still save state so tests can run (they'll fail at the page level)
  }

  // Verify we're logged in (no longer on login page)
  await expect(page).not.toHaveURL(/\/login$/);

  // Save signed-in state to file for reuse in other tests
  await page.context().storageState({ path: authFile });
});
