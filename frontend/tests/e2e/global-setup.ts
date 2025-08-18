import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for LFA Legacy GO E2E tests...');
  
  // Wait for both frontend and backend to be ready
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check frontend health
    console.log('🌐 Checking frontend health...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Frontend is ready');
    
    // Check backend health
    console.log('🌐 Checking backend health...');
    const backendResponse = await page.request.get('http://localhost:8000/api/health');
    if (backendResponse.ok()) {
      console.log('✅ Backend is ready');
    } else {
      throw new Error('Backend health check failed');
    }
    
    // Create test user account if needed
    console.log('👤 Setting up test user...');
    try {
      const loginResponse = await page.request.post('http://localhost:8000/api/auth/login', {
        data: {
          username: 'testuser',
          password: 'testpass123'
        }
      });
      
      if (loginResponse.ok()) {
        console.log('✅ Test user exists and can login');
      } else {
        console.log('⚠️ Test user login failed - user may need to be created');
      }
    } catch (error) {
      console.log('⚠️ Test user setup error:', error);
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Global setup completed successfully!');
}

export default globalSetup;