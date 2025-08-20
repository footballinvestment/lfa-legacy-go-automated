#!/usr/bin/env node

// === LFA Legacy GO Authentication Debugging Script ===
// This script tests both registration and login to identify the 401 issue

const API_BASE = 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app';

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: error.message,
      success: false
    };
  }
}

async function testAuthentication() {
  console.log('🔍 === LFA LEGACY GO AUTHENTICATION DEBUG ===\n');
  
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'test123';
  const testEmail = `test_${Date.now()}@example.com`;
  const testFullName = 'Debug Test User';

  // Step 1: Test Registration
  console.log('📝 Step 1: Testing Registration...');
  const registerData = {
    username: testUsername,
    password: testPassword,
    email: testEmail,
    full_name: testFullName
  };

  const registerResult = await makeRequest(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(registerData)
  });

  console.log(`Registration Status: ${registerResult.status} ${registerResult.statusText}`);
  console.log(`Registration Success: ${registerResult.success}`);
  
  if (!registerResult.success) {
    console.log('❌ Registration failed:', registerResult.data);
    return;
  }
  
  console.log('✅ Registration successful');
  console.log(`User ID: ${registerResult.data.user?.id}`);
  console.log(`Access Token: ${registerResult.data.access_token?.substring(0, 20)}...`);
  console.log('');

  // Step 2: Test Login with JSON (current frontend approach)
  console.log('🔐 Step 2: Testing Login with JSON...');
  const loginData = {
    username: testUsername,
    password: testPassword
  };

  const loginResult = await makeRequest(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  });

  console.log(`Login Status: ${loginResult.status} ${loginResult.statusText}`);
  console.log(`Login Success: ${loginResult.success}`);
  
  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.data);
    
    // Try with wrong credentials to verify error handling
    console.log('\n🔍 Step 3: Testing with wrong credentials...');
    const wrongLoginResult = await makeRequest(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUsername,
        password: 'wrongpassword'
      })
    });
    
    console.log(`Wrong credentials status: ${wrongLoginResult.status}`);
    console.log(`Wrong credentials response: ${JSON.stringify(wrongLoginResult.data)}`);
    
  } else {
    console.log('✅ Login successful');
    console.log(`Access Token: ${loginResult.data.access_token?.substring(0, 20)}...`);
    console.log(`User ID: ${loginResult.data.user?.id}`);
  }

  // Step 4: Test OAuth2 FormData (if endpoint exists)
  console.log('\n🔗 Step 4: Testing OAuth2 FormData endpoint...');
  const formData = new URLSearchParams();
  formData.append('username', testUsername);
  formData.append('password', testPassword);

  const tokenResult = await makeRequest(`${API_BASE}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  console.log(`Token endpoint status: ${tokenResult.status} ${tokenResult.statusText}`);
  console.log(`Token endpoint success: ${tokenResult.success}`);
  
  if (tokenResult.success) {
    console.log('✅ OAuth2 FormData login successful');
  } else if (tokenResult.status === 404) {
    console.log('ℹ️ OAuth2 endpoint not deployed yet (expected)');
  } else {
    console.log('❌ OAuth2 FormData login failed:', tokenResult.data);
  }

  // Step 5: Test /me endpoint with token
  if (loginResult.success && loginResult.data.access_token) {
    console.log('\n👤 Step 5: Testing /me endpoint...');
    const meResult = await makeRequest(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.data.access_token}`
      }
    });

    console.log(`/me endpoint status: ${meResult.status} ${meResult.statusText}`);
    console.log(`/me endpoint success: ${meResult.success}`);
    
    if (meResult.success) {
      console.log('✅ Token validation successful');
      console.log(`Username from token: ${meResult.data.username}`);
    } else {
      console.log('❌ Token validation failed:', meResult.data);
    }
  }

  console.log('\n🎯 === SUMMARY ===');
  console.log(`Registration: ${registerResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`JSON Login: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`OAuth2 FormData: ${tokenResult.status === 404 ? 'ℹ️ NOT DEPLOYED' : (tokenResult.success ? '✅ PASS' : '❌ FAIL')}`);
  
  if (registerResult.success && loginResult.success) {
    console.log('\n✅ CONCLUSION: Authentication is working correctly');
    console.log('🔍 If you\'re experiencing 401 errors, check:');
    console.log('   1. Frontend API URL configuration');
    console.log('   2. CORS settings');
    console.log('   3. Network/browser cache');
    console.log('   4. Environment variables');
  } else {
    console.log('\n❌ CONCLUSION: Authentication has issues');
    console.log('🔧 Issues found that need fixing');
  }
}

// Run the test
testAuthentication().catch(console.error);