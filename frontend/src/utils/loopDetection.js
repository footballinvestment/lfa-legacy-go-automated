// === Loop Detection & Circuit Breaker ===
class InfiniteLoopDetector {
  constructor() {
    this.redirectCount = 0;
    this.redirectHistory = [];
    this.startTime = Date.now();
    this.isCircuitBreakerActive = false;
  }

  trackRedirect(url) {
    if (this.isCircuitBreakerActive) {
      console.warn('🚨 Circuit breaker active - navigation blocked');
      return false;
    }

    this.redirectCount++;
    this.redirectHistory.push({
      url,
      timestamp: Date.now(),
      count: this.redirectCount
    });

    console.log(`🔄 Navigation #${this.redirectCount}: ${url}`);

    // Circuit breaker logic
    if (this.redirectCount > 15) {
      this.emergencyStop();
      return false;
    }

    // Pattern detection - check for ping-pong between login/dashboard
    const recentUrls = this.redirectHistory.slice(-6).map(h => h.url);
    const uniqueUrls = new Set(recentUrls);
    
    if (uniqueUrls.size <= 2 && this.redirectCount > 8) {
      this.emergencyStop();
      return false;
    }

    // Time-based detection - too many redirects in short time
    const timeWindow = 10000; // 10 seconds
    const recentRedirects = this.redirectHistory.filter(
      h => Date.now() - h.timestamp < timeWindow
    );
    
    if (recentRedirects.length > 10) {
      this.emergencyStop();
      return false;
    }

    return true;
  }

  emergencyStop() {
    console.error('🚨 INFINITE LOOP DETECTED - EMERGENCY STOP');
    console.table(this.redirectHistory.slice(-10));
    
    this.isCircuitBreakerActive = true;
    
    // Store emergency state but DON'T clear localStorage immediately
    localStorage.setItem('LFA_EMERGENCY_STOP', 'true');
    localStorage.setItem('LFA_LOOP_HISTORY', JSON.stringify({
      redirectHistory: this.redirectHistory.slice(-10),
      timestamp: Date.now(),
      count: this.redirectCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    }));
    
    // 🚨 CRITICAL FIX: DON'T use window.location.href - it causes hard refresh!
    // Instead, let the emergency stop mechanism handle it
    console.error('🛑 Emergency stop activated - refresh loop prevention engaged');
    
    // Force emergency stop activation
    localStorage.setItem('LFA_REFRESH_COUNT', '10');
    
    // Show immediate feedback without refresh
    if (document.body) {
      const emergencyDiv = document.createElement('div');
      emergencyDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(255, 107, 107, 0.95); color: white; 
                    display: flex; align-items: center; justify-content: center; 
                    z-index: 999999; font-family: Arial;">
          <div style="text-align: center; padding: 20px;">
            <h1>🛑 NAVIGATION LOOP DETECTED</h1>
            <p>Emergency stop activated to prevent browser freeze</p>
            <p>Redirects detected: ${this.redirectCount}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; 
                    background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
              🔄 Reload Page Safely
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(emergencyDiv);
    }
  }

  reset() {
    this.redirectCount = 0;
    this.redirectHistory = [];
    this.isCircuitBreakerActive = false;
    this.startTime = Date.now();
    console.log('✅ Loop detector reset');
  }

  getStatus() {
    return {
      redirectCount: this.redirectCount,
      isActive: this.isCircuitBreakerActive,
      recentHistory: this.redirectHistory.slice(-5)
    };
  }
}

const loopDetector = new InfiniteLoopDetector();

// Check for emergency state on page load
window.addEventListener('load', () => {
  const emergencyState = sessionStorage.getItem('emergency_stop');
  if (emergencyState) {
    try {
      const data = JSON.parse(emergencyState);
      console.warn('⚠️ Previous emergency stop detected:', data);
      
      // Show user-friendly message if too recent
      if (Date.now() - data.timestamp < 60000) { // 1 minute
        alert(`Navigation loop detected and stopped. Redirects: ${data.count}\n\nThis prevents browser freezing. You can now use the application normally.`);
      }
      
      // Clear emergency state after showing
      sessionStorage.removeItem('emergency_stop');
    } catch (e) {
      console.warn('Could not parse emergency state:', e);
    }
  }
});

export default loopDetector;