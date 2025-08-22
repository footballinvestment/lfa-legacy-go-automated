// test-frontend-login.mjs - Test exact frontend login format

import { chromium } from 'playwright';

async function testFrontendLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 TESTING FRONTEND LOGIN WITH EXACT FORMAT...');
  
  // Real credentials that work via API
  const credentials = {
    username: 'realtest',
    password: 'RealPass123!'
  };
  
  try {
    // Intercept network requests to see what frontend sends
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('login')) {
        console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`📝 POST DATA: ${request.postData()}`);
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to site
    await page.goto('https://lfa-legacy-go.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Site loaded, taking screenshot...');
    await page.screenshot({ path: 'frontend-login-1-loaded.png', fullPage: true });
    
    // Try to find the login form by checking different approaches
    
    // Approach 1: Look for login button and click it
    const loginButtonSelectors = [
      'button:has-text("Login")',
      'button:has-text("Sign In")', 
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      '[data-testid="login-button"]'
    ];
    
    let loginButtonFound = false;
    for (const selector of loginButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found login button: ${selector}`);
          await element.click();
          loginButtonFound = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    await page.screenshot({ path: 'frontend-login-2-after-button-click.png', fullPage: true });
    
    // Approach 2: Look for username/password fields directly
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]',
      '#username',
      '#email'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      '#password'
    ];
    
    let usernameField = null;
    let passwordField = null;
    
    // Find username field
    for (const selector of usernameSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found username field: ${selector}`);
          usernameField = element;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Find password field
    for (const selector of passwordSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found password field: ${selector}`);
          passwordField = element;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (usernameField && passwordField) {
      console.log('🎯 Found login form! Attempting to fill...');
      
      // Clear and fill fields
      await usernameField.clear();
      await usernameField.fill(credentials.username);
      console.log(`✅ Username filled: ${credentials.username}`);
      
      await passwordField.clear();
      await passwordField.fill(credentials.password);
      console.log(`✅ Password filled: ${credentials.password}`);
      
      await page.screenshot({ path: 'frontend-login-3-form-filled.png' });
      
      // Find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        'input[type="submit"]',
        'button:near(input[type="password"])'
      ];
      
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Found submit button: ${selector}`);
            await element.click();
            console.log(`🚀 Login form submitted!`);
            submitted = true;
            break;
          }
        } catch (e) {
          console.log(`❌ Submit button not clickable: ${selector}`);
        }
      }
      
      if (submitted) {
        // Wait for response
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'frontend-login-4-after-submit.png', fullPage: true });
        
        // Check current URL and page content
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        const pageContent = await page.locator('body').textContent();
        
        // Check for success indicators
        const successIndicators = [
          'Dashboard',
          'Welcome',
          'Profile',
          'Logout',
          'Tournament',
          'Settings'
        ];
        
        const foundIndicators = successIndicators.filter(indicator => 
          pageContent.includes(indicator) || pageContent.toLowerCase().includes(indicator.toLowerCase())
        );
        
        console.log(`Success indicators found: ${foundIndicators.join(', ')}`);
        
        // Check for error messages
        const errorIndicators = [
          'Invalid',
          'Error',
          'Failed',
          'Wrong',
          'Incorrect'
        ];
        
        const foundErrors = errorIndicators.filter(error => 
          pageContent.includes(error) || pageContent.toLowerCase().includes(error.toLowerCase())
        );
        
        console.log(`Error indicators found: ${foundErrors.join(', ')}`);
        
        if (foundIndicators.length > 0) {
          console.log('🎉 LOGIN APPEARS TO BE SUCCESSFUL!');
        } else if (foundErrors.length > 0) {
          console.log('❌ LOGIN APPEARS TO HAVE FAILED');
        } else {
          console.log('❓ LOGIN STATUS UNCLEAR');
        }
        
      } else {
        console.log('❌ Could not find submit button');
      }
      
    } else {
      console.log('❌ Could not find login form fields');
      console.log(`Username field found: ${usernameField !== null}`);
      console.log(`Password field found: ${passwordField !== null}`);
      
      // Try alternative approach - check for test credentials button
      try {
        const testCredsButton = page.locator('button:has-text("Fill Test Credentials")').first();
        if (await testCredsButton.isVisible()) {
          console.log('🧪 Found "Fill Test Credentials" button, clicking...');
          await testCredsButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'frontend-login-5-test-creds.png' });
        }
      } catch (e) {
        console.log('No test credentials button found');
      }
    }
    
    // Final analysis
    const finalPageContent = await page.locator('body').textContent();
    console.log('\n=== FINAL PAGE ANALYSIS ===');
    console.log(`Page content length: ${finalPageContent.length} chars`);
    console.log(`Contains login elements: ${finalPageContent.includes('Login') || finalPageContent.includes('login')}`);
    console.log(`Contains form elements: ${finalPageContent.includes('Username') || finalPageContent.includes('Password')}`);
    console.log(`Contains error messages: ${finalPageContent.includes('Error') || finalPageContent.includes('Invalid')}`);
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'frontend-login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testFrontendLogin().catch(console.error);