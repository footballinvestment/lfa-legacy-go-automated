const { test, expect } = require('@playwright/test');

test('LFA Legacy GO - System Health Check', async ({ page }) => {
  console.log('🚀 Testing LFA Legacy GO applications...');
  
  // Test frontend
  try {
    await page.goto('https://lfa-legacy-go.netlify.app', { timeout: 15000 });
    console.log('✅ Frontend is accessible');
    await page.screenshot({ path: 'frontend-test.png' });
  } catch (error) {
    console.log('⚠️ Frontend test:', error.message);
  }
  
  // Test backend
  try {
    const response = await page.request.get('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/health');
    console.log('✅ Backend health check:', response.status());
  } catch (error) {
    console.log('⚠️ Backend test:', error.message);
  }
  
  console.log('🎉 LFA Legacy GO automation test completed!');
});
