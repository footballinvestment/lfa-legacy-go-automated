// Authentication Cycle Test - Login/Logout/Login again
const { chromium } = require('playwright');

async function testAuthCycle() {
  console.log('🧪 Starting Authentication Cycle Test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to the application
    console.log('📍 Navigating to application...');
    await page.goto('https://lfa-legacy-go.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Register a new user
    console.log('📝 Step 1: Registering new user...');
    await page.click('text=Don\'t have an account? Register');
    
    // Debug: Take screenshot and check page content
    await page.screenshot({ path: 'register-page.png' });
    const pageContent = await page.content();
    console.log('Page contains register form:', pageContent.includes('register') || pageContent.includes('Register'));
    
    // Wait for any input field
    await page.waitForSelector('input', { timeout: 10000 });
    
    const timestamp = Date.now();
    const testUser = `test_${timestamp}`;
    
    // Use MUI TextField approach
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields`);
    
    // Fill inputs in order: username, email, fullName, password
    if (inputs.length >= 4) {
      await inputs[0].fill(testUser); // username
      await inputs[1].fill(`${testUser}@test.com`); // email  
      await inputs[2].fill(`Test User ${timestamp}`); // fullName
      await inputs[3].fill('testpass123'); // password
    } else {
      throw new Error(`Expected 4 inputs, found ${inputs.length}`);
    }
    
    await page.click('button:has-text("Register")');
    
    // Wait for successful registration
    console.log('⏳ Waiting for registration success...');
    try {
      await page.waitForSelector('text=Welcome back', { timeout: 10000 });
      console.log('✅ Registration successful - Dashboard loaded');
    } catch (error) {
      console.log('❌ Registration failed or dashboard not loaded');
      await page.screenshot({ path: 'registration-error.png' });
      throw error;
    }
    
    // Step 2: Logout
    console.log('🚪 Step 2: Logging out...');
    await page.click('button:has-text("Logout")');
    
    // Wait for logout redirect
    await page.waitForTimeout(2000); // Wait for page refresh
    await page.screenshot({ path: 'after-logout.png' });
    
    // Check if we're back at login
    const isLoginPage = await page.locator('button:has-text("Login")').isVisible({ timeout: 3000 });
    if (isLoginPage) {
      console.log('✅ Logout successful - Back to login page');
    } else {
      console.log('⚠️ Logout completed but checking page state...');
      await page.waitForTimeout(3000); // Additional wait for page stabilization
    }
    
    // Step 3: Try to login with the same user
    console.log('🔐 Step 3: Attempting to login with same credentials...');
    
    const loginInputs = await page.$$('input');
    console.log(`Found ${loginInputs.length} login input fields`);
    
    if (loginInputs.length >= 2) {
      await loginInputs[0].fill(testUser); // username
      await loginInputs[1].fill('testpass123'); // password
    } else {
      throw new Error(`Expected 2 login inputs, found ${loginInputs.length}`);
    }
    
    await page.click('button:has-text("Login")');
    
    // Check if login succeeds
    try {
      await page.waitForSelector('text=Welcome back', { timeout: 10000 });
      console.log('✅ LOGIN SUCCESS: User can log back in after logout');
      return { success: true, issue: null };
    } catch (error) {
      console.log('❌ LOGIN FAILED: User cannot log back in after logout');
      
      // Check for error messages
      const errorText = await page.textContent('body');
      console.log('Page content after failed login:', errorText.substring(0, 500));
      
      await page.screenshot({ path: 'login-failure.png' });
      return { 
        success: false, 
        issue: 'User cannot login after logout', 
        error: errorText 
      };
    }
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error);
    await page.screenshot({ path: 'test-error.png' });
    return { success: false, issue: 'Test execution failed', error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthCycle().then(result => {
  console.log('🎯 Test Result:', result);
  process.exit(result.success ? 0 : 1);
});