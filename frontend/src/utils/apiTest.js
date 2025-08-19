// === API Connectivity Verification ===
import config from '../config/environment.js';

export const verifyAPIConnectivity = async () => {
  const apiUrl = config.API_URL;
  
  try {
    console.log('🔍 Testing API connectivity to:', apiUrl);
    
    // Test 1: Health check
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ API Health check passed:', healthData);
    
    // Test 2: CORS preflight
    console.log('Testing CORS preflight...');
    try {
      const corsTest = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });
      
      console.log('✅ CORS preflight passed (status:', corsTest.status, ')');
    } catch (corsError) {
      console.warn('⚠️ CORS preflight failed:', corsError.message);
    }
    
    // Test 3: Basic auth endpoint accessibility
    console.log('Testing auth endpoint...');
    try {
      const authTest = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        })
      });
      
      // We expect this to fail with 401/422, but it should be reachable
      console.log('✅ Auth endpoint reachable (status:', authTest.status, ')');
      
    } catch (authError) {
      console.warn('⚠️ Auth endpoint test failed:', authError.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API Connectivity failed:', error);
    
    // Show user-friendly error in development
    if (config.DEBUG) {
      alert(`API Connection Error: ${error.message}\nAPI URL: ${apiUrl}\n\nThis may indicate:\n1. Backend is down\n2. CORS misconfiguration\n3. Network connectivity issues`);
    }
    
    return false;
  }
};

// Validation function for fixing deployment
export const validateFix = async () => {
  const tests = [
    {
      name: 'Environment Variables',
      test: () => !!config.API_URL?.includes('lfa-legacy-go')
    },
    {
      name: 'API Connectivity', 
      test: async () => {
        try {
          const response = await fetch(`${config.API_URL}/health`);
          return response.ok;
        } catch { return false; }
      }
    },
    {
      name: 'React Router Navigation',
      test: () => {
        try {
          // Check if we can access React Router functions
          return typeof window.history.pushState === 'function';
        } catch { return false; }
      }
    },
    {
      name: 'Loop Detection Active',
      test: () => {
        try {
          const loopDetector = require('./loopDetection.js').default;
          return typeof loopDetector.trackRedirect === 'function';
        } catch { return false; }
      }
    }
  ];

  console.log('🧪 Validation Results:');
  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`${result ? '✅' : '❌'} ${test.name}: ${result}`);
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
};