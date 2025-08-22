// simple-test.js - Direct Playwright test without config conflicts

import { chromium } from 'playwright';

async function testLFALegacyGO() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 STARTING LFA LEGACY GO REAL TEST...');
  
  // Real credentials
  const REAL_USER = {
    username: 'realtest',
    password: 'RealPass123!'
  };
  
  try {
    // Test 1: Navigate to site
    console.log('\n1️⃣ Testing site load...');
    await page.goto('https://lfa-legacy-go.netlify.app');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test1-main-page.png', fullPage: true });
    
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    // Check for loading screen
    const loadingVisible = await page.locator('.loading-screen').isVisible().catch(() => false);
    console.log(`Loading screen visible: ${loadingVisible}`);
    
    if (loadingVisible) {
      console.log('⏳ Waiting for loading screen to disappear...');
      await page.waitForTimeout(5000);
    }
    
    // Test 2: Look for login interface
    console.log('\n2️⃣ Searching for login interface...');
    
    const loginSelectors = [
      'button:has-text("Login")',
      'a:has-text("Login")',
      'input[name="username"]',
      'input[name="email"]',
      '[data-testid="login"]'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible();
        if (isVisible) {
          console.log(`✅ Found login element: ${selector}`);
          loginFound = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (!loginFound) {
      console.log('❌ No login interface found on main page');
      
      // Try direct login URLs
      const loginUrls = [
        'https://lfa-legacy-go.netlify.app/login',
        'https://lfa-legacy-go.netlify.app/#/login',
        'https://lfa-legacy-go.netlify.app/auth'
      ];
      
      for (const url of loginUrls) {
        try {
          console.log(`🔍 Trying login URL: ${url}`);
          await page.goto(url);
          await page.waitForTimeout(2000);
          
          const hasLoginForm = await page.locator('input[name="username"], input[name="email"]').isVisible();
          if (hasLoginForm) {
            console.log(`✅ Found login form at: ${url}`);
            loginFound = true;
            break;
          } else {
            console.log(`❌ No login form at: ${url}`);
          }
        } catch (e) {
          console.log(`❌ Error accessing ${url}: ${e.message}`);
        }
      }
    }
    
    await page.screenshot({ path: 'test2-login-search.png', fullPage: true });
    
    // Test 3: API Health Check
    console.log('\n3️⃣ Testing API health...');
    
    try {
      const healthResponse = await page.request.get('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/health');
      const healthData = await healthResponse.json();
      console.log(`✅ API Health: ${healthResponse.status()}`);
      console.log(`API Version: ${healthData.version}`);
      console.log(`Database Status: ${healthData.database?.status}`);
      console.log(`Active Routers: ${healthData.routers?.active}/${healthData.routers?.total}`);
    } catch (e) {
      console.log(`❌ API Health check failed: ${e.message}`);
    }
    
    // Test 4: API Login with real credentials
    console.log('\n4️⃣ Testing API login with real credentials...');
    
    try {
      const loginResponse = await page.request.post('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/login', {
        data: {
          username: REAL_USER.username,
          password: REAL_USER.password
        }
      });
      
      console.log(`✅ API Login: ${loginResponse.status()}`);
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        console.log(`✅ Login successful for user: ${loginData.user?.username}`);
        console.log(`User ID: ${loginData.user?.id}`);
        console.log(`Credits: ${loginData.user?.credits}`);
        console.log(`Token type: ${loginData.token_type}`);
        
        // Test authenticated endpoint
        const userResponse = await page.request.get('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${loginData.access_token}`
          }
        });
        
        console.log(`✅ User info endpoint: ${userResponse.status()}`);
        
        // Test tournaments endpoint
        const tournamentResponse = await page.request.get('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/tournaments/', {
          headers: {
            'Authorization': `Bearer ${loginData.access_token}`
          }
        });
        
        console.log(`✅ Tournaments endpoint: ${tournamentResponse.status()}`);
        
        if (tournamentResponse.ok()) {
          const tournaments = await tournamentResponse.json();
          console.log(`Found ${tournaments.length} tournaments`);
        }
        
      } else {
        const errorData = await loginResponse.json();
        console.log(`❌ API Login failed: ${errorData.detail}`);
      }
    } catch (e) {
      console.log(`❌ API Login error: ${e.message}`);
    }
    
    // Test 5: Frontend login attempt (if form found)
    if (loginFound) {
      console.log('\n5️⃣ Testing frontend login...');
      
      try {
        // Fill login form
        const usernameField = page.locator('input[name="username"], input[name="email"]').first();
        const passwordField = page.locator('input[name="password"]').first();
        
        await usernameField.fill(REAL_USER.username);
        await passwordField.fill(REAL_USER.password);
        
        await page.screenshot({ path: 'test5-login-filled.png' });
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
        await submitButton.click();
        
        console.log(`🔄 Login form submitted`);
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'test5-login-result.png' });
        
        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);
        
        // Check for dashboard indicators
        const pageContent = await page.locator('body').textContent();
        const hasDashboard = pageContent.includes('Dashboard') || pageContent.includes('Welcome');
        const hasLogout = pageContent.includes('Logout') || pageContent.includes('logout');
        
        console.log(`Dashboard indicators: ${hasDashboard}`);
        console.log(`Logout option: ${hasLogout}`);
        
      } catch (e) {
        console.log(`❌ Frontend login error: ${e.message}`);
      }
    }
    
    // Test 6: Page content analysis
    console.log('\n6️⃣ Analyzing page content...');
    
    const bodyText = await page.locator('body').textContent();
    console.log(`Page content length: ${bodyText.length} characters`);
    console.log(`Contains "LFA": ${bodyText.includes('LFA')}`);
    console.log(`Contains "Login": ${bodyText.includes('Login') || bodyText.includes('login')}`);
    console.log(`Contains "Tournament": ${bodyText.includes('Tournament') || bodyText.includes('tournament')}`);
    console.log(`Contains "Error": ${bodyText.includes('Error') || bodyText.includes('error')}`);
    console.log(`Contains "Loading": ${bodyText.includes('Loading') || bodyText.includes('loading')}`);
    
    await page.screenshot({ path: 'test6-final-state.png', fullPage: true });
    
    console.log('\n✅ Test completed! Check screenshots for visual confirmation.');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testLFALegacyGO().catch(console.error);