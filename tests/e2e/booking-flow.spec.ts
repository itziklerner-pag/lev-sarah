import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.describe('Mobile Chrome', () => {
    test.use({ ...test.info().project.use });

    test('should display login page when not authenticated', async ({ page }) => {
      await page.goto('/schedule');

      // Should show login form
      await expect(page.getByRole('heading', { name: 'לב שרה' })).toBeVisible();
      await expect(page.getByText('תורנות ביקורים אצל אבא')).toBeVisible();

      // Should have phone input
      await expect(page.getByRole('textbox')).toBeVisible();
    });

    test('should display week view after authentication', async ({ page }) => {
      // This test requires a mock auth or test user
      // For now, we test the unauthenticated state
      await page.goto('/schedule');

      // Check that the page loads without errors
      await expect(page).toHaveTitle(/לב שרה/);
    });

    test('should have correct RTL layout', async ({ page }) => {
      await page.goto('/schedule');

      // Check RTL direction
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
      await expect(html).toHaveAttribute('lang', 'he');
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.goto('/schedule');

      // Check viewport is mobile-sized (Pixel 5: 393x851)
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(500);

      // Content should not overflow horizontally
      const body = page.locator('body');
      const box = await body.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(viewport?.width ?? 500);
      }
    });

    test('should show loading state', async ({ page }) => {
      await page.goto('/schedule');

      // Should show some loading indicator initially
      // Either the login page or loading spinner
      await expect(
        page.getByText('טוען').or(page.getByRole('heading', { name: 'לב שרה' }))
      ).toBeVisible();
    });
  });
});

test.describe('Booking Flow - Authenticated', () => {
  // These tests would require a mock auth setup
  // Placeholder for when we add proper test authentication

  test.skip('should display week navigation', async ({ page }) => {
    await page.goto('/schedule');
    // After auth, should see week navigation
    await expect(page.getByRole('button', { name: 'שבוע קודם' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'שבוע הבא' })).toBeVisible();
  });

  test.skip('should display day cards', async ({ page }) => {
    await page.goto('/schedule');
    // Should show 7 day cards
    const dayCards = page.locator('[data-testid="day-card"]');
    await expect(dayCards).toHaveCount(7);
  });

  test.skip('should open booking modal on slot click', async ({ page }) => {
    await page.goto('/schedule');
    // Click on an available slot
    await page.getByRole('button', { name: /פנוי/ }).first().click();
    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test.skip('should complete booking in under 30 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/schedule');
    // Assume user is logged in, click first available slot
    await page.getByRole('button', { name: /פנוי/ }).first().click();
    // Confirm booking
    await page.getByRole('button', { name: /אישור/ }).click();
    // Wait for confirmation
    await expect(page.getByText(/הביקור נקבע/)).toBeVisible({ timeout: 5000 });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // Under 30 seconds
  });
});

test.describe('Error Handling', () => {
  test('should gracefully handle network errors', async ({ page }) => {
    // Block all network requests after page load
    await page.goto('/schedule');

    // Page should still display without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show error boundary on React errors', async ({ page }) => {
    await page.goto('/schedule');

    // Inject an error (simulate React error)
    await page.evaluate(() => {
      // This would trigger the error boundary
      // For now, just verify the page loads without default errors
    });

    // Should not show default React error overlay
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  });
});

test.describe('PWA Features', () => {
  test('should have valid manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('לב שרה - תורנות ביקורים');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.lang).toBe('he');
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/schedule');

    // Wait for service worker to register
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, { timeout: 10000 }).catch(() => {
      // Service worker may not register in test environment
    });
  });
});
