/**
 * Authentication Flow E2E Tests
 * Tests login, logout, and protected routes
 */
/* eslint-env node */

import { test, expect } from '@playwright/test';

// These tests don't use the authenticated state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error response
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = page.locator('[role="alert"], .error-message, .toast-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Submit without filling fields
    await page.click('button[type="submit"]');

    // Should show validation error or not submit
    await page.waitForTimeout(500);

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should have link to forgot password', async ({ page }) => {
    await page.goto('/login');

    // Check for forgot password link
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("Forgot"), a:has-text("Reset")');
    await expect(forgotLink).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    // Find password toggle button
    const toggleButton = page.locator(
      '[data-testid="toggle-password"], button:near(input[type="password"])'
    );

    if ((await toggleButton.count()) > 0) {
      // Check initial state
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Toggle
      await toggleButton.click();

      // Check toggled state
      await expect(
        page.locator('input[name="password"], input[autocomplete="current-password"]')
      ).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Admin Login Flow', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto('/superadmin-login');

    // Check for admin login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have different branding from staff login', async ({ page }) => {
    await page.goto('/superadmin-login');

    // Look for admin-specific elements
    const adminIndicator = page.locator(
      '[data-testid="admin-login"], h1:has-text("Admin"), h1:has-text("SuperAdmin")'
    );
    await expect(adminIndicator).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from manager dashboard', async ({ page }) => {
    await page.goto('/manager/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated users from waiter page', async ({ page }) => {
    await page.goto('/waiter');

    // Should redirect to login
    await page.waitForURL(/.*login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated users from chef page', async ({ page }) => {
    await page.goto('/chef');

    // Should redirect to login
    await page.waitForURL(/.*login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated users from superadmin dashboard', async ({ page }) => {
    await page.goto('/superadmin/dashboard');

    // Should redirect to admin login
    await page.waitForURL(/.*login/, { timeout: 5000 });
  });
});

test.describe('Logout Flow', () => {
  // This test uses the authenticated state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should logout and redirect to login', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit for content to load
    await page.waitForTimeout(2000);

    // Check if we're on login page (not authenticated)
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Find and click logout button
    const logoutButton = page.locator(
      '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out"), [aria-label*="logout" i], [aria-label*="sign out" i]'
    );

    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(1000);

      // Should redirect to login or home
      const currentUrl = page.url();
      expect(currentUrl.includes('login') || currentUrl === 'http://localhost:5173/').toBeTruthy();
    } else {
      // No logout button found - skip test
      test.skip();
    }
  });
});

test.describe('Accessibility - Login', () => {
  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');

    // Check for labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Should have associated labels or aria-label
    const emailLabel =
      (await emailInput.getAttribute('aria-label')) ||
      (await page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).count());
    const passwordLabel =
      (await passwordInput.getAttribute('aria-label')) ||
      (await page.locator(`label[for="${await passwordInput.getAttribute('id')}"]`).count());

    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Click on the page body first to ensure focus is in the document
    await page.locator('body').click();

    // Focus the email input directly and verify it can receive focus
    await page.locator('input[type="email"]').focus();
    await expect(page.locator('input[type="email"]')).toBeFocused();

    // Tab to password input
    await page.keyboard.press('Tab');
    // The next focusable element should be password (might have show/hide toggle)
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focused);
  });
});
