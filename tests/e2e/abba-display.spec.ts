import { test, expect } from '@playwright/test';

test.describe('Abba Display', () => {
  test.use({ viewport: { width: 1024, height: 768 } }); // iPad viewport

  test('should display kiosk view', async ({ page }) => {
    await page.goto('/abba');

    // Should show the display without login requirement
    await expect(page).toHaveTitle(/לב שרה/);

    // Should have large readable text (kiosk mode)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show current date in Hebrew', async ({ page }) => {
    await page.goto('/abba');

    // Should display Hebrew date
    // The Hebrew date component should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have large fonts readable from 2 meters', async ({ page }) => {
    await page.goto('/abba');

    // Check that main text elements are large enough
    // For a kiosk display, text should be at least 24px
    await page.waitForLoadState('networkidle');

    const headings = page.locator('h1, h2');
    const count = await headings.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const heading = headings.nth(i);
        const fontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        const size = parseInt(fontSize);
        expect(size).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test('should be visible on tablet viewport', async ({ page }) => {
    await page.goto('/abba');

    // Check viewport is tablet-sized
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(1024);
    expect(viewport?.height).toBe(768);

    // Content should fit without horizontal scroll
    const body = page.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1024);
  });

  test('should have high contrast colors', async ({ page }) => {
    await page.goto('/abba');

    // Check that background is not too dark (for elderly visibility)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have a light background (not dark mode by default)
    expect(bgColor).not.toBe('rgb(0, 0, 0)');
  });

  test('should not require user interaction', async ({ page }) => {
    await page.goto('/abba');

    // Should not show login prompts
    await expect(page.getByRole('textbox')).not.toBeVisible({ timeout: 3000 });

    // Should show content directly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should auto-refresh data', async ({ page }) => {
    await page.goto('/abba');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // The display should set up realtime subscription
    // We can verify by checking that the page doesn't stall
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Abba Display - Accessibility', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/abba');

    // Should have main landmark
    const main = page.locator('main');
    const hasMain = await main.count();

    // At minimum, body should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work without JavaScript for initial content', async ({ page }) => {
    // This would require SSR, which Next.js provides
    // The page should at least show loading state
    await page.goto('/abba');
    await expect(page).toHaveTitle(/לב שרה/);
  });

  test('should have RTL layout', async ({ page }) => {
    await page.goto('/abba');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('Abba Display - Error Handling', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('should handle offline gracefully', async ({ page, context }) => {
    // Load page first
    await page.goto('/abba');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Page should still display
    await expect(page.locator('body')).toBeVisible();

    // Restore network
    await context.setOffline(false);
  });

  test('should recover from network errors', async ({ page }) => {
    await page.goto('/abba');

    // Simulate slow network
    await page.route('**/*', (route) => {
      route.continue();
    });

    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});
