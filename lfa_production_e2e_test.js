// ============================================================================
// LFA Legacy GO - MINIMAL PRODUCTION TEST
// Simple working version to test Netlify + Google Cloud
// ============================================================================

const { test, expect } = require("@playwright/test");

// Configuration
const CONFIG = {
  frontend: "https://lfa-legacy-go.netlify.app",
  backend: "https://lfa-legacy-go-backend-376491487980.us-central1.run.app",
  username: "testuser",
  password: "password123",
};

// Set test configuration
test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  actionTimeout: 30000,
  navigationTimeout: 60000,
});

test.describe("🚀 LFA Legacy GO - Production Test", () => {
  test("✅ Site Loading Test", async ({ page }) => {
    console.log("🎯 Testing site loading...");

    await page.goto(CONFIG.frontend);
    await page.waitForLoadState("networkidle");

    // Take screenshot
    await page.screenshot({
      path: "test-results/site-loaded.png",
      fullPage: true,
    });

    console.log("✅ Site loaded successfully");
  });

  test("🔐 Login Test - CRITICAL", async ({ page }) => {
    console.log("🎯 Starting login test...");

    let redirectCount = 0;

    // Monitor redirects
    page.on("response", (response) => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++;
        console.log(`🔄 Redirect ${redirectCount}: ${response.url()}`);

        if (redirectCount > 10) {
          throw new Error("🚨 INFINITE LOOP DETECTED!");
        }
      }
    });

    // Go to site
    await page.goto(CONFIG.frontend);
    await page.waitForLoadState("networkidle");

    // Try to find login elements
    console.log("🔍 Looking for login form...");

    // Take screenshot of current state
    await page.screenshot({
      path: "test-results/before-login.png",
      fullPage: true,
    });

    // Look for username input
    let usernameInput;
    try {
      usernameInput = page.locator('input[type="text"]').first();
      if (!(await usernameInput.isVisible({ timeout: 5000 }))) {
        throw new Error("Username input not visible");
      }
    } catch (e) {
      console.log("🔄 Username input not found, trying /login...");
      await page.goto(`${CONFIG.frontend}/login`);
      await page.waitForLoadState("networkidle");
      usernameInput = page.locator('input[type="text"]').first();
    }

    // Look for password input
    const passwordInput = page.locator('input[type="password"]');

    // Look for submit button
    const submitButton = page.locator('button[type="submit"]');

    // Verify elements exist
    expect(await usernameInput.isVisible()).toBeTruthy();
    expect(await passwordInput.isVisible()).toBeTruthy();
    expect(await submitButton.isVisible()).toBeTruthy();

    console.log("✅ Login form elements found");

    // Fill and submit
    console.log("📝 Filling credentials...");
    await usernameInput.fill(CONFIG.username);
    await passwordInput.fill(CONFIG.password);

    await page.screenshot({
      path: "test-results/credentials-filled.png",
      fullPage: true,
    });

    // Submit and monitor
    console.log("🚀 Submitting login...");
    await submitButton.click();

    // Wait for response
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Take final screenshot
    await page.screenshot({
      path: "test-results/after-login.png",
      fullPage: true,
    });

    // Check result
    const currentUrl = page.url();
    console.log("📍 Final URL:", currentUrl);
    console.log("🔄 Total redirects:", redirectCount);

    if (redirectCount > 8) {
      console.log("🚨 INFINITE LOOP DETECTED!");
      throw new Error(`Infinite loop: ${redirectCount} redirects`);
    } else if (currentUrl.includes("/login")) {
      console.log("❌ Still on login page - authentication failed");
      throw new Error("Authentication failed - still on login page");
    } else {
      console.log("🎉 LOGIN SUCCESSFUL! Navigation working!");
      console.log("✅ No infinite loop detected");
    }

    expect(redirectCount).toBeLessThan(8);
    expect(currentUrl).not.toContain("/login");
  });

  test("🏥 Backend Health Check", async ({ request }) => {
    console.log("🎯 Testing backend health...");

    const response = await request.get(`${CONFIG.backend}/health`);
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    console.log("🏥 Backend status:", health.status);

    expect(health.status).toBe("healthy");
    console.log("✅ Backend is healthy");
  });
});

console.log("🎯 LFA Legacy GO Test Suite Ready");
console.log("Frontend:", CONFIG.frontend);
console.log("Backend:", CONFIG.backend);
console.log("Credentials:", CONFIG.username + "/***");
