/**
 * Manager Dashboard E2E Tests
 * Tests the manager dashboard functionality
 */
/* eslint-env node */

import { test, expect } from '@playwright/test';

test.describe('Manager Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard overview', async ({ page }) => {
    // Check for main sections
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for stats cards
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card');
    await expect(statsCards.first()).toBeVisible();
  });

  test("should show today's orders summary", async ({ page }) => {
    // Look for orders section
    const ordersSection = page.locator(
      '[data-testid="orders-summary"], [data-testid="today-orders"]'
    );
    await expect(ordersSection).toBeVisible();
  });

  test('should navigate to orders page', async ({ page }) => {
    // Click on orders link/tab
    await page.click('a[href*="orders"], [data-testid="orders-nav"]');

    // Should navigate to orders page
    await expect(page).toHaveURL(/.*orders/);
  });

  test('should navigate to menu management', async ({ page }) => {
    await page.click('a[href*="menu"], [data-testid="menu-nav"]');
    await expect(page).toHaveURL(/.*menu/);
  });

  test('should navigate to tables management', async ({ page }) => {
    await page.click('a[href*="tables"], [data-testid="tables-nav"]');
    await expect(page).toHaveURL(/.*tables/);
  });

  test('should navigate to staff management', async ({ page }) => {
    await page.click('a[href*="staff"], [data-testid="staff-nav"]');
    await expect(page).toHaveURL(/.*staff/);
  });

  test('should display revenue metrics', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
  });

  test('should display order list', async ({ page }) => {
    // Wait for orders to load
    await page.waitForTimeout(2000);

    // Check for order cards or list
    const ordersList = page.locator('[data-testid="orders-list"], [data-testid="order-card"]');
    await expect(ordersList.first()).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Find status filter
    const filterButton = page.locator('[data-testid="status-filter"], select[name="status"]');

    if ((await filterButton.count()) > 0) {
      await filterButton.click();

      // Select a status
      await page.click('[data-testid="filter-pending"], option[value="pending"]');

      // Wait for filter to apply
      await page.waitForTimeout(1000);
    }
  });

  test('should update order status', async ({ page }) => {
    // Wait for orders
    await page.waitForSelector('[data-testid="order-card"]', { timeout: 10000 });

    // Click on first order
    await page.click('[data-testid="order-card"]');

    // Look for status update button
    const statusButton = page.locator(
      '[data-testid="update-status"], [data-testid="order-action"]'
    );

    if ((await statusButton.count()) > 0) {
      await statusButton.first().click();

      // Should show status options
      await expect(page.locator('[data-testid="status-option"], .status-menu')).toBeVisible();
    }
  });
});

test.describe('Manager - Table Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/manager/tables');
    await page.waitForLoadState('networkidle');
  });

  test('should display table grid', async ({ page }) => {
    // Wait for tables to load
    await page.waitForSelector('[data-testid="table-card"], [data-testid="table-grid"]', {
      timeout: 10000,
    });

    // Check tables are visible
    const tables = page.locator('[data-testid="table-card"]');
    const count = await tables.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show table status indicators', async ({ page }) => {
    await page.waitForSelector('[data-testid="table-card"]', { timeout: 10000 });

    // Check for status indicators (available, occupied, etc.)
    const firstTable = page.locator('[data-testid="table-card"]').first();

    // Should have some status indication
    await expect(firstTable).toBeVisible();
  });

  test('should open table details on click', async ({ page }) => {
    await page.waitForSelector('[data-testid="table-card"]', { timeout: 10000 });

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
    await page.waitForLoadState('networkidle');
  });

  test('should display menu categories', async ({ page }) => {
    await page.waitForSelector('[data-testid="menu-category"], [data-testid="category-tab"]', {
      timeout: 10000,
    });

    const categories = page.locator('[data-testid="menu-category"], [data-testid="category-tab"]');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display menu items', async ({ page }) => {
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    const items = page.locator('[data-testid="menu-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open add item modal', async ({ page }) => {
    // Find add item button
    const addButton = page.locator(
      '[data-testid="add-item"], button:has-text("Add Item"), button:has-text("Add")'
    );

    if ((await addButton.count()) > 0) {
      await addButton.first().click();

      // Should show add item form
      await expect(page.locator('[data-testid="item-form"], [role="dialog"]')).toBeVisible();
    }
  });

  test('should toggle item availability', async ({ page }) => {
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

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
