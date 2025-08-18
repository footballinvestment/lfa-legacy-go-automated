import { test, expect } from '@playwright/test';

test.describe('🔐 LFA Legacy GO - Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2, h3, h4')).toContainText(/login|sign in/i);
  });

  test('should allow user to login successfully', async ({ page }) => {
    // Navigate to login if not already there
    await page.goto('/login');
    
    // Fill login form (Material-UI TextField - use label text and input type)
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass123');
    
    // Submit login form
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should see welcome message
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // Should see user stats (credits, level, etc.)
    await expect(page.locator('text=/credits?/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.fill('input[type="text"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout user successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Find and click logout button (could be in menu, profile dropdown, etc.)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]').first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try to find logout in a menu or profile dropdown
      const profileMenu = page.locator('[aria-label="Profile"], [aria-label="User menu"], button:has-text("Profile")').first();
      if (await profileMenu.isVisible()) {
        await profileMenu.click();
        await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
      }
    }
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should maintain session on page refresh', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard (session maintained)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should handle expired session gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Clear localStorage to simulate expired session
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    });
    
    // Try to navigate to protected route
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});