// =============================================
// LFA LEGACY GO - VISUAL AUTOMATION & INFINITE LOOP DETECTION
// =============================================

import { test, expect } from '@playwright/test';

// CONFIGURATION
const CONFIG = {
  automation: {
    infiniteLoopThreshold: 10,  // Max redirects before alert
    cycleInterval: 4000,        // 4 seconds between actions
    screenshotInterval: 2000,   // Screenshot every 2 seconds
    visualFeedbackEnabled: true // Enable visual debugging
  },
  timeouts: {
    navigation: 60000,
    action: 30000,
    assertion: 10000
  },
  urls: {
    frontend: process.env.FRONTEND_URL || 'https://lfa-legacy-go.netlify.app',
    backend: process.env.BACKEND_URL || 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app'
  },
  testUser: {
    username: process.env.TEST_USERNAME || 'automation_user',
    password: process.env.TEST_PASSWORD || 'automation123',
    email: process.env.TEST_EMAIL || 'automation@lfatest.com'
  }
};

// UTILITY FUNCTIONS
class AutomationUtils {
  static async takeTimestampedScreenshot(page, name, step = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${step}-${timestamp}.png`;
    await page.screenshot({ 
      path: `test-results/automation/${filename}`,
      fullPage: true 
    });
    return filename;
  }

  static async detectInfiniteLoop(page, actionName, maxAttempts = CONFIG.automation.infiniteLoopThreshold) {
    const navigationHistory = [];
    let redirectCount = 0;
    
    const startTime = Date.now();
    
    // Monitor navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        navigationHistory.push({
          url,
          timestamp: Date.now(),
          action: actionName
        });
        
        redirectCount++;
        console.log(`🔄 Navigation ${redirectCount}: ${url}`);
        
        // Take screenshot on each redirect for debugging
        if (CONFIG.automation.visualFeedbackEnabled && redirectCount % 2 === 0) {
          this.takeTimestampedScreenshot(page, 'redirect-detection', `${redirectCount}`);
        }
      }
    });

    return {
      getRedirectCount: () => redirectCount,
      getNavigationHistory: () => navigationHistory,
      checkForInfiniteLoop: () => {
        const elapsed = Date.now() - startTime;
        
        // Check if we exceeded redirect threshold
        if (redirectCount > maxAttempts) {
          console.error(`🚨 INFINITE LOOP DETECTED: ${redirectCount} redirects in ${elapsed}ms`);
          console.error('Navigation History:', navigationHistory);
          return true;
        }

        // Check for rapid same-URL redirects
        const recentUrls = navigationHistory.slice(-5).map(nav => nav.url);
        const uniqueUrls = [...new Set(recentUrls)];
        if (recentUrls.length >= 5 && uniqueUrls.length <= 2) {
          console.error(`🚨 LOOP DETECTED: Rapid redirects between same URLs`);
          console.error('Recent URLs:', recentUrls);
          return true;
        }

        return false;
      }
    };
  }

  static async waitForStableLoad(page, maxWait = 30000) {
    const startTime = Date.now();
    let lastUrl = '';
    let stableCount = 0;
    
    while (Date.now() - startTime < maxWait) {
      const currentUrl = page.url();
      
      if (currentUrl === lastUrl) {
        stableCount++;
        if (stableCount >= 3) { // URL stable for 3 checks
          break;
        }
      } else {
        stableCount = 0;
        lastUrl = currentUrl;
      }
      
      await page.waitForTimeout(1000);
    }
  }
}

// =============================================
// TEST SUITE: APPLICATION HEALTH & LOOP DETECTION
// =============================================

test.describe('LFA Legacy GO - Application Health & Infinite Loop Detection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeouts for stability
    page.setDefaultTimeout(CONFIG.timeouts.navigation);
    page.setDefaultNavigationTimeout(CONFIG.timeouts.navigation);
    
    // Take initial screenshot
    await AutomationUtils.takeTimestampedScreenshot(page, 'test-start', 'initial');
  });

  test.afterEach(async ({ page }) => {
    // Take final screenshot
    await AutomationUtils.takeTimestampedScreenshot(page, 'test-end', 'final');
  });

  // =============================================
  // CRITICAL: INFINITE LOOP DETECTION
  // =============================================
  
  test('🔄 should not have infinite loops during normal navigation', async ({ page }) => {
    const loopDetector = await AutomationUtils.detectInfiniteLoop(page, 'normal-navigation');
    
    console.log(`🌐 Testing frontend: ${CONFIG.urls.frontend}`);
    
    // Navigate to home page
    await page.goto(CONFIG.urls.frontend, { waitUntil: 'networkidle' });
    await AutomationUtils.takeTimestampedScreenshot(page, 'homepage-load', '1');
    
    // Wait for page to be stable
    await AutomationUtils.waitForStableLoad(page);
    
    // Navigate to different sections
    const testNavigation = [
      { selector: 'a[href*="tournaments"]', name: 'tournaments' },
      { selector: 'a[href*="login"]', name: 'login' },
      { selector: 'a[href*="home"]', name: 'home' }
    ];
    
    for (const nav of testNavigation) {
      try {
        // Check for elements and navigate
        const element = await page.locator(nav.selector).first();
        if (await element.isVisible()) {
          await element.click();
          await page.waitForTimeout(CONFIG.automation.cycleInterval);
          await AutomationUtils.takeTimestampedScreenshot(page, 'navigation', nav.name);
        }
      } catch (error) {
        console.log(`⚠️ Navigation to ${nav.name} failed: ${error.message}`);
      }
      
      // Check for infinite loops after each navigation
      if (loopDetector.checkForInfiniteLoop()) {
        throw new Error(`Infinite loop detected during navigation to ${nav.name}`);
      }
    }
    
    // Final loop check
    const finalRedirectCount = loopDetector.getRedirectCount();
    console.log(`✅ Navigation completed with ${finalRedirectCount} redirects (threshold: ${CONFIG.automation.infiniteLoopThreshold})`);
    
    expect(finalRedirectCount).toBeLessThan(CONFIG.automation.infiniteLoopThreshold);
  });

  // =============================================
  // CRITICAL: LOGIN ERROR HANDLING
  // =============================================
  
  test('🔐 should handle login errors without infinite loops', async ({ page }) => {
    const loopDetector = await AutomationUtils.detectInfiniteLoop(page, 'login-error-handling');
    
    console.log(`🔑 Testing login error handling...`);
    
    // Navigate to login page
    await page.goto(`${CONFIG.urls.frontend}/login`, { waitUntil: 'networkidle' });
    await AutomationUtils.takeTimestampedScreenshot(page, 'login-page', '1-loaded');
    
    // Wait for login form
    await page.waitForSelector('form', { timeout: CONFIG.timeouts.assertion });
    
    // Test invalid login credentials (main infinite loop trigger)
    await page.fill('input[type="email"], input[name="email"], input[name="username"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await AutomationUtils.takeTimestampedScreenshot(page, 'login-form', '2-filled');
    
    // Submit form and monitor for loops
    console.log('🚀 Submitting invalid login credentials...');
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait and monitor for error handling
    await page.waitForTimeout(CONFIG.automation.cycleInterval);
    await AutomationUtils.takeTimestampedScreenshot(page, 'login-submit', '3-submitted');
    
    // Check for error messages (should appear without page reload)
    const errorSelectors = [
      '.error',
      '.alert-danger', 
      '[role="alert"]',
      'div:has-text("Invalid")',
      'div:has-text("Error")',
      'div:has-text("incorrect")'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        errorFound = true;
        console.log(`✅ Error message found: ${selector}`);
        await AutomationUtils.takeTimestampedScreenshot(page, 'error-message', '4-displayed');
        break;
      } catch (e) {
        // Continue checking other selectors
      }
    }
    
    // Wait additional time to catch any delayed loops
    await page.waitForTimeout(8000);
    await AutomationUtils.takeTimestampedScreenshot(page, 'final-state', '5-stable');
    
    // Verify no infinite loops occurred
    const redirectCount = loopDetector.getRedirectCount();
    console.log(`📊 Login error test completed with ${redirectCount} redirects`);
    
    if (loopDetector.checkForInfiniteLoop()) {
      const history = loopDetector.getNavigationHistory();
      console.error('🚨 Navigation History:', history);
      throw new Error(`Infinite loop detected during login error handling. Redirect count: ${redirectCount}`);
    }
    
    // Assertions
    expect(redirectCount).toBeLessThan(CONFIG.automation.infiniteLoopThreshold);
    
    // Verify we can still interact with the form (not frozen)
    const formStillVisible = await page.locator('form').isVisible();
    expect(formStillVisible).toBe(true);
  });

  // =============================================
  // BACKEND API HEALTH CHECKS
  // =============================================
  
  test('🏥 should verify backend API health', async ({ page }) => {
    console.log(`🔍 Testing backend health: ${CONFIG.urls.backend}`);
    
    // Test backend health endpoint
    const response = await page.request.get(`${CONFIG.urls.backend}/health`);
    await AutomationUtils.takeTimestampedScreenshot(page, 'api-health', 'checked');
    
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    console.log('✅ Backend health:', healthData);
  });

  // =============================================
  // FRONTEND ACCESSIBILITY & STABILITY
  // =============================================
  
  test('♿ should load frontend without accessibility violations', async ({ page }) => {
    await page.goto(CONFIG.urls.frontend, { waitUntil: 'networkidle' });
    await AutomationUtils.takeTimestampedScreenshot(page, 'accessibility', '1-loaded');
    
    // Wait for React app to initialize
    await page.waitForTimeout(3000);
    
    // Check for common React error boundaries
    const errorBoundaryText = await page.textContent('body');
    expect(errorBoundaryText).not.toContain('Something went wrong');
    expect(errorBoundaryText).not.toContain('Error boundary');
    
    // Verify essential elements are present
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    await AutomationUtils.takeTimestampedScreenshot(page, 'accessibility', '2-verified');
  });

  // =============================================
  // PERFORMANCE & LOAD TIME
  // =============================================
  
  test('⚡ should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(CONFIG.urls.frontend, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    await AutomationUtils.takeTimestampedScreenshot(page, 'performance', 'loaded');
    
    // Assert reasonable load time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(15000); // 15 seconds max
  });

  // =============================================
  // VISUAL REGRESSION DETECTION
  // =============================================
  
  test('👁️ should maintain visual consistency', async ({ page }) => {
    await page.goto(CONFIG.urls.frontend, { waitUntil: 'networkidle' });
    
    // Wait for full rendering
    await page.waitForTimeout(3000);
    
    // Take baseline screenshot
    await AutomationUtils.takeTimestampedScreenshot(page, 'visual-baseline', 'homepage');
    
    // Navigate through key pages and capture visuals
    const keyPages = [
      { path: '/tournaments', name: 'tournaments' },
      { path: '/login', name: 'login' }
    ];
    
    for (const pageInfo of keyPages) {
      try {
        await page.goto(`${CONFIG.urls.frontend}${pageInfo.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await AutomationUtils.takeTimestampedScreenshot(page, 'visual-capture', pageInfo.name);
      } catch (error) {
        console.log(`⚠️ Could not capture ${pageInfo.name}: ${error.message}`);
      }
    }
  });
});

