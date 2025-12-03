/**
 * Authentication Setup for E2E Tests
 * Creates authenticated state for other tests to use
 */
/* eslint-env node */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to staff login page (matches the actual route in App.jsx)
  await page.goto('/staff/login');

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');

  // Check if we're on a login page (could redirect to unified login)
  const currentUrl = page.url();
  if (!currentUrl.includes('login')) {
    await page.goto('/staff/login');
    await page.waitForLoadState('networkidle');
  }

  // Fill in credentials (use test user from environment variables)
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

  // Wait for and fill email input
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', testEmail);

  // Fill password
  await page.fill('input[type="password"]', testPassword);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to any dashboard (manager, waiter, chef, or superadmin)
  await page.waitForURL(/\/(manager|waiter|chef|superadmin)/, { timeout: 30000 });

  // Verify we're logged in (no longer on login page)
  await expect(page).not.toHaveURL(/\/login/);

  // Additional check: verify dashboard loaded
  await page.waitForLoadState('networkidle');

  // Save signed-in state to file for reuse in other tests
  await page.context().storageState({ path: authFile });
});
