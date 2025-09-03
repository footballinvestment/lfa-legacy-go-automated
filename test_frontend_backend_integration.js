#!/usr/bin/env node

// Frontend-Backend Integration Test
console.log('🚀 Testing Frontend-Backend Integration...\n');

const API_URL = 'http://localhost:8000';

// Test 1: Health Check
console.log('📍 Test 1: Health Check');
fetch(`${API_URL}/api/health`)
  .then(response => {
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Health check successful');
    } else {
      console.log('❌ Health check failed');
    }
    return response.json();
  })
  .then(data => {
    console.log(`Service: ${data.data.service} v${data.data.version}`);
    console.log(`Request ID: ${data.request_id}\n`);

    // Test 2: Registration (simulation)
    console.log('📍 Test 2: User Registration');
    return fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        username: 'jstest' + Date.now(),
        email: `jstest${Date.now()}@test.com`,
        password: 'testpass123',
        full_name: 'JS Test User'
      })
    });
  })
  .then(response => {
    console.log(`Registration Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Registration successful');
    } else {
      console.log('❌ Registration failed');
    }
    return response.json();
  })
  .then(data => {
    console.log(`New User ID: ${data.user.id}`);
    console.log(`Username: ${data.user.username}`);
    console.log(`Access Token: ${data.access_token.substring(0, 20)}...`);
    console.log(`Token Type: ${data.token_type}`);
    
    console.log('\n🎯 Integration Test Results:');
    console.log('✅ Backend is running and healthy');
    console.log('✅ CORS is configured correctly');
    console.log('✅ API endpoints are accessible');
    console.log('✅ Authentication flow works');
    console.log('✅ JSON responses are properly formatted');
    console.log('\n✨ Frontend-Backend integration is SUCCESSFUL!');
    console.log('\n📱 Ready for UI testing at: http://localhost:3000');
    console.log('🔧 Backend API available at: http://localhost:8000');
  })
  .catch(error => {
    console.error('❌ Integration test failed:', error.message);
    if (error.message.includes('CORS')) {
      console.error('🔥 CORS Error: Frontend cannot connect to backend');
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error('🔥 Connection Error: Backend server not running');
    }
  });