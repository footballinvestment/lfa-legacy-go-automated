// Test EXISTING user login - NOT creating new user every time
const { chromium } = require('playwright');

async function testExistingUserLogin() {
  console.log('🧪 Testing EXISTING USER LOGIN...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to the application
    console.log('📍 Navigating to application...');
    await page.goto('https://lfa-legacy-go.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page-start.png' });
    
    // Test with known existing users
    const testUsers = [
      { username: 'tesztelek77', password: 'test123' },
      { username: 'p3t1k3', password: 'test123' },
      { username: 'newuser', password: 'test123' }
    ];
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n🔐 Test ${i+1}: Trying to login with EXISTING user: ${user.username}`);
      
      // Clear any existing input values
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait for login form
      await page.waitForSelector('input', { timeout: 10000 });
      
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input fields`);
      
      if (inputs.length >= 2) {
        // Clear and fill username
        await inputs[0].click({ clickCount: 3 }); // Select all
        await inputs[0].fill(user.username);
        
        // Clear and fill password  
        await inputs[1].click({ clickCount: 3 }); // Select all
        await inputs[1].fill(user.password);
        
        console.log(`Attempting login with: ${user.username} / ${user.password}`);
        
        // Take screenshot before login attempt
        await page.screenshot({ path: `before-login-${user.username}.png` });
        
        // Click login button
        await page.click('button:has-text("Login")');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check if login was successful
        const isDashboard = await page.locator('text=Welcome back').isVisible({ timeout: 2000 }).catch(() => false);
        const isStillLogin = await page.locator('button:has-text("Login")').isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isDashboard) {
          console.log(`✅ SUCCESS: ${user.username} logged in successfully!`);
          await page.screenshot({ path: `success-${user.username}.png` });
          return { success: true, user: user.username };
        } else if (isStillLogin) {
          console.log(`❌ FAILED: ${user.username} - still on login page`);
          await page.screenshot({ path: `failed-${user.username}.png` });
          
          // Check for error messages
          const pageText = await page.textContent('body');
          if (pageText.includes('Incorrect')) {
            console.log(`   Error: Incorrect username or password`);
          }
        } else {
          console.log(`⚠️  UNKNOWN: ${user.username} - uncertain page state`);
          await page.screenshot({ path: `unknown-${user.username}.png` });
        }
      } else {
        console.log(`❌ ERROR: Expected 2 inputs, found ${inputs.length}`);
      }
    }
    
    console.log('\n❌ ALL EXISTING USERS FAILED TO LOGIN');
    return { success: false, issue: 'No existing users could login' };
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error);
    await page.screenshot({ path: 'test-error.png' });
    return { success: false, issue: 'Test execution failed', error: error.message };
  } finally {
    await browser.close();
  }
}

// Also test with a FRESH REGISTRATION to see if new users work
async function testFreshRegistrationAndLogin() {
  console.log('\n🆕 Testing FRESH REGISTRATION and immediate login...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://lfa-legacy-go.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Go to register
    await page.click('text=Don\'t have an account? Register');
    await page.waitForSelector('input', { timeout: 10000 });
    
    const timestamp = Date.now();
    const testUser = `freshuser_${timestamp}`;
    
    const inputs = await page.$$('input');
    if (inputs.length >= 4) {
      await inputs[0].fill(testUser);
      await inputs[1].fill(`${testUser}@test.com`);
      await inputs[2].fill(`Fresh User ${timestamp}`);
      await inputs[3].fill('freshpass123');
      
      console.log(`Creating fresh user: ${testUser}`);
      await page.click('button:has-text("Register")');
      
      // Wait for registration
      await page.waitForTimeout(3000);
      
      const isDashboard = await page.locator('text=Welcome back').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isDashboard) {
        console.log('✅ Fresh registration successful - user is logged in');
        
        // Now test logout and re-login with the SAME fresh user
        console.log('🚪 Testing logout and re-login with fresh user...');
        await page.click('button:has-text("Logout")');
        await page.waitForTimeout(3000);
        
        // Try to login again with the same fresh user
        const loginInputs = await page.$$('input');
        if (loginInputs.length >= 2) {
          await loginInputs[0].fill(testUser);
          await loginInputs[1].fill('freshpass123');
          
          console.log(`Re-login attempt with fresh user: ${testUser}`);
          await page.click('button:has-text("Login")');
          await page.waitForTimeout(3000);
          
          const isBackInDashboard = await page.locator('text=Welcome back').isVisible({ timeout: 5000 }).catch(() => false);
          
          if (isBackInDashboard) {
            console.log('✅ FRESH USER RE-LOGIN SUCCESS!');
            return { success: true, freshUser: testUser, reloginWorks: true };
          } else {
            console.log('❌ FRESH USER RE-LOGIN FAILED!');
            await page.screenshot({ path: 'fresh-user-relogin-failed.png' });
            return { success: false, freshUser: testUser, reloginWorks: false };
          }
        }
      } else {
        console.log('❌ Fresh registration failed');
        return { success: false, issue: 'Fresh registration failed' };
      }
    }
    
  } catch (error) {
    console.error('🚨 Fresh user test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run both tests
async function runAllTests() {
  console.log('🧪 COMPREHENSIVE LOGIN TEST SUITE\n');
  
  // Test 1: Existing users
  const existingUserResult = await testExistingUserLogin();
  console.log('\n📊 Existing User Test Result:', existingUserResult);
  
  // Test 2: Fresh user registration and re-login
  const freshUserResult = await testFreshRegistrationAndLogin();
  console.log('\n📊 Fresh User Test Result:', freshUserResult);
  
  // Final analysis
  console.log('\n🎯 FINAL ANALYSIS:');
  if (existingUserResult.success) {
    console.log('✅ EXISTING users CAN login');
  } else {
    console.log('❌ EXISTING users CANNOT login');
  }
  
  if (freshUserResult.success && freshUserResult.reloginWorks) {
    console.log('✅ FRESH users CAN register and re-login');
  } else if (freshUserResult.success && !freshUserResult.reloginWorks) {
    console.log('⚠️  FRESH users can register but CANNOT re-login');
  } else {
    console.log('❌ FRESH users have registration issues');
  }
}

runAllTests().then(() => {
  console.log('\n🏁 All tests completed!');
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});