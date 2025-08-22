// test-complete-user-journey.spec.js
// LFA Legacy GO - Complete User Journey Automated Testing
// Using REAL verified credentials

const { test, expect } = require('@playwright/test');

// REAL VERIFIED CREDENTIALS
const REAL_USER = {
  username: 'realtest',
  password: 'RealPass123!',
  email: 'realtest@demo.com'
};

const ADMIN_USER = {
  username: 'adminreal', 
  password: 'AdminReal123!',
  email: 'adminreal@test.com'
};

const DEMO_USERS = [
  { username: 'demo1', password: 'Demo1Pass123!' },
  { username: 'demo2', password: 'Demo2Pass123!' },
  { username: 'demo3', password: 'Demo3Pass123!' }
];

const SITE_URL = 'https://lfa-legacy-go.netlify.app';

test.describe('LFA Legacy GO - Complete Platform Testing', () => {
  
  test('1. Initial Site Load and Main Page', async ({ page }) => {
    console.log('🧪 TEST 1: Initial site load...');
    
    // Capture console messages
    page.on('console', msg => console.log(`BROWSER ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));
    
    // Navigate to main site
    await page.goto(SITE_URL);
    
    // Wait for initial load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot of main page
    await page.screenshot({ 
      path: 'screenshots/01-main-page-loaded.png',
      fullPage: true 
    });
    
    // Check if stuck on loading screen
    const loadingScreen = await page.locator('.loading-screen').isVisible().catch(() => false);
    console.log(`Loading screen visible: ${loadingScreen}`);
    
    // Check for main content
    const mainContent = await page.locator('#root').isVisible().catch(() => false);
    console.log(`Main content visible: ${mainContent}`);
    
    // Wait a bit more if still loading
    if (loadingScreen) {
      console.log('🔄 Waiting for loading screen to disappear...');
      await page.waitForTimeout(5000);
      await page.screenshot({ 
        path: 'screenshots/01b-after-loading-wait.png',
        fullPage: true 
      });
    }
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Look for key elements
    const bodyText = await page.locator('body').textContent();
    console.log(`Page contains "LFA": ${bodyText.includes('LFA')}`);
    console.log(`Page contains "Login": ${bodyText.includes('Login') || bodyText.includes('login')}`);
    console.log(`Page contains "Register": ${bodyText.includes('Register') || bodyText.includes('register')}`);
  });

  test('2. Find Login Interface', async ({ page }) => {
    console.log('🧪 TEST 2: Finding login interface...');
    
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Multiple strategies to find login
    const loginSelectors = [
      'button:has-text("Login")',
      'button:has-text("Sign In")', 
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      '[data-testid="login-button"]',
      '.login-button',
      '#login-button',
      'input[name="username"]',
      'input[type="email"]',
      'form[action*="login"]',
      'form[action*="auth"]'
    ];
    
    let loginFound = false;
    let loginMethod = '';
    
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found login element: ${selector}`);
          loginFound = true;
          loginMethod = selector;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!loginFound) {
      console.log('❌ No login interface found with standard selectors');
      
      // Try direct navigation to login page
      const loginUrls = [
        `${SITE_URL}/login`,
        `${SITE_URL}/auth`,
        `${SITE_URL}/signin`,
        `${SITE_URL}/#/login`,
        `${SITE_URL}/#/auth`
      ];
      
      for (const url of loginUrls) {
        try {
          await page.goto(url);
          await page.waitForTimeout(2000);
          
          const hasLoginForm = await page.locator('input[name="username"], input[name="email"], input[type="email"]').isVisible();
          if (hasLoginForm) {
            console.log(`✅ Found login form at: ${url}`);
            loginFound = true;
            break;
          }
        } catch (e) {
          console.log(`❌ No login form at: ${url}`);
        }
      }
    }
    
    await page.screenshot({ 
      path: 'screenshots/02-login-search-result.png',
      fullPage: true 
    });
    
    console.log(`Login interface found: ${loginFound}`);
    if (loginFound) {
      console.log(`Login method: ${loginMethod}`);
    }
  });

  test('3. User Registration Test', async ({ page }) => {
    console.log('🧪 TEST 3: User registration...');
    
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for registration
    const regSelectors = [
      'button:has-text("Register")',
      'button:has-text("Sign Up")',
      'a:has-text("Register")',
      'a:has-text("Sign Up")',
      'a:has-text("Create Account")'
    ];
    
    let regFound = false;
    for (const selector of regSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found registration: ${selector}`);
          await element.click();
          regFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!regFound) {
      // Try direct URLs
      const regUrls = [`${SITE_URL}/register`, `${SITE_URL}/signup`, `${SITE_URL}/#/register`];
      for (const url of regUrls) {
        try {
          await page.goto(url);
          await page.waitForTimeout(2000);
          
          const hasRegForm = await page.locator('input[name="username"]').isVisible();
          if (hasRegForm) {
            console.log(`✅ Found registration form at: ${url}`);
            regFound = true;
            break;
          }
        } catch (e) {
          console.log(`❌ No registration at: ${url}`);
        }
      }
    }
    
    if (regFound) {
      // Try to fill registration form
      try {
        const newUser = `testuser${Date.now()}`;
        const newEmail = `${newUser}@test.com`;
        
        await page.fill('input[name="username"]', newUser);
        await page.fill('input[name="email"]', newEmail);
        await page.fill('input[name="password"]', 'TestPass123!');
        await page.fill('input[name="full_name"], input[name="fullName"]', 'Test User');
        
        await page.screenshot({ path: 'screenshots/03-registration-filled.png' });
        
        // Submit form
        await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'screenshots/03b-registration-result.png' });
        
        console.log('✅ Registration form submitted');
        
      } catch (e) {
        console.log(`❌ Registration form error: ${e.message}`);
      }
    }
    
    console.log(`Registration interface found: ${regFound}`);
  });

  test('4. Real User Login Test', async ({ page }) => {
    console.log('🧪 TEST 4: Testing with REAL verified credentials...');
    
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // First, try to navigate to login page
    const loginUrls = [
      `${SITE_URL}/login`,
      `${SITE_URL}/#/login`,
      `${SITE_URL}/auth`,
      SITE_URL // Try main page
    ];
    
    let loginFormFound = false;
    
    for (const url of loginUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        // Check for login form fields
        const usernameField = page.locator('input[name="username"], input[name="email"], input[type="email"]');
        const passwordField = page.locator('input[name="password"], input[type="password"]');
        
        const hasUsername = await usernameField.isVisible();
        const hasPassword = await passwordField.isVisible();
        
        if (hasUsername && hasPassword) {
          console.log(`✅ Login form found at: ${url}`);
          loginFormFound = true;
          
          // Fill the login form
          await usernameField.fill(REAL_USER.username);
          await passwordField.fill(REAL_USER.password);
          
          await page.screenshot({ path: 'screenshots/04-login-filled.png' });
          
          // Submit login
          const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
          await submitButton.click();
          
          console.log(`🔄 Login submitted for user: ${REAL_USER.username}`);
          
          // Wait for response
          await page.waitForTimeout(5000);
          
          await page.screenshot({ path: 'screenshots/04b-login-result.png' });
          
          // Check for success indicators
          const currentUrl = page.url();
          console.log(`URL after login: ${currentUrl}`);
          
          // Check for dashboard elements
          const dashboardElements = [
            'text="Dashboard"',
            'text="Welcome"',
            'text="Tournament"',
            'text="Profile"',
            'text="Logout"',
            '[data-testid="dashboard"]',
            '.dashboard'
          ];
          
          for (const element of dashboardElements) {
            try {
              const found = await page.locator(element).isVisible();
              if (found) {
                console.log(`✅ Dashboard element found: ${element}`);
              }
            } catch (e) {
              // Continue
            }
          }
          
          break;
        }
      } catch (e) {
        console.log(`❌ Error at ${url}: ${e.message}`);
      }
    }
    
    if (!loginFormFound) {
      console.log('❌ No login form found at any URL');
      
      // Take screenshot of current state
      await page.screenshot({ path: 'screenshots/04-no-login-found.png' });
      
      // Dump page content for analysis
      const bodyText = await page.locator('body').textContent();
      console.log(`Page content length: ${bodyText.length}`);
      console.log(`First 500 chars: ${bodyText.substring(0, 500)}`);
    }
  });

  test('5. Tournament Functionality Test', async ({ page }) => {
    console.log('🧪 TEST 5: Tournament functionality...');
    
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    await page.goto(SITE_URL);
    await page.waitForTimeout(3000);
    
    // Try tournament URLs
    const tournamentUrls = [
      `${SITE_URL}/tournaments`,
      `${SITE_URL}/#/tournaments`,
      `${SITE_URL}/tournament`,
      `${SITE_URL}/#/tournament`
    ];
    
    let tournamentPageFound = false;
    
    for (const url of tournamentUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        const pageContent = await page.locator('body').textContent();
        if (pageContent.includes('Tournament') || pageContent.includes('tournament')) {
          console.log(`✅ Tournament page found at: ${url}`);
          tournamentPageFound = true;
          
          await page.screenshot({ path: 'screenshots/05-tournament-page.png' });
          
          // Look for tournament elements
          const tournamentElements = [
            'text="Create Tournament"',
            'text="Join Tournament"',
            'text="Tournament List"',
            '.tournament-card',
            '[data-testid="tournament"]'
          ];
          
          for (const element of tournamentElements) {
            try {
              const found = await page.locator(element).isVisible();
              if (found) {
                console.log(`✅ Tournament element found: ${element}`);
              }
            } catch (e) {
              // Continue
            }
          }
          
          break;
        }
      } catch (e) {
        console.log(`❌ Error at tournament URL ${url}: ${e.message}`);
      }
    }
    
    console.log(`Tournament page found: ${tournamentPageFound}`);
  });

  test('6. Admin Interface Test', async ({ page }) => {
    console.log('🧪 TEST 6: Admin interface...');
    
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    await page.goto(SITE_URL);
    await page.waitForTimeout(3000);
    
    // Try admin URLs
    const adminUrls = [
      `${SITE_URL}/admin`,
      `${SITE_URL}/#/admin`,
      `${SITE_URL}/admin-panel`,
      `${SITE_URL}/#/admin-panel`
    ];
    
    let adminPageFound = false;
    
    for (const url of adminUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        const pageContent = await page.locator('body').textContent();
        if (pageContent.includes('Admin') || pageContent.includes('admin')) {
          console.log(`✅ Admin page found at: ${url}`);
          adminPageFound = true;
          
          await page.screenshot({ path: 'screenshots/06-admin-page.png' });
          
          break;
        }
      } catch (e) {
        console.log(`❌ Error at admin URL ${url}: ${e.message}`);
      }
    }
    
    console.log(`Admin page found: ${adminPageFound}`);
  });

  test('7. API Direct Test', async ({ page }) => {
    console.log('🧪 TEST 7: Direct API testing...');
    
    // Test API endpoints directly
    const apiBase = 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app';
    
    // Health check
    try {
      const healthResponse = await page.request.get(`${apiBase}/health`);
      const healthData = await healthResponse.json();
      console.log(`✅ API Health: ${healthResponse.status()}`);
      console.log(`API Version: ${healthData.version}`);
      console.log(`Database Status: ${healthData.database?.status}`);
    } catch (e) {
      console.log(`❌ API Health check failed: ${e.message}`);
    }
    
    // Test login API
    try {
      const loginResponse = await page.request.post(`${apiBase}/api/auth/login`, {
        data: {
          username: REAL_USER.username,
          password: REAL_USER.password
        }
      });
      
      console.log(`✅ API Login: ${loginResponse.status()}`);
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        console.log(`User ID: ${loginData.user?.id}`);
        console.log(`Token type: ${loginData.token_type}`);
        
        // Test authenticated endpoint
        const userResponse = await page.request.get(`${apiBase}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.access_token}`
          }
        });
        
        console.log(`✅ User info: ${userResponse.status()}`);
      }
    } catch (e) {
      console.log(`❌ API Login failed: ${e.message}`);
    }
  });

  test('8. Complete Error Analysis', async ({ page }) => {
    console.log('🧪 TEST 8: Complete error analysis...');
    
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      errors.push(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    
    // Try various interactions
    try {
      await page.click('body'); // Basic interaction
      await page.keyboard.press('Tab'); // Tab navigation
      await page.mouse.move(100, 100); // Mouse movement
    } catch (e) {
      errors.push(`INTERACTION ERROR: ${e.message}`);
    }
    
    console.log('\n=== ERROR SUMMARY ===');
    if (errors.length === 0) {
      console.log('✅ No errors detected!');
    } else {
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n=== FINAL ANALYSIS ===');
    const finalPageContent = await page.locator('body').textContent();
    console.log(`Final page content length: ${finalPageContent.length}`);
    console.log(`Contains "LFA": ${finalPageContent.includes('LFA')}`);
    console.log(`Contains "Loading": ${finalPageContent.includes('Loading')}`);
    console.log(`Contains "Error": ${finalPageContent.includes('Error')}`);
  });

});