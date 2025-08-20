// === LFA Legacy GO - Automatikus Tesztelési Rendszer ===
// Fájl: test/automated-integration-test.js

import puppeteer from 'puppeteer';
import chalk from 'chalk';

class LFALegacyAutoTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    
    // Konfigurációs beállítások
    this.config = {
      // Frontend URL - Netlify
      frontendUrl: 'https://lfa-legacy-go.netlify.app',
      // Backend URL - Google Cloud Run
      backendUrl: 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app',
      // Teszt felhasználó adatok
      testUser: {
        username: 'testuser_' + Date.now(),
        email: 'test@example.com',
        password: 'TestPassword123!'
      },
      // Teszt beállítások
      headless: false, // false = látható böngésző
      slowMo: 500, // lassítás emberszem számára
      timeout: 30000
    };
  }

  // === FŐ TESZTELÉSI FOLYAMAT ===
  async runFullIntegrationTest() {
    console.log(chalk.blue('🚀 LFA Legacy GO - Automatikus Integrációs Teszt Indítása'));
    console.log(chalk.gray('Frontend URL:'), this.config.frontendUrl);
    console.log(chalk.gray('Backend URL:'), this.config.backendUrl);
    
    try {
      await this.setupBrowser();
      await this.testBackendConnectivity();
      await this.testFrontendLoading();
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testDashboardAccess();
      await this.testAPIIntegration();
      
      this.printTestResults();
      
    } catch (error) {
      console.error(chalk.red('❌ Teszt hiba:'), error.message);
    } finally {
      await this.cleanup();
    }
  }

  // === BÖNGÉSZŐ BEÁLLÍTÁS ===
  async setupBrowser() {
    console.log(chalk.yellow('🔧 Böngésző indítása...'));
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Console log figyelése
    this.page.on('console', msg => {
      if (msg.text().includes('Environment Config')) {
        console.log(chalk.green('✅ Environment Config talált:'), msg.text());
      }
      if (msg.text().includes('API')) {
        console.log(chalk.blue('📡 API Log:'), msg.text());
      }
    });
    
    // Hibák figyelése
    this.page.on('pageerror', error => {
      console.log(chalk.red('❌ Frontend hiba:'), error.message);
    });
    
    this.addTestResult('Browser Setup', true, 'Böngésző sikeresen elindítva');
  }

  // === BACKEND KAPCSOLAT TESZT ===
  async testBackendConnectivity() {
    console.log(chalk.yellow('🔍 Backend kapcsolat tesztelése...'));
    
    try {
      // Health check
      const response = await fetch(this.config.backendUrl + '/health');
      const isHealthy = response.ok;
      
      if (isHealthy) {
        const healthData = await response.json();
        console.log(chalk.green('✅ Backend elérhető:'), healthData);
        this.addTestResult('Backend Health', true, `Status: ${response.status}`);
      } else {
        throw new Error(`Backend nem elérhető: ${response.status}`);
      }
      
      // API docs elérhetőség
      const docsResponse = await fetch(this.config.backendUrl + '/docs');
      const docsOk = docsResponse.ok;
      
      this.addTestResult('API Docs', docsOk, `Docs status: ${docsResponse.status}`);
      
    } catch (error) {
      this.addTestResult('Backend Connectivity', false, error.message);
      throw error;
    }
  }

  // === FRONTEND BETÖLTÉS TESZT ===
  async testFrontendLoading() {
    console.log(chalk.yellow('🌐 Frontend betöltés tesztelése...'));
    
    try {
      await this.page.goto(this.config.frontendUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // Várakozás az oldal teljes betöltésére
      await this.page.waitForSelector('form', { timeout: 10000 });
      
      // Environment configuration ellenőrzése
      const apiUrlCheck = await this.page.evaluate(() => {
        // Ellenőrizni hogy a build tartalmazza-e a helyes API URL-t
        const scripts = Array.from(document.scripts);
        return scripts.some(script => 
          script.innerHTML.includes('lfa-legacy-go-backend') ||
          script.src.includes('lfa-legacy-go-backend')
        );
      });
      
      // Oldal title ellenőrzése
      const title = await this.page.title();
      const hasCorrectTitle = title.includes('LFA') || title.includes('Legacy');
      
      this.addTestResult('Frontend Loading', true, `Title: ${title}`);
      this.addTestResult('API URL in Build', apiUrlCheck, apiUrlCheck ? 'API URL beépítve' : 'API URL nincs beépítve');
      
    } catch (error) {
      this.addTestResult('Frontend Loading', false, error.message);
      throw error;
    }
  }

  // === FELHASZNÁLÓ REGISZTRÁCIÓ TESZT ===
  async testUserRegistration() {
    console.log(chalk.yellow('👤 Felhasználó regisztráció tesztelése...'));
    
    try {
      // Váltás Sign Up-ra
      const signUpButton = await this.page.$('button:contains("SIGN UP"), .sign-up, [data-testid="sign-up"]');
      if (signUpButton) {
        await signUpButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Regisztrációs form kitöltése
      await this.page.waitForSelector('input[name="username"], input[placeholder*="username" i]', { timeout: 5000 });
      
      // Username
      const usernameField = await this.page.$('input[name="username"], input[placeholder*="username" i]');
      if (usernameField) {
        await usernameField.type(this.config.testUser.username);
      }
      
      // Email (ha van)
      const emailField = await this.page.$('input[name="email"], input[type="email"]');
      if (emailField) {
        await emailField.type(this.config.testUser.email);
      }
      
      // Password
      const passwordField = await this.page.$('input[name="password"], input[type="password"]');
      if (passwordField) {
        await passwordField.type(this.config.testUser.password);
      }
      
      // Submit gomb
      const submitButton = await this.page.$('button[type="submit"], button:contains("Sign Up"), .register-btn');
      if (submitButton) {
        await submitButton.click();
        
        // Várakozás a válaszra
        await this.page.waitForTimeout(3000);
        
        // Eredmény ellenőrzése
        const currentUrl = this.page.url();
        const registrationSuccess = currentUrl.includes('/dashboard') || currentUrl.includes('/login');
        
        this.addTestResult('User Registration', registrationSuccess, `URL: ${currentUrl}`);
      }
      
    } catch (error) {
      this.addTestResult('User Registration', false, `Regisztráció hiba: ${error.message}`);
      console.log(chalk.yellow('⚠️ Regisztráció hiba, folytatás bejelentkezéssel...'));
    }
  }

  // === FELHASZNÁLÓ BEJELENTKEZÉS TESZT ===
  async testUserLogin() {
    console.log(chalk.yellow('🔐 Felhasználó bejelentkezés tesztelése...'));
    
    try {
      // Navigáció a login oldalra
      await this.page.goto(this.config.frontendUrl, { waitUntil: 'networkidle2' });
      
      // Sign In tab kiválasztása
      const signInButton = await this.page.$('button:contains("SIGN IN"), .sign-in, [data-testid="sign-in"]');
      if (signInButton) {
        await signInButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Login form kitöltése
      await this.page.waitForSelector('input[name="username"], input[placeholder*="username" i]', { timeout: 5000 });
      
      const usernameField = await this.page.$('input[name="username"], input[placeholder*="username" i]');
      if (usernameField) {
        await usernameField.clear();
        await usernameField.type(this.config.testUser.username);
      }
      
      const passwordField = await this.page.$('input[name="password"], input[type="password"]');
      if (passwordField) {
        await passwordField.clear();
        await passwordField.type(this.config.testUser.password);
      }
      
      // Login gomb
      const loginButton = await this.page.$('button[type="submit"], button:contains("Sign In"), .login-btn');
      if (loginButton) {
        await loginButton.click();
        
        // Várakozás a válaszra
        await this.page.waitForTimeout(5000);
        
        const currentUrl = this.page.url();
        const loginSuccess = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
        
        this.addTestResult('User Login', loginSuccess, `URL: ${currentUrl}`);
      }
      
    } catch (error) {
      this.addTestResult('User Login', false, error.message);
    }
  }

  // === DASHBOARD HOZZÁFÉRÉS TESZT ===
  async testDashboardAccess() {
    console.log(chalk.yellow('📊 Dashboard hozzáférés tesztelése...'));
    
    try {
      // Várakozás a dashboard betöltésére
      await this.page.waitForTimeout(3000);
      
      // Dashboard elemek ellenőrzése
      const hasDashboardElements = await this.page.evaluate(() => {
        const indicators = [
          document.querySelector('.dashboard'),
          document.querySelector('[class*="tournament"]'),
          document.querySelector('[class*="profile"]'),
          document.querySelector('nav'),
          document.querySelector('.user-info')
        ];
        return indicators.some(el => el !== null);
      });
      
      const currentUrl = this.page.url();
      const isOnDashboard = currentUrl.includes('/dashboard') || hasDashboardElements;
      
      this.addTestResult('Dashboard Access', isOnDashboard, `Dashboard elérhető: ${currentUrl}`);
      
    } catch (error) {
      this.addTestResult('Dashboard Access', false, error.message);
    }
  }

  // === API INTEGRÁCIÓ TESZT ===
  async testAPIIntegration() {
    console.log(chalk.yellow('🔗 API integráció tesztelése...'));
    
    try {
      // API hívások figyelése
      const apiCalls = [];
      
      this.page.on('response', response => {
        if (response.url().includes(this.config.backendUrl)) {
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
          });
        }
      });
      
      // Oldal frissítése API hívások kiváltásához
      await this.page.reload({ waitUntil: 'networkidle2' });
      
      // Várakozás API hívásokra
      await this.page.waitForTimeout(5000);
      
      const hasSuccessfulApiCalls = apiCalls.some(call => call.status >= 200 && call.status < 400);
      const apiCallsCount = apiCalls.length;
      
      this.addTestResult('API Integration', hasSuccessfulApiCalls, `${apiCallsCount} API hívás, ${apiCalls.filter(c => c.status < 400).length} sikeres`);
      
      // API hívások részletei
      console.log(chalk.blue('📡 API hívások:'));
      apiCalls.forEach(call => {
        const statusColor = call.status < 400 ? chalk.green : chalk.red;
        console.log(statusColor(`  ${call.method} ${call.url} - ${call.status}`));
      });
      
    } catch (error) {
      this.addTestResult('API Integration', false, error.message);
    }
  }

  // === EREDMÉNYEK HOZZÁADÁSA ===
  addTestResult(testName, success, details) {
    this.testResults.push({
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // === TESZTELÉSI EREDMÉNYEK KIÍRÁSA ===
  printTestResults() {
    console.log('\n' + chalk.blue('🏆 TESZTELÉSI EREDMÉNYEK ÖSSZEFOGLALÓJA'));
    console.log('='.repeat(60));
    
    const successful = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? chalk.green : chalk.red;
      console.log(color(`${icon} ${result.test}: ${result.details}`));
    });
    
    console.log('\n' + chalk.blue(`📊 ÖSSZESEN: ${successful}/${total} teszt sikeres`));
    
    if (successful === total) {
      console.log(chalk.green('🎉 MINDEN TESZT SIKERES! A frontend-backend integráció működik!'));
    } else {
      console.log(chalk.yellow('⚠️ Vannak hibák, ellenőrizd a részleteket fent.'));
    }
  }

  // === TAKARÍTÁS ===
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.gray('🧹 Böngésző bezárva'));
    }
  }
}

// === FUTTATÓ SCRIPT ===
async function runAutomatedTest() {
  const tester = new LFALegacyAutoTester();
  await tester.runFullIntegrationTest();
}

// Közvetlen futtatás esetén
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutomatedTest().catch(console.error);
}

export { LFALegacyAutoTester, runAutomatedTest };