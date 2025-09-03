export class TokenManager {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static isRefreshing = false;
  private static refreshPromise: Promise<any> | null = null;

  static getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Calculate expiration time
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('token_expires_at', expirationTime.toString());
    
    // Schedule auto-refresh 5 minutes before expiry
    this.scheduleAutoRefresh(expiresIn);
  }

  static clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  static isTokenExpired(): boolean {
    const expirationTime = localStorage.getItem('token_expires_at');
    if (!expirationTime) return true;
    
    return Date.now() >= parseInt(expirationTime);
  }

  static isTokenExpiringSoon(minutesBeforeExpiry: number = 5): boolean {
    const expirationTime = localStorage.getItem('token_expires_at');
    if (!expirationTime) return true;
    
    const timeUntilExpiry = parseInt(expirationTime) - Date.now();
    const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);
    
    return minutesUntilExpiry <= minutesBeforeExpiry;
  }

  static scheduleAutoRefresh(expiresIn: number) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh 5 minutes before expiry
    const refreshTime = Math.max((expiresIn - 300) * 1000, 60000); // At least 1 minute
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        // Redirect to login on refresh failure
        this.clearTokens();
        window.location.href = '/login';
      }
    }, refreshTime);
  }

  static async refreshAccessToken(): Promise<any> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  private static async performTokenRefresh(): Promise<any> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Refresh token expired');
      }
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (data.success) {
      const tokenData = data.data;
      this.setTokens(
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in
      );
      
      console.log('✅ Access token refreshed successfully');
      return tokenData;
    } else {
      throw new Error(data.error?.message || 'Token refresh failed');
    }
  }

  static async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    // If token is expiring soon, refresh it
    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshAccessToken();
        return this.getAccessToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    }

    return accessToken;
  }

  static initializeFromStorage() {
    const expirationTime = localStorage.getItem('token_expires_at');
    
    if (expirationTime && !this.isTokenExpired()) {
      const remainingTime = parseInt(expirationTime) - Date.now();
      const remainingSeconds = Math.floor(remainingTime / 1000);
      
      if (remainingSeconds > 300) { // More than 5 minutes remaining
        this.scheduleAutoRefresh(remainingSeconds);
      } else {
        // Token expires soon, refresh immediately
        this.refreshAccessToken().catch(error => {
          console.error('Initial token refresh failed:', error);
          this.clearTokens();
        });
      }
    }
  }
}