#!/usr/bin/env node

// === LFA Legacy GO Frontend Loop Detection & Debug Tool ===
// This script creates debugging tools to identify infinite loops in the React frontend

import fs from 'fs/promises';
import path from 'path';

const colors = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', 
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  reset: '\x1b[0m', bold: '\x1b[1m'
};

const log = (color, text) => console.log(`${colors[color]}${text}${colors.reset}`);

// Create browser debugging injection script
const createBrowserDebugScript = () => {
  return `
// === LFA Legacy GO - Infinite Loop Detector ===
// Inject this into browser console on https://lfa-legacy-go.netlify.app/dashboard

window.LFA_DEBUG = {
  renderCounts: new Map(),
  apiCalls: new Map(),
  redirectCounts: new Map(),
  
  // Track component renders
  trackRender: function(componentName) {
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    
    if (count > 5) {
      console.warn(\`⚠️ \${componentName} rendered \${count} times\`);
    }
    if (count > 20) {
      console.error(\`🚨 INFINITE RENDER: \${componentName}\`);
      console.trace();
    }
    
    return count;
  },
  
  // Track API calls
  trackAPI: function(endpoint) {
    const count = this.apiCalls.get(endpoint) || 0;
    this.apiCalls.set(endpoint, count + 1);
    
    if (count > 3) {
      console.warn(\`⚠️ API \${endpoint} called \${count} times\`);
    }
    if (count > 10) {
      console.error(\`🚨 INFINITE API CALLS: \${endpoint}\`);
    }
    
    return count;
  },
  
  // Track redirects/navigation
  trackRedirect: function(path) {
    const count = this.redirectCounts.get(path) || 0;
    this.redirectCounts.set(path, count + 1);
    
    if (count > 5) {
      console.error(\`🚨 INFINITE REDIRECT: \${path} - \${count} times\`);
    }
    
    return count;
  },
  
  // Monitor auth state changes
  monitorAuthState: function() {
    let authStateChanges = 0;
    let lastAuthState = null;
    
    const observer = new MutationObserver(() => {
      // Try to find React auth state
      const authElement = document.querySelector('[data-testid="auth-state"]') 
        || document.querySelector('.auth-context');
        
      if (authElement) {
        const currentState = authElement.textContent || authElement.innerHTML;
        if (currentState !== lastAuthState) {
          authStateChanges++;
          lastAuthState = currentState;
          
          console.log(\`🔐 Auth state change #\${authStateChanges}: \${currentState.substring(0, 50)}...\`);
          
          if (authStateChanges > 10) {
            console.error('🚨 INFINITE AUTH STATE CHANGES');
            observer.disconnect();
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('👁️ Started monitoring auth state changes');
  },
  
  // Check loading states
  checkLoadingStates: function() {
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [aria-label*="loading"]');
    console.log(\`🔄 Found \${loadingElements.length} loading elements:\`);
    
    loadingElements.forEach((el, i) => {
      console.log(\`  \${i + 1}. \${el.tagName} - \${el.className} - \${el.textContent?.substring(0, 30) || 'no text'}\`);
    });
    
    return loadingElements.length;
  },
  
  // Monitor network requests
  monitorNetwork: function() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const url = args[0];
      const count = window.LFA_DEBUG.trackAPI(url);
      
      console.log(\`🌐 API Call #\${count}: \${url}\`);
      
      try {
        const response = await originalFetch.apply(this, args);
        
        if (!response.ok) {
          console.error(\`❌ API Failed: \${url} - \${response.status} \${response.statusText}\`);
        } else {
          console.log(\`✅ API Success: \${url} - \${response.status}\`);
        }
        
        return response;
      } catch (error) {
        console.error(\`💥 API Error: \${url} - \${error.message}\`);
        throw error;
      }
    };
    
    console.log('🕸️ Network monitoring activated');
  },
  
  // Check localStorage issues
  checkLocalStorage: function() {
    const token = localStorage.getItem('auth_token');
    console.log(\`🔑 Auth token exists: \${!!token}\`);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        const now = new Date();
        
        console.log(\`⏰ Token expires: \${expiry}\`);
        console.log(\`⏰ Current time: \${now}\`);
        console.log(\`⏰ Token valid: \${expiry > now}\`);
        
        if (expiry <= now) {
          console.error('🚨 EXPIRED TOKEN DETECTED - This might cause infinite loading!');
        }
      } catch (error) {
        console.error('🚨 INVALID TOKEN FORMAT - This might cause infinite loading!');
      }
    }
  },
  
  // Full diagnostic
  runFullDiagnostic: function() {
    console.clear();
    console.log('🔍 === LFA LEGACY GO - INFINITE LOOP DIAGNOSTIC ===');
    console.log('');
    
    this.checkLocalStorage();
    console.log('');
    
    this.checkLoadingStates();
    console.log('');
    
    this.monitorNetwork();
    this.monitorAuthState();
    
    console.log('📊 Diagnostic tools activated. Monitor console for warnings.');
    console.log('');
    console.log('🔧 Quick fixes to try:');
    console.log('  1. localStorage.clear() - Clear stored token');
    console.log('  2. Hard refresh (Ctrl+Shift+R)');
    console.log('  3. Check Network tab for failed API calls');
    
    return {
      renders: Array.from(this.renderCounts.entries()),
      apiCalls: Array.from(this.apiCalls.entries()),
      redirects: Array.from(this.redirectCounts.entries())
    };
  }
};

// Auto-run diagnostic
console.log('🚀 LFA Debug tools loaded! Run: LFA_DEBUG.runFullDiagnostic()');
`;
};

