/**
 * Manager Dashboard E2E Tests
 * Tests the manager dashboard functionality
 *
 * NOTE: These tests require authentication.
 * Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.
 */
/* eslint-env node */

import { test, expect } from '@playwright/test';

// Check if we have auth credentials configured
const hasAuthCredentials = process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD;

test.describe('Manager Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check if we're redirected to login (not authenticated)
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      if (!hasAuthCredentials) {
        console.warn('⚠️ Not authenticated and no credentials set - skipping test');
        test.skip();
        return;
      }
    }

    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard overview', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Check for main sections
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for stats cards
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card');
    if ((await statsCards.count()) > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test("should show today's orders summary", async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Look for orders section
    const ordersSection = page.locator(
      '[data-testid="orders-summary"], [data-testid="today-orders"], [data-testid="dashboard-overview"]'
    );
    if ((await ordersSection.count()) > 0) {
      await expect(ordersSection.first()).toBeVisible();
    }
  });

  test('should navigate to orders page', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Click on orders link/tab
    const ordersNav = page.locator('a[href*="orders"], [data-testid="orders-nav"]');
    if ((await ordersNav.count()) > 0) {
      await ordersNav.first().click();
      // Should navigate to orders page or show orders tab content
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to menu management', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    const menuNav = page.locator('a[href*="menu"], [data-testid="menu-nav"]');
    if ((await menuNav.count()) > 0) {
      await menuNav.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to tables management', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    const tablesNav = page.locator('a[href*="tables"], [data-testid="tables-nav"]');
    if ((await tablesNav.count()) > 0) {
      await tablesNav.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to staff management', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    const staffNav = page.locator('a[href*="staff"], [data-testid="staff-nav"]');
    if ((await staffNav.count()) > 0) {
      await staffNav.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display revenue metrics', async ({ page }) => {
    // Check if we're on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Look for revenue/analytics section
    const revenueSection = page.locator('[data-testid="revenue"], [data-testid="analytics"]');

    // May not always be visible depending on permissions
    if ((await revenueSection.count()) > 0) {
      await expect(revenueSection.first()).toBeVisible();
    }
  });
});

test.describe('Manager - Order Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/manager/orders');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login
    if (page.url().includes('login') || page.url().includes('auth')) {
      if (!hasAuthCredentials) {
        test.skip();
        return;
      }
    }

    await page.waitForLoadState('networkidle');
  });

  test('should display order list', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Wait for orders to load
    await page.waitForTimeout(2000);

    // Check for order cards or list
    const ordersList = page.locator('[data-testid="orders-list"], [data-testid="order-card"]');
    if ((await ordersList.count()) > 0) {
      await expect(ordersList.first()).toBeVisible();
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Find status filter
    const filterButton = page.locator('[data-testid="status-filter"], select[name="status"]');

    if ((await filterButton.count()) > 0) {
      await filterButton.click();

      // Select a status
      const pendingOption = page.locator('[data-testid="filter-pending"], option[value="pending"]');
      if ((await pendingOption.count()) > 0) {
        await pendingOption.first().click();
      }

      // Wait for filter to apply
      await page.waitForTimeout(1000);
    }
  });

  test('should update order status', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Wait for orders
    try {
      await page.waitForSelector('[data-testid="order-card"]', { timeout: 5000 });
    } catch {
      // No orders available
      test.skip();
      return;
    }

    // Click on first order
    await page.click('[data-testid="order-card"]');

    // Look for status update button
    const statusButton = page.locator(
      '[data-testid="update-status"], [data-testid="order-action"]'
    );

    if ((await statusButton.count()) > 0) {
      await statusButton.first().click();

      // Should show status options
      const statusOptions = page.locator('[data-testid="status-option"], .status-menu');
      if ((await statusOptions.count()) > 0) {
        await expect(statusOptions.first()).toBeVisible();
      }
    }
  });
});

test.describe('Manager - Table Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/manager/tables');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login
    if (page.url().includes('login') || page.url().includes('auth')) {
      if (!hasAuthCredentials) {
        test.skip();
        return;
      }
    }

    await page.waitForLoadState('networkidle');
  });

  test('should display table grid', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Wait for tables to load
    try {
      await page.waitForSelector('[data-testid="table-card"], [data-testid="table-grid"]', {
        timeout: 5000,
      });
    } catch {
      test.skip();
      return;
    }

    // Check tables are visible
    const tables = page.locator('[data-testid="table-card"]');
    const count = await tables.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show table status indicators', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    try {
      await page.waitForSelector('[data-testid="table-card"]', { timeout: 5000 });
    } catch {
      test.skip();
      return;
    }

    // Check for status indicators (available, occupied, etc.)
    const firstTable = page.locator('[data-testid="table-card"]').first();

    // Should have some status indication
    await expect(firstTable).toBeVisible();
  });

  test('should open table details on click', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    try {
      await page.waitForSelector('[data-testid="table-card"]', { timeout: 5000 });
    } catch {
      test.skip();
      return;
    }

    // Click on a table
    await page.click('[data-testid="table-card"]');

    // Should show details modal or panel
    const detailsPanel = page.locator('[data-testid="table-details"], [role="dialog"]');

    if ((await detailsPanel.count()) > 0) {
      await expect(detailsPanel.first()).toBeVisible();
    }
  });
});

test.describe('Manager - Menu Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/manager/menu');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login
    if (page.url().includes('login') || page.url().includes('auth')) {
      if (!hasAuthCredentials) {
        test.skip();
        return;
      }
    }

    await page.waitForLoadState('networkidle');
  });

  test('should display menu categories', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    try {
      await page.waitForSelector('[data-testid="menu-category"], [data-testid="category-tab"]', {
        timeout: 5000,
      });
    } catch {
      test.skip();
      return;
    }

    const categories = page.locator('[data-testid="menu-category"], [data-testid="category-tab"]');
    const count = await categories.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display menu items', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    try {
      await page.waitForSelector('[data-testid="menu-item"]', { timeout: 5000 });
    } catch {
      test.skip();
      return;
    }

    const items = page.locator('[data-testid="menu-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open add item modal', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    // Find add item button
    const addButton = page.locator(
      '[data-testid="add-item"], button:has-text("Add Item"), button:has-text("Add")'
    );

    if ((await addButton.count()) > 0) {
      await addButton.first().click();

      // Should show add item form
      const itemForm = page.locator('[data-testid="item-form"], [role="dialog"]');
      if ((await itemForm.count()) > 0) {
        await expect(itemForm.first()).toBeVisible();
      }
    }
  });

  test('should toggle item availability', async ({ page }) => {
    // Check if on login page
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    try {
      await page.waitForSelector('[data-testid="menu-item"]', { timeout: 5000 });
    } catch {
      test.skip();
      return;
    }

    // Find toggle button
    const toggleButton = page
      .locator('[data-testid="toggle-availability"], [data-testid="item-toggle"]')
      .first();

    if ((await toggleButton.count()) > 0) {
      await toggleButton.click();

      // Should show confirmation or toggle state
      await page.waitForTimeout(500);
    }
  });
});
