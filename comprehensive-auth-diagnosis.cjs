#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const axios = require('axios');

// Comprehensive Authentication Diagnosis System
class AuthDiagnosticSystem {
  constructor() {
    this.logFile = `auth-diagnostic-${Date.now()}.log`;
    this.errors = [];
    this.warnings = [];
    this.testResults = {};
    this.consoleLogs = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async runComprehensiveDiagnosis() {
    this.log('🔍 STARTING COMPREHENSIVE AUTHENTICATION DIAGNOSIS', 'SYSTEM');
    
    try {
      // Step 1: Backend API Tests
      await this.testBackendAPI();
      
      // Step 2: Frontend Build Analysis
      await this.analyzeFrontendBuild();
      
      // Step 3: Browser-based Authentication Flow Test
      await this.testBrowserAuthenticationFlow();
      
      // Step 4: Network Analysis
      await this.analyzeNetworkRequests();
      
      // Step 5: Generate Final Report
      await this.generateDiagnosticReport();
      
    } catch (error) {
      this.log(`💥 CRITICAL ERROR: ${error.message}`, 'ERROR');
      this.log(`Stack: ${error.stack}`, 'ERROR');
    }
  }

  async testBackendAPI() {
    this.log('🧪 TESTING BACKEND API...', 'TEST');
    
    const API_URL = 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app';
    
    try {
      // Test 1: Health Check
      this.log('Testing health endpoint...', 'TEST');
      const healthResponse = await axios.get(`${API_URL}/health`);
      this.testResults.health = { status: 'PASS', data: healthResponse.data };
      this.log(`✅ Health check: ${JSON.stringify(healthResponse.data)}`, 'PASS');
      
      // Test 2: User Registration
      this.log('Testing user registration...', 'TEST');
      const testUser = `diag_${Date.now()}`;
      const regResponse = await axios.post(`${API_URL}/api/auth/register`, {
        username: testUser,
        password: 'diagpass123',
        email: `${testUser}@test.com`,
        full_name: `Diagnostic User ${Date.now()}`
      });
      
      this.testResults.registration = { 
        status: 'PASS', 
        username: testUser, 
        userId: regResponse.data.user.id,
        token: regResponse.data.access_token.substring(0, 20) + '...'
      };
      this.log(`✅ Registration successful: User ID ${regResponse.data.user.id}`, 'PASS');
      
      // Test 3: User Login
      this.log('Testing user login...', 'TEST');
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        username: testUser,
        password: 'diagpass123'
      });
      
      this.testResults.login = { 
        status: 'PASS', 
        userId: loginResponse.data.user.id,
        tokenValid: !!loginResponse.data.access_token
      };
      this.log(`✅ Login successful: Token valid = ${!!loginResponse.data.access_token}`, 'PASS');
      
      // Store test credentials for browser test
      this.testCredentials = { username: testUser, password: 'diagpass123' };
      
    } catch (error) {
      this.log(`❌ Backend API Error: ${error.response?.data?.detail || error.message}`, 'ERROR');
      this.testResults.backendAPI = { status: 'FAIL', error: error.message };
    }
  }

  async analyzeFrontendBuild() {
    this.log('🔍 ANALYZING FRONTEND BUILD...', 'ANALYSIS');
    
    try {
      // Check if latest build contains our fixes
      const buildFiles = fs.readdirSync('./static/js/').filter(f => f.startsWith('main.') && f.endsWith('.js'));
      const latestBuild = buildFiles.sort().pop();
      
      this.log(`Latest build file: ${latestBuild}`, 'INFO');
      
      // Read and analyze build content
      const buildContent = fs.readFileSync(`./static/js/${latestBuild}`, 'utf8');
      
      // Check for function name collision fixes
      const hasHandleLoginSubmit = buildContent.includes('handleLoginSubmit');
      const hasHandleRegisterSubmit = buildContent.includes('handleRegisterSubmit');
      const hasLoginAttemptLog = buildContent.includes('Login attempt #');
      
      this.testResults.buildAnalysis = {
        hasHandleLoginSubmit,
        hasHandleRegisterSubmit, 
        hasLoginAttemptLog,
        buildFile: latestBuild,
        buildSize: Math.round(buildContent.length / 1024) + 'KB'
      };
      
      this.log(`Build Analysis:`, 'ANALYSIS');
      this.log(`- handleLoginSubmit present: ${hasHandleLoginSubmit}`, 'ANALYSIS');
      this.log(`- handleRegisterSubmit present: ${hasHandleRegisterSubmit}`, 'ANALYSIS');
      this.log(`- Login attempt logging present: ${hasLoginAttemptLog}`, 'ANALYSIS');
      
    } catch (error) {
      this.log(`❌ Build analysis error: ${error.message}`, 'ERROR');
    }
  }

  async testBrowserAuthenticationFlow() {
    this.log('🌐 TESTING BROWSER AUTHENTICATION FLOW...', 'TEST');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture all console logs
    page.on('console', msg => {
      const logEntry = `BROWSER: ${msg.type()}: ${msg.text()}`;
      this.consoleLogs.push(logEntry);
      this.log(logEntry, 'BROWSER');
    });
    
    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    try {
      // Navigate to app
      this.log('Navigating to https://lfa-legacy-go.netlify.app', 'TEST');
      await page.goto('https://lfa-legacy-go.netlify.app');
      await page.waitForLoadState('networkidle');
      
      // Wait for any loading to complete
      await page.waitForTimeout(3000);
      
      // Take screenshot for reference
      await page.screenshot({ path: 'diagnosis-initial.png' });
      this.log('Initial screenshot saved: diagnosis-initial.png', 'INFO');
      
      // Check if we're on login page
      const isLoginPage = await page.locator('button:has-text("Login")').isVisible();
      this.log(`Is login page: ${isLoginPage}`, 'ANALYSIS');
      
      if (isLoginPage) {
        // Test login functionality
        await this.testLoginFunctionality(page);
      } else {
        this.log('Not on login page - checking current page state', 'WARNING');
        const pageContent = await page.content();
        this.log(`Page contains: ${pageContent.substring(0, 500)}...`, 'DEBUG');
      }
      
      this.testResults.networkRequests = networkRequests;
      
    } catch (error) {
      this.log(`❌ Browser test error: ${error.message}`, 'ERROR');
      await page.screenshot({ path: 'diagnosis-error.png' });
      this.testResults.browserTest = { status: 'FAIL', error: error.message };
    } finally {
      await browser.close();
    }
  }

  async testLoginFunctionality(page) {
    this.log('🔐 TESTING LOGIN FUNCTIONALITY...', 'TEST');
    
    // Get all input fields
    const inputs = await page.$$('input');
    this.log(`Found ${inputs.length} input fields`, 'INFO');
    
    if (!this.testCredentials) {
      this.log('No test credentials available - using debuguser', 'WARNING');
      this.testCredentials = { username: 'debuguser', password: 'debug123' };
    }
    
    // Fill login form
    if (inputs.length >= 2) {
      await inputs[0].fill(this.testCredentials.username);
      await inputs[1].fill(this.testCredentials.password);
      this.log(`Filled credentials: ${this.testCredentials.username} / ${this.testCredentials.password}`, 'TEST');
    }
    
    // Count console logs before login attempt
    const logsBeforeLogin = this.consoleLogs.length;
    
    // Click login button
    this.log('Clicking login button...', 'TEST');
    await page.click('button:has-text("Login")');
    
    // Wait for potential response
    await page.waitForTimeout(3000);
    
    // Count console logs after login attempt
    const logsAfterLogin = this.consoleLogs.length;
    const newLogs = logsAfterLogin - logsBeforeLogin;
    
    this.log(`Console logs before login: ${logsBeforeLogin}`, 'ANALYSIS');
    this.log(`Console logs after login: ${logsAfterLogin}`, 'ANALYSIS');
    this.log(`New logs generated: ${newLogs}`, 'ANALYSIS');
    
    // Check if login attempt log appeared
    const hasLoginAttemptLog = this.consoleLogs.some(log => log.includes('Login attempt #'));
    const hasLoginFailedLog = this.consoleLogs.some(log => log.includes('Login failed:'));
    const hasLoginSuccessLog = this.consoleLogs.some(log => log.includes('Login successful:'));
    
    this.testResults.loginFunctionality = {
      loginAttemptLogged: hasLoginAttemptLog,
      loginFailedLogged: hasLoginFailedLog,
      loginSuccessLogged: hasLoginSuccessLog,
      newLogsGenerated: newLogs,
      formSubmitted: newLogs > 0
    };
    
    this.log(`Login attempt logged: ${hasLoginAttemptLog}`, 'RESULT');
    this.log(`Login failed logged: ${hasLoginFailedLog}`, 'RESULT'); 
    this.log(`Login success logged: ${hasLoginSuccessLog}`, 'RESULT');
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'diagnosis-after-login.png' });
    this.log('Post-login screenshot saved: diagnosis-after-login.png', 'INFO');
  }

  async analyzeNetworkRequests() {
    this.log('🌐 ANALYZING NETWORK REQUESTS...', 'ANALYSIS');
    
    const authRequests = this.testResults.networkRequests?.filter(req => 
      req.url.includes('/auth/') || req.method === 'POST'
    ) || [];
    
    this.log(`Found ${authRequests.length} authentication-related requests`, 'ANALYSIS');
    authRequests.forEach((req, idx) => {
      this.log(`Request ${idx + 1}: ${req.method} ${req.url}`, 'ANALYSIS');
    });
    
    this.testResults.networkAnalysis = {
      totalRequests: this.testResults.networkRequests?.length || 0,
      authRequests: authRequests.length,
      requests: authRequests
    };
  }

  async generateDiagnosticReport() {
    this.log('📋 GENERATING DIAGNOSTIC REPORT...', 'REPORT');
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      consoleLogs: this.consoleLogs,
      errors: this.errors,
      warnings: this.warnings,
      summary: this.generateSummary()
    };
    
    const reportFile = `diagnostic-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Full diagnostic report saved: ${reportFile}`, 'REPORT');
    this.log('📋 DIAGNOSTIC SUMMARY:', 'REPORT');
    this.log(this.generateSummary(), 'REPORT');
    
    return report;
  }

  generateSummary() {
    const issues = [];
    
    if (!this.testResults.loginFunctionality?.loginAttemptLogged) {
      issues.push('🔥 CRITICAL: Login function not being called - handleSubmit not triggered');
    }
    
    if (!this.testResults.buildAnalysis?.hasHandleLoginSubmit) {
      issues.push('🔥 CRITICAL: handleLoginSubmit function missing from build');
    }
    
    if (!this.testResults.buildAnalysis?.hasLoginAttemptLog) {
      issues.push('⚠️  WARNING: Login attempt logging missing from build');
    }
    
    if (this.testResults.backendAPI?.status === 'FAIL') {
      issues.push('❌ ERROR: Backend API not functioning properly');
    }
    
    if (issues.length === 0) {
      return '✅ All systems functioning correctly';
    }
    
    return issues.join('\n');
  }
}

// Run comprehensive diagnosis
const diagnostic = new AuthDiagnosticSystem();
diagnostic.runComprehensiveDiagnosis()
  .then(() => {
    console.log('🎯 Comprehensive diagnosis completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Diagnosis failed:', error);
    process.exit(1);
  });