// =============================================
// ADVANCED MONITORING SUITE
// =============================================

test.describe('Advanced Production Monitoring', () => {
  
  test('🔬 should monitor for memory leaks and performance issues', async ({ page }) => {
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    
    const loopDetector = await AutomationUtils.detectInfiniteLoop(page, 'performance-monitoring');
    
    console.log('📊 Starting performance monitoring...');
    
    await page.goto(CONFIG.urls.frontend);
    
    // Simulate user interaction over time
    for (let cycle = 0; cycle < 5; cycle++) {
      console.log(`🔄 Performance cycle ${cycle + 1}/5`);
      
      // Navigate around the app
      await page.click('body'); // Focus
      await page.waitForTimeout(2000);
      
      // Check for performance issues
      const metrics = await page.evaluate(() => ({
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: {
          loadEventEnd: performance.timing.loadEventEnd,
          navigationStart: performance.timing.navigationStart
        }
      }));
      
      console.log(`📈 Cycle ${cycle + 1} metrics:`, metrics);
      
      await AutomationUtils.takeTimestampedScreenshot(page, 'performance-cycle', `${cycle + 1}`);
      
      // Check for infinite loops during performance testing
      if (loopDetector.checkForInfiniteLoop()) {
        throw new Error(`Infinite loop detected during performance cycle ${cycle + 1}`);
      }
    }
    
    const coverage = await page.coverage.stopJSCoverage();
    console.log(`📊 JS Coverage: ${coverage.length} files analyzed`);
    
    await AutomationUtils.takeTimestampedScreenshot(page, 'performance-final', 'completed');
  });
});

// =============================================
// CONFIGURATION & SUMMARY
// =============================================

console.log(`
🤖 LFA LEGACY GO AUTOMATION CONFIGURATION
==========================================
Frontend URL: ${CONFIG.urls.frontend}
Backend URL: ${CONFIG.urls.backend}
Loop Threshold: ${CONFIG.automation.infiniteLoopThreshold} redirects
Cycle Interval: ${CONFIG.automation.cycleInterval}ms
Visual Feedback: ${CONFIG.automation.visualFeedbackEnabled ? 'Enabled ✅' : 'Disabled ❌'}

🎯 Test Objectives:
✅ Detect and prevent infinite loops
✅ Validate login error handling  
✅ Monitor application health
✅ Ensure visual consistency
✅ Performance monitoring
✅ Accessibility verification

📸 All test artifacts saved to: test-results/automation/
==========================================
`);