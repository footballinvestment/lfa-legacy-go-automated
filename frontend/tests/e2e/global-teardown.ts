import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for LFA Legacy GO E2E tests...');
  
  // Add any cleanup logic here if needed
  // For example: cleanup test data, reset database state, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;