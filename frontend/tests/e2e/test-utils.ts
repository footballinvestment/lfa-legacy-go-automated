import { Page, expect } from '@playwright/test';

export class LFATestUtils {
  constructor(private page: Page) {}

  /**
   * Login helper function
   */
  async login(username: string = 'testuser', password: string = 'testpass123') {
    await this.page.goto('/login');
    await this.page.fill('input[type="text"]', username);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  /**
   * Navigate to credits page
   */
  async goToCreditsPage() {
    // Try multiple ways to navigate to credits
    const creditsButton = this.page.locator('button:has-text("Manage Credits"), button:has-text("Credits"), a[href="/credits"]').first();
    
    if (await creditsButton.isVisible()) {
      await creditsButton.click();
    } else {
      // Direct navigation
      await this.page.goto('/credits');
    }
    
    await expect(this.page).toHaveURL(/.*credits/);
  }

  /**
   * Get current credit balance
   */
  async getCurrentCreditBalance(): Promise<number> {
    const balanceText = await this.page.locator('text=/\d+.*credits?/i').first().textContent();
    const balance = parseInt(balanceText?.match(/\d+/)?.[0] || '0');
    return balance;
  }

  /**
   * Redeem a coupon
   */
  async redeemCoupon(couponCode: string) {
    const couponInput = this.page.locator('input[placeholder*="coupon" i], input[label*="coupon" i]').first();
    await couponInput.fill(couponCode);
    await this.page.click('button:has-text("Redeem"), button:has-text("Apply")');
    
    // Wait for response
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for notification/toast message
   */
  async waitForNotification(expectedText?: string) {
    const notification = this.page.locator('text=/success|error|redeemed|invalid|already.*used/i');
    await expect(notification).toBeVisible({ timeout: 10000 });
    
    if (expectedText) {
      await expect(notification).toContainText(expectedText, { ignoreCase: true });
    }
    
    return notification;
  }

  /**
   * Check if element is mobile responsive
   */
  async checkMobileResponsive() {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible
    await expect(this.page.locator('text=/credit.*balance/i')).toBeVisible();
    await expect(this.page.locator('input')).toBeVisible();
    await expect(this.page.locator('button')).toBeVisible();
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Clear all storage (logout simulation)
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(endpoint: string, response: any, status: number = 200) {
    await this.page.route(endpoint, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(endpoint: string) {
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes(endpoint) && response.status() < 400
    );
    return responsePromise;
  }

  /**
   * Check console for errors
   */
  async checkConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }
}

/**
 * Test data for coupons
 */
export const TEST_COUPONS = {
  VALID: ['TESTING5', 'FOOTBALL25', 'WEEKEND50', 'CHAMPION100', 'NEWBIE10'],
  INVALID: ['INVALID123', 'EXPIRED999', 'NOTFOUND'],
  SPECIAL: {
    HIGH_VALUE: 'CHAMPION100',
    LOW_VALUE: 'TESTING5',
    WEEKEND: 'WEEKEND50'
  }
};

/**
 * Test user credentials
 */
export const TEST_USER = {
  USERNAME: 'testuser',
  PASSWORD: 'testpass123',
  INVALID_USERNAME: 'wronguser',
  INVALID_PASSWORD: 'wrongpass'
};