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
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Store emergency state
    sessionStorage.setItem('emergency_stop', JSON.stringify({
      redirectHistory: this.redirectHistory.slice(-10),
      timestamp: Date.now(),
      count: this.redirectCount
    }));
    
    // Reset to safe state after delay
    setTimeout(() => {
      window.location.href = '/login?emergency=true';
    }, 1000);
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