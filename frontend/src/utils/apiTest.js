// API connectivity verification utility
// LFA Legacy GO - API Test Helper

import config from '../config/environment';

const API_BASE_URL = config.API_URL;

/**
 * Verifies API connectivity by checking the health endpoint
 * @returns {Promise<boolean>} True if API is accessible, false otherwise
 */
export const verifyAPIConnectivity = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy' || data.status === 'ok';
    }
    
    return false;
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('API connectivity check failed:', error.message);
    }
    return false;
  }
};

export default verifyAPIConnectivity;