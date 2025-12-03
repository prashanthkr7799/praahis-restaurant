/**
 * Customer Order Flow E2E Tests
 * Tests the complete customer ordering experience
 */
/* eslint-env node */

import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to customer menu page (assuming a test restaurant)
    await page.goto('/menu/test-restaurant');
  });

  test('should display menu categories', async ({ page }) => {
    // Wait for menu to load
    await page.waitForSelector('[data-testid="menu-category"]', { timeout: 10000 });

    // Check that at least one category is visible
    const categories = await page.locator('[data-testid="menu-category"]').count();
    expect(categories).toBeGreaterThan(0);
  });

  test('should display menu items with prices', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    // Check menu item structure
    const firstItem = page.locator('[data-testid="menu-item"]').first();

    // Should have name
    await expect(firstItem.locator('[data-testid="item-name"]')).toBeVisible();

    // Should have price
    await expect(firstItem.locator('[data-testid="item-price"]')).toBeVisible();
  });

  test('should add item to cart', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    // Click add button on first item
    await page.click('[data-testid="menu-item"] [data-testid="add-to-cart"]');

    // Wait for cart to update
    await page.waitForTimeout(500);

    // Check cart badge shows 1 item
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toContainText('1');
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
    await page.goto('/menu/test-restaurant');

    // Wait for menu to load
    await page.waitForSelector('[data-testid="menu-category"]', { timeout: 10000 });

    // Check mobile layout
    const menuContainer = page.locator('[data-testid="menu-container"]');
    const box = await menuContainer.boundingBox();

    // Should be full width on mobile
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('should have sticky cart button on mobile', async ({ page }) => {
    await page.goto('/menu/test-restaurant');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    // Cart button should still be visible (sticky)
    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
  });
});
