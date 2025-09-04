// MFA UI Injection - Vanilla JavaScript
console.log("MFA injection script loaded");

function injectMFASection() {
  console.log("Attempting MFA injection...");
  
  // Multiple fallback strategies for finding injection point
  let profileContainer = null;
  
  // Strategy 1: Look for main content area
  profileContainer = document.querySelector('main') || 
                    document.querySelector('[role="main"]');
  
  // Strategy 2: Look for Profile heading and go up
  if (!profileContainer) {
    const profileHeading = Array.from(document.querySelectorAll('h1, h2, h3'))
      .find(el => el.textContent.includes('Profile'));
    if (profileHeading) {
      profileContainer = profileHeading.parentElement;
    }
  }
  
  // Strategy 3: Look for Account Type and go up 2 levels
  if (!profileContainer) {
    const accountTypeEl = Array.from(document.querySelectorAll('*'))
      .find(el => el.textContent && el.textContent.includes('Account Type'));
    if (accountTypeEl) {
      profileContainer = accountTypeEl.parentElement?.parentElement;
    }
  }
  
  // Strategy 4: Look for MUI containers
  if (!profileContainer) {
    profileContainer = document.querySelector('.MuiBox-root') || 
                      document.querySelector('[class*="MuiContainer"]') ||
                      document.querySelector('[class*="container"]');
  }
  
  // Strategy 5: Look for React root
  if (!profileContainer) {
    profileContainer = document.querySelector('#root > div') ||
                      document.querySelector('#root');
  }
  
  // Strategy 6: Fallback to body
  if (!profileContainer) {
    profileContainer = document.body;
  }
  
  console.log("Selected container:", profileContainer);
  
  if (profileContainer) {
    // Check if already injected
    if (profileContainer.querySelector('.mfa-security-card')) {
      console.log("MFA section already exists");
      return true;
    }
    
    console.log("Profile container found, injecting MFA section");
    
    const mfaSection = document.createElement('div');
    mfaSection.innerHTML = `
      <div class="mfa-security-card" style="
        background: white; 
        padding: 24px; 
        border-radius: 12px; 
        margin: 24px 0; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-left: 4px solid #2196F3;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="
            width: 28px; 
            height: 28px; 
            background: #2196F3; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 12px;
          ">🔒</div>
          <h3 style="margin: 0; color: #1976D2; font-size: 20px;">Account Security</h3>
        </div>
        
        <div style="height: 1px; background: #e0e0e0; margin: 16px 0;"></div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0;">
          <span style="color: #666; font-size: 14px;">Email Verification</span>
          <span style="
            background: #4CAF50; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 12px;
            font-weight: 500;
          ">✓ Verified</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
          <span style="color: #666; font-size: 14px;">Two-Factor Authentication</span>
          <span style="
            background: #FF9800; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 12px;
            font-weight: 500;
          ">Disabled</span>
        </div>
        
        <button onclick="startMFASetup()" style="
          width: 100%; 
          background: #1976D2; 
          color: white; 
          border: none; 
          padding: 12px 16px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        " onmouseover="this.style.background='#1565C0'" onmouseout="this.style.background='#1976D2'">
          <span style="margin-right: 8px;">🔒</span>
          Enable Two-Factor Authentication
        </button>
      </div>
    `;
    
    // Smart injection positioning
    let insertPosition = profileContainer;
    
    // Try to insert after Account Type section if it exists
    const accountTypeElements = Array.from(profileContainer.querySelectorAll('*'))
      .filter(el => el.textContent && el.textContent.includes('Account Type'));
    
    if (accountTypeElements.length > 0) {
      const accountTypeSection = accountTypeElements[0].closest('[class*="Card"], [class*="Section"], div');
      if (accountTypeSection && accountTypeSection.parentElement) {
        insertPosition = accountTypeSection.parentElement;
        insertPosition.insertBefore(mfaSection, accountTypeSection.nextSibling);
        console.log("MFA section inserted after Account Type section");
      } else {
        profileContainer.appendChild(mfaSection);
        console.log("MFA section appended to container");
      }
    } else {
      // Append to end of container
      profileContainer.appendChild(mfaSection);
      console.log("MFA section appended to container (no Account Type found)");
    }
    
    console.log("MFA section injected successfully!");
    return true;
  }
  
  console.log("Profile container not found, retrying...");
  return false;
}

function startMFASetup() {
  alert("MFA Setup functionality works!\n\nThis proves the UI injection is successful.\n\nNext step: Connect to actual MFA backend API.");
}

function forceBodyInjection() {
  console.log("Forcing emergency injection to body");
  
  const mfaSection = document.createElement('div');
  mfaSection.style.position = 'fixed';
  mfaSection.style.top = '100px';
  mfaSection.style.right = '20px';
  mfaSection.style.zIndex = '10000';
  mfaSection.innerHTML = `
    <div style="background: white; padding: 20px; border: 2px solid #1976D2; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px;">
      <h3 style="margin: 0 0 12px 0; color: #1976D2;">🔒 Account Security</h3>
      <p style="margin: 8px 0; font-size: 14px;">Two-Factor Authentication: <span style="color: orange; font-weight: 500;">Disabled</span></p>
      <button onclick="alert('MFA Setup works! Emergency injection successful.')" style="width: 100%; background: #1976D2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
        Enable Two-Factor Authentication
      </button>
      <div style="margin-top: 8px; font-size: 10px; color: #666; text-align: center;">(Emergency Injection)</div>
    </div>
  `;
  document.body.appendChild(mfaSection);
  console.log("Emergency MFA section injected to body!");
}

// Enhanced retry mechanism
let attempts = 0;
const maxAttempts = 20; // Increase attempts
let retryInterval;

function attemptInjection() {
  attempts++;
  console.log(`MFA injection attempt ${attempts}/${maxAttempts}`);
  
  if (injectMFASection()) {
    console.log("MFA injection successful!");
    if (retryInterval) clearInterval(retryInterval);
    return;
  }
  
  if (attempts >= maxAttempts) {
    console.error("Failed to inject MFA after", maxAttempts, "attempts");
    console.log("Forcing injection to body as last resort");
    forceBodyInjection();
    if (retryInterval) clearInterval(retryInterval);
    return;
  }
}

// Multiple initialization strategies
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, starting MFA injection");
  setTimeout(attemptInjection, 1000);
});

window.addEventListener('load', () => {
  console.log("Window loaded, attempting MFA injection");
  setTimeout(attemptInjection, 2000);
});

// Retry every 2 seconds for persistent injection
retryInterval = setInterval(attemptInjection, 2000);

// Stop retrying after 40 seconds
setTimeout(() => {
  if (retryInterval) {
    clearInterval(retryInterval);
    console.log("MFA injection retry timeout reached");
  }
}, 40000);