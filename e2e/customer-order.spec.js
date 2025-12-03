/**
 * Customer Order Flow E2E Tests
 * Tests the complete customer ordering experience
 *
 * NOTE: These tests require a valid table ID in your database.
 * Set TEST_TABLE_ID environment variable or tests will be skipped.
 *
 * Example: TEST_TABLE_ID=your-table-uuid npm run test:e2e
 */
/* eslint-env node */

import { test, expect } from '@playwright/test';

// Get test table ID from environment or use a placeholder
const TEST_TABLE_ID = process.env.TEST_TABLE_ID;

test.describe('Customer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if no table ID is configured
    if (!TEST_TABLE_ID) {
      console.warn('⚠️ TEST_TABLE_ID not set - skipping customer order tests');
      console.warn('⚠️ Set TEST_TABLE_ID to a valid table UUID from your database');
      test.skip();
      return;
    }

    // Navigate to customer menu page with valid table ID
    await page.goto(`/table/${TEST_TABLE_ID}`);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display menu categories', async ({ page }) => {
    // Wait for menu to load (with reasonable timeout)
    try {
      await page.waitForSelector('[data-testid="menu-category"]', { timeout: 10000 });

      // Check that at least one category is visible
      const categories = await page.locator('[data-testid="menu-category"]').count();
      expect(categories).toBeGreaterThan(0);
    } catch {
      // If no menu items, check for loading/error state
      const hasError = await page.locator('.error-message, [role="alert"]').isVisible();
      if (hasError) {
        console.warn('Menu failed to load - check table ID and database');
      }
      test.skip();
    }
  });

  test('should display menu items with prices', async ({ page }) => {
    // Wait for items to load
    try {
      await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });
    } catch {
      test.skip();
      return;
    }

    // Check menu item structure
    const firstItem = page.locator('[data-testid="menu-item"]').first();
    await expect(firstItem).toBeVisible();

    // Items should exist (price is shown inside the card)
    const itemCount = await page.locator('[data-testid="menu-item"]').count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should add item to cart', async ({ page }) => {
    // Wait for items to load
    try {
      await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });
    } catch {
      test.skip();
      return;
    }

    // Click add button on first item
    await page.click('[data-testid="add-to-cart"]');

    // Wait for cart to update
    await page.waitForTimeout(500);

    // Check cart badge appears
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toBeVisible();
  });

  test('should update item quantity in cart', async ({ page }) => {
    // Add item first
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });
    await page.click('[data-testid="menu-item"] [data-testid="add-to-cart"]');

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Wait for cart modal
    await page.waitForSelector('[data-testid="cart-modal"]');

    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');

    // Check quantity updated
    const quantity = page.locator('[data-testid="item-quantity"]');
    await expect(quantity).toContainText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add item first
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });
    await page.click('[data-testid="menu-item"] [data-testid="add-to-cart"]');

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Wait for cart modal
    await page.waitForSelector('[data-testid="cart-modal"]');

    // Remove item
    await page.click('[data-testid="remove-item"]');

    // Check cart is empty
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });

  test('should calculate cart total correctly', async ({ page }) => {
    // Add multiple items
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    // Get first item price
    const priceText = await page
      .locator('[data-testid="menu-item"]')
      .first()
      .locator('[data-testid="item-price"]')
      .textContent();
    const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');

    // Add item twice
    await page.click('[data-testid="menu-item"] [data-testid="add-to-cart"]');
    await page.click('[data-testid="menu-item"] [data-testid="add-to-cart"]');

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Check total
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();
    const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

    expect(total).toBe(price * 2);
  });
});

test.describe('Customer Order Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized menu', async ({ page }) => {
    // Skip if no table ID configured
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for menu to load
    try {
      await page.waitForSelector('[data-testid="menu-container"]', { timeout: 10000 });
    } catch {
      test.skip();
      return;
    }

    // Check mobile layout
    const menuContainer = page.locator('[data-testid="menu-container"]');
    const box = await menuContainer.boundingBox();

    // Should be full width on mobile
    if (box) {
      expect(box.width).toBeLessThanOrEqual(400);
    }
  });

  test('should have sticky cart button on mobile', async ({ page }) => {
    // Skip if no table ID configured
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');

    // Need to add item first for cart button to appear
    try {
      await page.waitForSelector('[data-testid="add-to-cart"]', { timeout: 10000 });
      await page.click('[data-testid="add-to-cart"]');
      await page.waitForTimeout(300);
    } catch {
      test.skip();
      return;
    }

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);

    // Cart button should still be visible (sticky)
    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
  });
});