// Create React component debugging wrapper
const createReactDebugWrapper = () => {
  return `
// === React Component Debug Wrapper ===
// Add this to components experiencing infinite renders

import React, { useRef, useEffect } from 'react';

export const withDebugWrapper = (WrappedComponent, componentName) => {
  return function DebugWrapper(props) {
    const renderCountRef = useRef(0);
    const propsRef = useRef(props);
    
    useEffect(() => {
      renderCountRef.current += 1;
      
      if (renderCountRef.current > 5) {
        console.warn(\`⚠️ \${componentName} rendered \${renderCountRef.current} times\`);
        
        // Check if props changed
        const propsChanged = JSON.stringify(props) !== JSON.stringify(propsRef.current);
        console.log(\`Props changed: \${propsChanged}\`);
        
        if (propsChanged) {
          console.log('Previous props:', propsRef.current);
          console.log('Current props:', props);
        }
      }
      
      if (renderCountRef.current > 20) {
        console.error(\`🚨 INFINITE RENDER: \${componentName}\`);
        console.trace();
      }
      
      propsRef.current = props;
    });
    
    return <WrappedComponent {...props} />;
  };
};

// Usage example:
// export default withDebugWrapper(Dashboard, 'Dashboard');
`;
};

async function createDebugTools() {
  log('blue', '🔧 === LFA LEGACY GO - INFINITE LOOP DEBUG TOOLS ===');
  log('blue', '='.repeat(60));
  
  const frontendPath = '/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/frontend';
  
  // Create debug tools directory
  const debugDir = path.join(frontendPath, 'debug-tools');
  try {
    await fs.mkdir(debugDir, { recursive: true });
    log('green', '✅ Created debug-tools directory');
  } catch (error) {
    log('yellow', '⚠️ Debug directory already exists');
  }
  
  // Create browser debug script
  const browserScript = createBrowserDebugScript();
  await fs.writeFile(path.join(debugDir, 'browser-debug-injection.js'), browserScript);
  log('green', '✅ Created browser debug injection script');
  
  // Create React debug wrapper
  const reactWrapper = createReactDebugWrapper();
  await fs.writeFile(path.join(debugDir, 'react-debug-wrapper.jsx'), reactWrapper);
  log('green', '✅ Created React component debug wrapper');
  
  // Create debug instructions
  const instructions = \`# 🔧 LFA Legacy GO - Infinite Loop Debug Guide

## 🚨 IDENTIFIED PROBLEM
The infinite loading issue is caused by AuthContext initialization hanging.

**Root Cause**: \`authService.getCurrentUser()\` API call in AuthContext.tsx:137 
either fails or hangs, leaving \`loading: true\` forever.

## 🔍 IMMEDIATE DIAGNOSIS

### Step 1: Browser Console Debug
1. Open https://lfa-legacy-go.netlify.app/dashboard
2. Open DevTools → Console
3. Copy-paste content from \`browser-debug-injection.js\`
4. Run: \`LFA_DEBUG.runFullDiagnostic()\`

### Step 2: Check Network Tab
1. DevTools → Network tab
2. Look for failed API calls to \`/api/auth/me\`
3. Check if CORS errors or 401/403 responses

### Step 3: Check Auth Token
1. DevTools → Application → Local Storage
2. Check \`auth_token\` value
3. If corrupted/expired, run: \`localStorage.clear()\`

## 🔧 CONCRETE FIXES

### Fix 1: Add Timeout to AuthContext
\\\`\\\`\\\`typescript
// In frontend/src/contexts/AuthContext.tsx line 130
useEffect(() => {
  const initializeAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        dispatch({ type: "AUTH_START" });

        // ✅ ADD TIMEOUT
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        );
        
        const userData = await Promise.race([
          authService.getCurrentUser(),
          timeoutPromise
        ]);
        
        // ... rest of the code
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("auth_token");
        dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
      }
    } else {
      // ✅ CRITICAL FIX: Set loading to false when no token
      dispatch({ type: "AUTH_FAILURE", payload: "" });
    }
  };

  initializeAuth();
}, []);
\\\`\\\`\\\`

### Fix 2: Add Loading Timeout Fallback
\\\`\\\`\\\`typescript
// Add to AuthContext useEffect
useEffect(() => {
  // Fallback timeout - force loading to false after 15 seconds
  const fallbackTimeout = setTimeout(() => {
    console.warn('⚠️ Auth initialization timeout - forcing loading state to false');
    dispatch({ type: "AUTH_FAILURE", payload: "Authentication timeout" });
  }, 15000);
  
  return () => clearTimeout(fallbackTimeout);
}, []);
\\\`\\\`\\\`

### Fix 3: Better Error Handling in API Service
\\\`\\\`\\\`typescript
// In frontend/src/services/api.ts
async getCurrentUser(): Promise<User> {
  try {
    const response = await this.get("/api/auth/me");
    return response;
  } catch (error) {
    // Clear invalid token on auth failure
    if (error.message.includes('401') || error.message.includes('403')) {
      localStorage.removeItem('auth_token');
    }
    throw error;
  }
}
\\\`\\\`\\\`

## 🚀 TESTING PROCEDURE

### Test 1: Clear Storage
1. \`localStorage.clear()\`
2. Hard refresh (Ctrl+Shift+R)
3. Should redirect to login

### Test 2: Invalid Token
1. Set invalid token: \`localStorage.setItem('auth_token', 'invalid')\`
2. Refresh page
3. Should handle gracefully and redirect to login

### Test 3: Network Failure
1. Throttle network in DevTools
2. Try to access dashboard
3. Should timeout and redirect to login

## 📊 EXPECTED RESULTS

After fixes:
- ✅ No infinite loading on dashboard
- ✅ Proper error handling for invalid tokens
- ✅ Timeout fallbacks working
- ✅ Clean redirects to login when needed

## 🔗 FILES TO MODIFY

1. \`frontend/src/contexts/AuthContext.tsx\` - Add timeout handling
2. \`frontend/src/services/api.ts\` - Improve error handling
3. Test the fixes with debug tools provided
\`;
  
  await fs.writeFile(path.join(debugDir, 'DEBUG-INSTRUCTIONS.md'), instructions);
  log('green', '✅ Created comprehensive debug instructions');
  
  // Create summary report
  log('blue', '\\n📊 === INFINITE LOOP ANALYSIS COMPLETE ===');
  log('red', '🚨 ROOT CAUSE IDENTIFIED:');
  log('yellow', '   AuthContext.tsx:137 - authService.getCurrentUser() hanging');
  log('yellow', '   No timeout handling causes loading: true forever');
  
  log('blue', '\\n🔧 SOLUTION CREATED:');
  log('green', '   1. Browser debug injection script');
  log('green', '   2. React component debug wrapper');
  log('green', '   3. Concrete code fixes with timeout handling');
  log('green', '   4. Comprehensive testing procedure');
  
  log('blue', '\\n📁 DEBUG TOOLS LOCATION:');
  log('cyan', \`   \${debugDir}/\`);
  log('cyan', '   ├── browser-debug-injection.js');
  log('cyan', '   ├── react-debug-wrapper.jsx');
  log('cyan', '   └── DEBUG-INSTRUCTIONS.md');
  
  log('blue', '\\n🚀 IMMEDIATE ACTION REQUIRED:');
  log('yellow', '   1. Open DEBUG-INSTRUCTIONS.md');
  log('yellow', '   2. Apply the AuthContext timeout fixes');
  log('yellow', '   3. Test with browser debug tools');
  log('yellow', '   4. Verify infinite loading is resolved');
  
  return {
    debugDir,
    rootCause: 'AuthContext getCurrentUser() API call hanging without timeout',
    solution: 'Add Promise.race with timeout + fallback timeout + better error handling',
    impact: 'Fixes infinite loading loop on dashboard'
  };
}

// Run the debug tool creation
createDebugTools()
  .then(result => {
    log('green', '\\n🎉 DEBUG ANALYSIS COMPLETE!');
    log('green', \`Root cause: \${result.rootCause}\`);
    log('green', \`Solution: \${result.solution}\`);
  })
  .catch(error => {
    log('red', \`❌ Error creating debug tools: \${error.message}\`);
  });