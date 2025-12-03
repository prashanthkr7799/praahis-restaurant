/**
 * Authentication Setup for E2E Tests
 * Creates authenticated state for other tests to use
 */
/* eslint-env node */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to superadmin login page (test user is a superadmin)
  await page.goto('/superadmin-login');

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');

  // Fill in credentials (use test user from environment variables)
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

  // Wait for and fill email input
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', testEmail);

  // Fill password
  await page.fill('input[type="password"]', testPassword);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to superadmin dashboard
  await page.waitForURL(/\/superadmin/, { timeout: 30000 });

  // Verify we're logged in (no longer on login page)
  await expect(page).not.toHaveURL(/\/login/);

  // Additional check: verify dashboard loaded
  await page.waitForLoadState('networkidle');

  // Save signed-in state to file for reuse in other tests
  await page.context().storageState({ path: authFile });
});
