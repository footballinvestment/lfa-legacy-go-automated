// =============================================
// LFA LEGACY GO - PLAYWRIGHT GLOBAL SETUP
// =============================================

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 LFA Legacy GO Automation - Global Setup Starting...');
  
  // Log configuration
  console.log('📋 Configuration:');
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'https://lfa-legacy-go.netlify.app'}`);
  console.log(`   Backend URL: ${process.env.BACKEND_URL || 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'test'}`);
  console.log(`   CI Mode: ${process.env.CI ? 'Yes' : 'No'}`);
  
  // Optional: Perform global health checks before tests
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Quick connectivity test
    const frontendUrl = process.env.FRONTEND_URL || 'https://lfa-legacy-go.netlify.app';
    console.log(`🔍 Pre-flight check: ${frontendUrl}`);
    
    const response = await page.goto(frontendUrl, { timeout: 30000 });
    if (response.status() !== 200) {
      console.warn(`⚠️ Frontend returned status: ${response.status()}`);
    } else {
      console.log('✅ Frontend accessibility confirmed');
    }
    
    await browser.close();
  } catch (error) {
    console.warn(`⚠️ Pre-flight check failed: ${error.message}`);
    // Don't fail setup - let individual tests handle connectivity issues
  }
  
  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;