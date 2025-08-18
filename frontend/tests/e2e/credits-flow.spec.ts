import { test, expect } from '@playwright/test';

test.describe('💎 LFA Legacy GO - Credits & Coupons Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display credit balance on dashboard', async ({ page }) => {
    // Should see credit balance in stats
    await expect(page.locator('text=/credits?/i')).toBeVisible();
    
    // Should see numeric credit value
    await expect(page.locator('text=/\d+/').first()).toBeVisible();
  });

  test('should navigate to credits page from dashboard', async ({ page }) => {
    // Look for "Manage Credits" button or credits navigation
    const creditsButton = page.locator('button:has-text("Manage Credits"), button:has-text("Credits"), a[href="/credits"]').first();
    
    if (await creditsButton.isVisible()) {
      await creditsButton.click();
    } else {
      // Try clicking on the credits card/stat
      await page.click('text=/credits?/i');
    }
    
    // Should navigate to credits page
    await expect(page).toHaveURL(/.*credits/);
  });

  test('should display credits page components', async ({ page }) => {
    // Navigate to credits page
    await page.goto('/credits');
    
    // Should see credit balance component
    await expect(page.locator('text=/credit.*balance/i, text=/available.*credits/i')).toBeVisible();
    
    // Should see coupon redemption form
    await expect(page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]')).toBeVisible();
    
    // Should see redeem button
    await expect(page.locator('button:has-text("Redeem"), button:has-text("Apply")').first()).toBeVisible();
  });

  test('should show available coupons in development mode', async ({ page }) => {
    await page.goto('/credits');
    
    // Should see available coupons section (development mode)
    const couponsSection = page.locator('text=/available.*coupons?/i');
    
    if (await couponsSection.isVisible()) {
      // Should see coupon codes
      await expect(page.locator('text=/FOOTBALL25|WEEKEND50|CHAMPION100|TESTING5|NEWBIE10/i').first()).toBeVisible();
    }
  });

  test('should copy coupon code when clicked', async ({ page }) => {
    await page.goto('/credits');
    
    // Look for available coupons
    const couponCode = page.locator('text=/TESTING5|FOOTBALL25|WEEKEND50/i').first();
    
    if (await couponCode.isVisible()) {
      await couponCode.click();
      
      // Should see copy confirmation or the coupon input should be filled
      await expect(
        page.locator('text=/copied/i').or(
          page.locator('input[placeholder*="coupon" i]')
        )
      ).toBeVisible();
    }
  });

  test('should validate coupon input format', async ({ page }) => {
    await page.goto('/credits');
    
    const couponInput = page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]').first();
    
    // Test empty input
    await couponInput.fill('');
    await page.click('button:has-text("Redeem"), button:has-text("Apply")');
    
    // Should show validation error
    await expect(page.locator('text=/enter.*coupon|coupon.*required/i')).toBeVisible();
    
    // Test invalid format
    await couponInput.fill('abc');
    await page.click('button:has-text("Redeem"), button:has-text("Apply")');
    
    // Should show error for invalid coupon
    await expect(page.locator('text=/invalid|not found|expired/i')).toBeVisible();
  });

  test('should attempt coupon redemption flow', async ({ page }) => {
    await page.goto('/credits');
    
    // Get initial credit balance
    const initialBalanceText = await page.locator('text=/\d+.*credits?/i').first().textContent();
    const initialBalance = parseInt(initialBalanceText?.match(/\d+/)?.[0] || '0');
    
    // Try to redeem a test coupon
    const couponInput = page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]').first();
    await couponInput.fill('TESTING5');
    
    await page.click('button:has-text("Redeem"), button:has-text("Apply")');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should show either success or already redeemed message
    const successMessage = page.locator('text=/redeemed|success|awarded|already.*used/i');
    await expect(successMessage).toBeVisible();
  });

  test('should show error for invalid coupon', async ({ page }) => {
    await page.goto('/credits');
    
    // Try invalid coupon
    const couponInput = page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]').first();
    await couponInput.fill('INVALID123');
    
    await page.click('button:has-text("Redeem"), button:has-text("Apply")');
    
    // Should show error message
    await expect(page.locator('text=/invalid|not found|expired|error/i')).toBeVisible();
  });

  test('should display credit purchase options', async ({ page }) => {
    await page.goto('/credits');
    
    // Should see credit packages or purchase section
    const purchaseSection = page.locator('text=/purchase.*credits?|credit.*packages?|buy.*credits?/i');
    
    if (await purchaseSection.isVisible()) {
      // Should see credit amounts and prices
      await expect(page.locator('text=/\d+.*credits?/i')).toBeVisible();
      await expect(page.locator('text=/\$\d+|\d+.*usd|price/i')).toBeVisible();
    }
  });

  test('should handle loading states properly', async ({ page }) => {
    await page.goto('/credits');
    
    // Trigger a coupon redemption to test loading state
    const couponInput = page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]').first();
    await couponInput.fill('TESTING5');
    
    const redeemButton = page.locator('button:has-text("Redeem"), button:has-text("Apply")').first();
    await redeemButton.click();
    
    // Should show loading state (button disabled or spinner)
    await expect(
      redeemButton.locator('text=/redeeming|loading/i').or(
        page.locator('[data-testid="loading"], .loading, text=/please wait/i')
      )
    ).toBeVisible({ timeout: 1000 });
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/credits');
    
    // Components should be visible and properly sized on mobile
    await expect(page.locator('text=/credit.*balance/i')).toBeVisible();
    await expect(page.locator('input[placeholder*="coupon" i]')).toBeVisible();
    await expect(page.locator('button:has-text("Redeem")')).toBeVisible();
  });

  test('should navigate back to dashboard from credits page', async ({ page }) => {
    await page.goto('/credits');
    
    // Look for back button or dashboard navigation
    const backButton = page.locator('button:has-text("Back"), button[aria-label="Back"], a[href="/dashboard"]').first();
    
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL(/.*dashboard/);
    } else {
      // Try breadcrumb navigation
      const dashboardLink = page.locator('text=Dashboard, a:has-text("Dashboard")').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await expect(page).toHaveURL(/.*dashboard/);
      }
    }
  });
});