// === LFA LEGACY GO - EMERGENCY REFRESH LOOP STOP ===
// This script MUST be loaded first to prevent infinite refreshes

(function() {
  'use strict';
  
  console.log('🛑 Emergency Stop System Loading...');
  
  // Check if emergency stop was already activated
  const emergencyActive = localStorage.getItem('LFA_EMERGENCY_STOP');
  const refreshCount = parseInt(localStorage.getItem('LFA_REFRESH_COUNT') || '0');
  
  if (emergencyActive === 'true' || refreshCount > 5) {
    console.error('🚨 EMERGENCY STOP ACTIVATED - Refresh loop detected!');
    console.error(`🔢 Refresh count: ${refreshCount}`);
    
    // Show emergency UI
    document.addEventListener('DOMContentLoaded', function() {
      document.body.innerHTML = `
        <div style="
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: #ff6b6b; color: white; display: flex; 
          flex-direction: column; align-items: center; justify-content: center;
          font-family: Arial, sans-serif; z-index: 99999;
          padding: 20px; box-sizing: border-box;
        ">
          <div style="max-width: 600px; text-align: center;">
            <h1 style="font-size: 2em; margin-bottom: 20px;">🛑 EMERGENCY STOP</h1>
            <h2 style="font-size: 1.2em; margin-bottom: 30px;">LFA Legacy GO - Refresh Loop Detected</h2>
            
            <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Refresh Count:</strong> ${refreshCount}</p>
              <p><strong>Status:</strong> Infinite refresh loop prevented</p>
              <p><strong>Action:</strong> App stopped to prevent browser freeze</p>
            </div>
            
            <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <h3>🔍 Captured Errors:</h3>
              <pre id="error-log" style="white-space: pre-wrap; font-size: 12px; max-height: 200px; overflow-y: auto;">${localStorage.getItem('LFA_ERROR_LOG') || 'No errors captured'}</pre>
            </div>
            
            <div style="margin-top: 30px;">
              <button onclick="resetEmergencyStop()" style="
                background: #4CAF50; color: white; border: none; 
                padding: 15px 30px; font-size: 16px; border-radius: 5px;
                cursor: pointer; margin: 0 10px;
              ">🔄 Reset & Try Again</button>
              
              <button onclick="clearAllData()" style="
                background: #ff9800; color: white; border: none; 
                padding: 15px 30px; font-size: 16px; border-radius: 5px;
                cursor: pointer; margin: 0 10px;
              ">🗑️ Clear All Data</button>
              
              <button onclick="showDebugInfo()" style="
                background: #2196F3; color: white; border: none; 
                padding: 15px 30px; font-size: 16px; border-radius: 5px;
                cursor: pointer; margin: 0 10px;
              ">🔧 Debug Info</button>
            </div>
            
            <div id="debug-info" style="display: none; margin-top: 20px; text-align: left; font-size: 12px;">
              <h4>🔧 Debug Information:</h4>
              <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
              <p><strong>URL:</strong> ${window.location.href}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Local Storage Items:</strong></p>
              <pre>${JSON.stringify(Object.keys(localStorage), null, 2)}</pre>
            </div>
          </div>
        </div>
      `;
    });
    
    // Define emergency functions globally
    window.resetEmergencyStop = function() {
      localStorage.removeItem('LFA_EMERGENCY_STOP');
      localStorage.removeItem('LFA_REFRESH_COUNT');
      localStorage.removeItem('LFA_ERROR_LOG');
      console.log('🔄 Emergency stop reset - reloading...');
      window.location.reload();
    };
    
    window.clearAllData = function() {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🗑️ All data cleared - reloading...');
      window.location.reload();
    };
    
    window.showDebugInfo = function() {
      const debugDiv = document.getElementById('debug-info');
      debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    };
    
    return; // Stop execution here
  }
  
  // Increment refresh count
  localStorage.setItem('LFA_REFRESH_COUNT', (refreshCount + 1).toString());
  console.log(`🔢 Page refresh count: ${refreshCount + 1}`);
  
  // Activate emergency stop if too many refreshes
  if (refreshCount + 1 > 5) {
    localStorage.setItem('LFA_EMERGENCY_STOP', 'true');
    console.error('🚨 Emergency stop will activate on next refresh');
  }
  
  // Error capture system
  const errorLog = JSON.parse(localStorage.getItem('LFA_ERROR_LOG') || '[]');
  
  // Capture JavaScript errors
  window.addEventListener('error', function(e) {
    console.error('🚨 JavaScript Error:', e.error);
    errorLog.push({
      type: 'javascript',
      message: e.message,
      filename: e.filename,
      line: e.lineno,
      column: e.colno,
      stack: e.error ? e.error.stack : null,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    localStorage.setItem('LFA_ERROR_LOG', JSON.stringify(errorLog.slice(-10))); // Keep last 10 errors
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
    errorLog.push({
      type: 'promise_rejection',
      message: e.reason ? e.reason.toString() : 'Unknown promise rejection',
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    localStorage.setItem('LFA_ERROR_LOG', JSON.stringify(errorLog.slice(-10)));
  });
  
  // Monitor for rapid redirects/navigation changes
  let navigationCount = 0;
  const navigationStart = Date.now();
  
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    navigationCount++;
    console.log(`🧭 Navigation count: ${navigationCount}`);
    
    if (navigationCount > 10 && (Date.now() - navigationStart) < 5000) {
      console.error('🚨 Rapid navigation detected - potential infinite redirect!');
      localStorage.setItem('LFA_EMERGENCY_STOP', 'true');
      errorLog.push({
        type: 'rapid_navigation',
        message: `Rapid navigation detected: ${navigationCount} navigations in ${Date.now() - navigationStart}ms`,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      localStorage.setItem('LFA_ERROR_LOG', JSON.stringify(errorLog.slice(-10)));
    }
    
    return originalPushState.apply(this, arguments);
  };
  
  history.replaceState = function() {
    navigationCount++;
    console.log(`🧭 Replace state count: ${navigationCount}`);
    return originalReplaceState.apply(this, arguments);
  };
  
  // Reset refresh count after successful load (if no errors for 5 seconds)
  setTimeout(function() {
    if (errorLog.length === 0) {
      localStorage.setItem('LFA_REFRESH_COUNT', '0');
      console.log('✅ Page loaded successfully - reset refresh count');
    }
  }, 5000);
  
  console.log('🛡️ Emergency stop system active - monitoring for refresh loops...');
  
})();