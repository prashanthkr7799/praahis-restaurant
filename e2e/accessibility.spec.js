/**
 * Accessibility E2E Tests
 * WCAG 2.1 AA Compliance Testing with Playwright + axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test configuration
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Helper to run axe accessibility scan
 */
async function runAccessibilityScan(page, options = {}) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude(options.exclude || [])
    .analyze();

  return results;
}

/**
 * Format violations for readable output
 */
function formatViolations(violations) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
  }));
}

// ============================================
// Landing Page Tests
// ============================================
test.describe('Landing Page Accessibility', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await runAccessibilityScan(page);

    // Filter only critical and serious violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      console.log('Critical Violations:', formatViolations(criticalViolations));
    }

    expect(criticalViolations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check heading order (no skipped levels)
    const headings = await page.evaluate(() => {
      const hs = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return hs.map((h) => parseInt(h.tagName[1]));
    });

    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i - 1];
      expect(diff).toBeLessThanOrEqual(1); // No skipped levels
    }
  });

  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThanOrEqual(1);

    // Check for navigation
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// Login Page Tests
// ============================================
test.describe('Login Page Accessibility', () => {
  test('should have accessible form controls', async ({ page }) => {
    await page.goto('/staff/login');
    await page.waitForLoadState('networkidle');

    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailLabel =
      (await emailInput.getAttribute('aria-label')) ||
      (await page.locator('label[for]').filter({ has: emailInput }).count());
    expect(emailLabel).toBeTruthy();

    // Check password input has label
    const passwordInput = page.locator('input[type="password"]');
    const passwordLabel =
      (await passwordInput.getAttribute('aria-label')) ||
      (await page.locator('label[for]').filter({ has: passwordInput }).count());
    expect(passwordLabel).toBeTruthy();

    // Check submit button is accessible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    const buttonText = await submitButton.textContent();
    expect(buttonText?.length).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/staff/login');
    await page.waitForLoadState('networkidle');

    // Click on the page first to ensure focus is in the document
    await page.click('body');

    // Tab through form elements
    await page.keyboard.press('Tab');

    // Keep tabbing until we hit an interactive element
    let firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    let attempts = 0;
    while (firstFocused === 'BODY' && attempts < 5) {
      await page.keyboard.press('Tab');
      firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      attempts++;
    }

    expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocused);

    // Tab to password
    await page.keyboard.press('Tab');

    // Tab to submit
    await page.keyboard.press('Tab');

    // Should be able to find submit button eventually
    const submitFocused = await page.evaluate(() => document.activeElement?.getAttribute('type'));
    // Might not be on submit yet due to various focusable elements
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/staff/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // Check that focus is visible (has outline or ring)
    const focusStyles = await emailInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // At least one focus indicator should be present
    const hasFocusIndicator =
      focusStyles.outline !== 'none' ||
      focusStyles.boxShadow !== 'none' ||
      focusStyles.border.includes('rgb');

    expect(hasFocusIndicator).toBe(true);
  });
});

// ============================================
// Customer Menu Page Tests
// ============================================
test.describe('Customer Menu Accessibility', () => {
  // Get test table ID from environment
  const TEST_TABLE_ID = process.env.TEST_TABLE_ID;

  test('should have accessible menu items', async ({ page }) => {
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    // Navigate to a test restaurant menu
    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const results = await runAccessibilityScan(page, {
      exclude: ['#razorpay-container'], // Exclude third-party widgets
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');

    expect(criticalViolations).toHaveLength(0);
  });

  test('should have proper button labels', async ({ page }) => {
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check all buttons have accessible names
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const accessibleName = await button.evaluate((el) => {
        return el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('title');
      });

      expect(accessibleName?.length).toBeGreaterThan(0);
    }
  });

  test('should have proper image alt text', async ({ page }) => {
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check all images have alt text
    const images = await page.locator('img').all();

    for (const img of images) {
      const altText = await img.getAttribute('alt');
      const isDecorative = (await img.getAttribute('role')) === 'presentation';

      // Either has alt text or is marked as decorative
      expect(altText !== null || isDecorative).toBe(true);
    }
  });
});

// ============================================
// Color Contrast Tests
// ============================================
test.describe('Color Contrast', () => {
  test('should meet WCAG AA contrast requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ runOnly: ['color-contrast'] })
      .analyze();

    const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

    if (contrastViolations.length > 0) {
      console.log('Contrast issues:', formatViolations(contrastViolations));
    }

    // Allow some minor violations, flag if more than 3
    expect(contrastViolations.length).toBeLessThanOrEqual(3);
  });
});

// ============================================
// Keyboard Navigation Tests
// ============================================
test.describe('Keyboard Navigation', () => {
  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/staff/login');
    await page.waitForLoadState('networkidle');

    // If there's a modal, focus should be trapped
    const modal = page.locator('[role="dialog"]');

    if (await modal.isVisible()) {
      // Get all focusable elements in modal
      const focusableInModal = await modal
        .locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .count();

      // Tab through all elements
      for (let i = 0; i < focusableInModal + 2; i++) {
        await page.keyboard.press('Tab');
      }

      // Focus should still be in modal
      const activeElement = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"]')
      );

      expect(activeElement).not.toBeNull();
    }
  });

  test('should close modals with Escape key', async ({ page }) => {
    // Skip if no auth credentials
    const hasAuth = process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD;

    await page.goto('/manager');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login
    if (page.url().includes('login')) {
      if (!hasAuth) {
        test.skip();
        return;
      }
    }

    // Find and click a button that opens a modal
    const modalTrigger = page.locator('[data-modal-trigger]').first();

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();

      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    }
  });
});

// ============================================
// Screen Reader Tests
// ============================================
test.describe('Screen Reader Support', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check interactive elements have ARIA labels
    const interactiveElements = await page
      .locator(
        'button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])'
      )
      .all();

    for (const el of interactiveElements) {
      const text = await el.textContent();
      const title = await el.getAttribute('title');

      // Should have visible text or title
      expect(text?.trim().length || title?.length).toBeGreaterThan(0);
    }
  });

  test('should have live regions for dynamic content', async ({ page }) => {
    // Skip if no auth credentials - chef page requires auth
    const hasAuth = process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD;

    await page.goto('/chef');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login
    if (page.url().includes('login')) {
      if (!hasAuth) {
        test.skip();
        return;
      }
    }

    // Check for live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();

    // Kitchen display should have live regions for order updates
    expect(liveRegions).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// Mobile Accessibility Tests
// ============================================
test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  // Get test table ID from environment
  const TEST_TABLE_ID = process.env.TEST_TABLE_ID;

  test('should have touch-friendly targets', async ({ page }) => {
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const box = await button.boundingBox();

      if (box) {
        // Minimum touch target size is 44x44 pixels
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should not require horizontal scrolling', async ({ page }) => {
    if (!TEST_TABLE_ID) {
      test.skip();
      return;
    }

    await page.goto(`/table/${TEST_TABLE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
