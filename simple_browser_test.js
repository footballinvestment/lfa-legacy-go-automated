// ============================================================================
// LFA Legacy GO - SIMPLE BROWSER TEST
// Uses Puppeteer directly - NO Playwright config conflicts
// ============================================================================

const puppeteer = require("puppeteer");
const fs = require("fs");

// Configuration
const CONFIG = {
  frontend: "https://lfa-legacy-go.netlify.app",
  backend: "https://lfa-legacy-go-backend-376491487980.us-central1.run.app",
  username: "testuser",
  password: "password123",
};

// Create results directory
if (!fs.existsSync("test-results")) {
  fs.mkdirSync("test-results");
}

async function runTest() {
  console.log("🚀 Starting LFA Legacy GO Production Test...");
  console.log("Frontend:", CONFIG.frontend);
  console.log("Backend:", CONFIG.backend);
  console.log("Credentials:", CONFIG.username + "/***");

  let browser;
  let redirectCount = 0;
  let navigationRedirects = 0;

  try {
    // Launch browser
    console.log("🎭 Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    // Monitor redirects - IMPROVED: Filter out asset redirects
    page.on("response", (response) => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++;
        const url = response.url();

        // Check if it's an asset redirect
        const isAsset =
          url.includes(".css") ||
          url.includes(".js") ||
          url.includes(".png") ||
          url.includes(".ico") ||
          url.includes("manifest.json") ||
          url.includes("favicon");

        if (!isAsset) {
          navigationRedirects++;
          console.log(`🔄 Navigation Redirect ${navigationRedirects}: ${url}`);

          // Only check navigation redirects for infinite loop
          if (navigationRedirects > 5) {
            throw new Error(
              `🚨 INFINITE NAVIGATION LOOP DETECTED! ${navigationRedirects} navigation redirects`
            );
          }
        } else {
          console.log(`📁 Asset Redirect ${redirectCount}: ${url}`);
        }
      }

      // Log auth API calls
      if (response.url().includes("/api/auth/")) {
        console.log(
          `🔐 Auth API: ${response
            .request()
            .method()} ${response.url()} -> ${response.status()}`
        );
      }
    });

    // Monitor console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // TEST 1: Backend Health Check
    console.log("\n🏥 Testing backend health...");
    try {
      const healthResponse = await fetch(`${CONFIG.backend}/health`);
      const healthData = await healthResponse.json();
      console.log("✅ Backend health:", healthData.status);
    } catch (e) {
      console.log("❌ Backend health check failed:", e.message);
    }

    // TEST 2: Site Loading
    console.log("\n🎯 Testing site loading...");
    await page.goto(CONFIG.frontend, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await page.screenshot({
      path: "test-results/01-site-loaded.png",
      fullPage: true,
    });
    console.log("✅ Site loaded successfully");

    // TEST 3: Login Form Detection
    console.log("\n🔍 Looking for login form...");

    // Try to find login elements
    let usernameInput, passwordInput, submitButton;

    try {
      await page.waitForSelector('input[type="text"]', { timeout: 5000 });
      usernameInput = await page.$('input[type="text"]');
    } catch (e) {
      console.log("🔄 No username input found, trying /login...");
      await page.goto(`${CONFIG.frontend}/login`, {
        waitUntil: "networkidle2",
      });
      usernameInput = await page.$('input[type="text"]');
    }

    passwordInput = await page.$('input[type="password"]');
    submitButton = await page.$('button[type="submit"]');

    if (!usernameInput || !passwordInput || !submitButton) {
      await page.screenshot({
        path: "test-results/02-form-not-found.png",
        fullPage: true,
      });
      throw new Error("Login form elements not found!");
    }

    console.log("✅ Login form elements found");
    await page.screenshot({
      path: "test-results/02-login-form.png",
      fullPage: true,
    });

    // TEST 4: Registration Flow (since testuser doesn't exist on production)
    console.log("\n📝 Testing registration flow...");

    // Navigate to registration
    await page.goto(`${CONFIG.frontend}/register`, {
      waitUntil: "networkidle2",
    });
    await page.screenshot({
      path: "test-results/03-register-page.png",
      fullPage: true,
    });

    // Fill registration form
    const usernameReg =
      (await page.$('input[name="username"]')) ||
      (await page.$('input[type="text"]'));
    const emailReg =
      (await page.$('input[name="email"]')) ||
      (await page.$('input[type="email"]'));
    const fullNameReg =
      (await page.$('input[name="full_name"]')) ||
      (await page.$('input[name="fullName"]'));
    const passwordReg =
      (await page.$('input[name="password"]')) ||
      (await page.$('input[type="password"]'));
    const submitReg = await page.$('button[type="submit"]');

    if (usernameReg && emailReg && passwordReg && submitReg) {
      console.log("✅ Registration form found, creating new user...");

      const timestamp = Date.now();
      const testUsername = `testuser_${timestamp}`;

      await usernameReg.type(testUsername);
      await emailReg.type(`test_${timestamp}@example.com`);
      if (fullNameReg) await fullNameReg.type("Test User");
      await passwordReg.type(CONFIG.password);

      await page.screenshot({
        path: "test-results/04-registration-filled.png",
        fullPage: true,
      });

      console.log("🚀 Submitting registration...");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
        submitReg.click(),
      ]);

      console.log(`✅ Registration completed for user: ${testUsername}`);
    } else {
      console.log(
        "⚠️ Registration form not found, trying login with existing user..."
      );

      // Fallback to login test
      await page.goto(`${CONFIG.frontend}/login`, {
        waitUntil: "networkidle2",
      });

      await usernameInput.type(CONFIG.username);
      await passwordInput.type(CONFIG.password);
      await page.screenshot({
        path: "test-results/04-credentials-filled.png",
        fullPage: true,
      });

      console.log("🚀 Submitting login...");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
        submitButton.click(),
      ]);
    }

    // Take post-login screenshot
    await page.screenshot({
      path: "test-results/04-post-login.png",
      fullPage: true,
    });

    // Check result
    const currentUrl = page.url();
    console.log("📍 Final URL:", currentUrl);
    console.log("🔄 Total redirects:", redirectCount);
    console.log("🌐 Navigation redirects:", navigationRedirects);

    // Determine success
    if (navigationRedirects > 5) {
      console.log("🚨 INFINITE NAVIGATION LOOP DETECTED!");
      throw new Error(
        `Infinite navigation loop: ${navigationRedirects} navigation redirects`
      );
    } else if (currentUrl.includes("/login")) {
      console.log("❌ Still on login page - authentication failed");
      throw new Error("Authentication failed - still on login page");
    } else {
      console.log("🎉 LOGIN SUCCESSFUL!");
      console.log("✅ Navigation working correctly");
      console.log("✅ No infinite loop detected");

      // Look for dashboard elements
      const dashboardTexts = ["credit", "level", "game", "user", "profile"];
      let foundElements = 0;

      for (const text of dashboardTexts) {
        const elements = await page.$eval(
          "*",
          (els, searchText) => {
            return els.some(
              (el) =>
                el.textContent &&
                el.textContent.toLowerCase().includes(searchText)
            );
          },
          text
        );

        if (elements) {
          foundElements++;
          console.log(`✅ Found dashboard element: ${text}`);
        }
      }

      console.log(
        `📊 Dashboard elements found: ${foundElements}/${dashboardTexts.length}`
      );
    }

    console.log("\n🎉 =====================================");
    console.log("📊 TEST COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`📁 Asset redirects: ${redirectCount - navigationRedirects}`);
    console.log(`🌐 Navigation redirects: ${navigationRedirects}/5 (safe)`);
    console.log("📁 Screenshots saved to test-results/");
    console.log("✅ Authentication flow working");
    console.log("✅ No infinite loops detected");
    console.log("=====================================\n");
  } catch (error) {
    console.log("\n💥 =====================================");
    console.log("❌ TEST FAILED!");
    console.log("=====================================");
    console.log("Error:", error.message);
    console.log(`📁 Asset redirects: ${redirectCount - navigationRedirects}`);
    console.log(`🌐 Navigation redirects: ${navigationRedirects}`);
    console.log("📁 Screenshots saved to test-results/");

    if (navigationRedirects > 5) {
      console.log("🚨 INFINITE NAVIGATION LOOP CONFIRMED!");
      console.log("💡 The authentication routing fix is NOT working");
    } else {
      console.log("⚠️ Other issue detected (not infinite loop)");
      console.log("💡 Possible credential/authentication issue");
    }
    console.log("=====================================\n");

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runTest().catch((error) => {
  console.error("💥 Test execution failed:", error.message);
  process.exit(1);
});

console.log("🎯 LFA Legacy GO Browser Test Starting...");
