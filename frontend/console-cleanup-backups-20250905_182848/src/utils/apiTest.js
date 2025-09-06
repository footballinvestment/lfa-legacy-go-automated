// API connectivity verification utility
// LFA Legacy GO - API Test Helper

import config from '../config/environment';

const API_BASE_URL = config.API_URL;

/**
 * Verifies API connectivity by checking the health endpoint
 * @returns {Promise<boolean>} True if API is accessible, false otherwise
 */
export const verifyAPIConnectivity = async () => {
  const apiUrl = API_BASE_URL || 'http://localhost:8000';
  
  // Try multiple possible health endpoints
  const healthEndpoints = ['/health', '/api/health', '/status', '/api/status'];
  
  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API connectivity established via ${endpoint}`);
        }
        return true;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Health check failed for ${endpoint}:`, error.message);
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ All health endpoints failed');
  }
  return false;
};

export default verifyAPIConnectivity;