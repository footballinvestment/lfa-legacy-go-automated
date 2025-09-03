// === Gyors Deployment Ellenőrző ===
// Fájl: test/quick-deployment-check.js

import fetch from 'node-fetch';
import chalk from 'chalk';

class QuickDeploymentChecker {
  constructor() {
    this.config = {
      frontendUrl: 'https://lfa-legacy-go.netlify.app',
      backendUrl: 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app',
      timeout: 10000
    };
  }

  async runQuickCheck() {
    console.log(chalk.blue('⚡ LFA Legacy GO - Gyors Deployment Ellenőrzés'));
    console.log('='.repeat(50));
    
    const checks = [
      this.checkBackendHealth(),
      this.checkBackendAPI(),
      this.checkFrontendStatus(),
      this.checkCORSConfiguration()
    ];
    
    const results = await Promise.allSettled(checks);
    
    this.printResults(results);
    
    const allPassed = results.every(result => result.status === 'fulfilled' && result.value.success);
    
    if (allPassed) {
      console.log(chalk.green('\n🎉 MINDEN ELLENŐRZÉS SIKERES!'));
      console.log(chalk.green('✅ A frontend-backend integráció működőképes!'));
      console.log(chalk.blue('\n🔗 Hivatkozások:'));
      console.log(`   Frontend: ${this.config.frontendUrl}`);
      console.log(`   Backend API Docs: ${this.config.backendUrl}/docs`);
    } else {
      console.log(chalk.yellow('\n⚠️ Vannak problémák, futtasd a teljes tesztet!'));
      console.log(chalk.gray('   Parancs: npm run test:auto'));
    }
  }

  async checkBackendHealth() {
    try {
      console.log(chalk.yellow('🏥 Backend Health Check...'));
      
      const response = await fetch(`${this.config.backendUrl}/health`, {
        method: 'GET',
        timeout: this.config.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        name: 'Backend Health',
        message: `✅ Backend elérhető (${response.status})`,
        details: data
      };
      
    } catch (error) {
      return {
        success: false,
        name: 'Backend Health',
        message: `❌ Backend nem elérhető: ${error.message}`,
        error
      };
    }
  }

  async checkBackendAPI() {
    try {
      console.log(chalk.yellow('📚 API Documentation Check...'));
      
      const response = await fetch(`${this.config.backendUrl}/docs`, {
        method: 'GET',
        timeout: this.config.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return {
        success: true,
        name: 'API Documentation',
        message: `✅ API docs elérhető (${response.status})`,
        details: `${this.config.backendUrl}/docs`
      };
      
    } catch (error) {
      return {
        success: false,
        name: 'API Documentation',
        message: `❌ API docs nem elérhető: ${error.message}`,
        error
      };
    }
  }

  async checkFrontendStatus() {
    try {
      console.log(chalk.yellow('🌐 Frontend Status Check...'));
      
      const response = await fetch(this.config.frontendUrl, {
        method: 'GET',
        timeout: this.config.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const hasReactApp = html.includes('react') || html.includes('app') || html.includes('LFA');
      
      return {
        success: true,
        name: 'Frontend Status',
        message: `✅ Frontend elérhető (${response.status})`,
        details: `React App: ${hasReactApp ? 'Talált' : 'Nem talált'}`
      };
      
    } catch (error) {
      return {
        success: false,
        name: 'Frontend Status',
        message: `❌ Frontend nem elérhető: ${error.message}`,
        error
      };
    }
  }

  async checkCORSConfiguration() {
    try {
      console.log(chalk.yellow('🔀 CORS Configuration Check...'));
      
      // Preflight request szimulálása
      const response = await fetch(`${this.config.backendUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': this.config.frontendUrl,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: this.config.timeout
      });
      
      const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
      const allowMethods = response.headers.get('Access-Control-Allow-Methods');
      
      const corsConfigured = allowOrigin && (allowOrigin === '*' || allowOrigin.includes('netlify'));
      
      return {
        success: corsConfigured,
        name: 'CORS Configuration',
        message: corsConfigured ? '✅ CORS megfelelően konfigurált' : '⚠️ CORS konfiguráció ellenőrzendő',
        details: {
          allowOrigin,
          allowMethods,
          status: response.status
        }
      };
      
    } catch (error) {
      return {
        success: false,
        name: 'CORS Configuration',
        message: `❌ CORS ellenőrzés sikertelen: ${error.message}`,
        error
      };
    }
  }

  printResults(results) {
    console.log(chalk.blue('\n📊 ELLENŐRZÉSI EREDMÉNYEK:'));
    console.log('-'.repeat(40));
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const check = result.value;
        const color = check.success ? chalk.green : chalk.red;
        console.log(color(check.message));
        
        if (check.details && typeof check.details === 'object') {
          console.log(chalk.gray(`   ${JSON.stringify(check.details, null, 2)}`));
        } else if (check.details) {
          console.log(chalk.gray(`   ${check.details}`));
        }
      } else {
        console.log(chalk.red(`❌ Ellenőrzés ${index + 1} hibával ért véget: ${result.reason.message}`));
      }
    });
  }
}

// === Environment Variable Ellenőrzés ===
async function checkEnvironmentVariables() {
  console.log(chalk.blue('\n🔧 Environment Variables Ellenőrzés'));
  console.log('-'.repeat(40));
  
  // Szimuláljuk azt amit a frontend build-ben látna
  const expectedApiUrl = 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app';
  
  console.log(chalk.yellow('📝 Elvárt konfiguráció:'));
  console.log(`   REACT_APP_API_URL: ${expectedApiUrl}`);
  console.log(`   REACT_APP_DEBUG: false (production)`);
  
  console.log(chalk.blue('\n💡 Netlify Environment Variables ellenőrzése:'));
  console.log('   1. Menj a Netlify Dashboard-ra');
  console.log('   2. Site Settings → Environment Variables');
  console.log('   3. Ellenőrizd hogy REACT_APP_API_URL helyes-e');
  console.log('   4. Ha módosítottad, trigger újra deployment-et');
}

// === Fő futtatási függvény ===
async function runQuickCheck() {
  const checker = new QuickDeploymentChecker();
  await checker.runQuickCheck();
  await checkEnvironmentVariables();
  
  console.log(chalk.blue('\n🚀 Következő lépések:'));
  console.log('   • Teljes teszt: npm run test:auto');
  console.log('   • API részletes teszt: npm run test:api');
  console.log('   • Manual teszt: Nyisd meg a frontend URL-t böngészőben');
}

// Közvetlen futtatás esetén
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickCheck().catch(console.error);
}

export default runQuickCheck;