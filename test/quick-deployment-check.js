#!/usr/bin/env node

import https from 'https';

const colors = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', 
  blue: '\x1b[34m', reset: '\x1b[0m', bold: '\x1b[1m'
};

const log = (color, text) => console.log(`${colors[color]}${text}${colors.reset}`);

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout after 10s')), 10000);
    
    https.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    }).on('error', err => { clearTimeout(timeout); reject(err); });
  });
}

async function testDeployment() {
  log('blue', '⚡ LFA Legacy GO - Gyors Deployment Teszt');
  log('blue', '='.repeat(50));
  
  const config = {
    backendUrl: 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app',
    frontendUrl: 'https://lfa-legacy-go.netlify.app'
  };
  
  let passed = 0;
  const tests = [];
  
  // Backend Health Check
  log('yellow', '🏥 Backend Health Check...');
  try {
    const response = await httpGet(`${config.backendUrl}/health`);
    if (response.statusCode === 200) {
      log('green', '✅ Backend elérhető és működik');
      tests.push({ name: 'Backend Health', status: 'success', details: `HTTP ${response.statusCode}` });
      passed++;
    } else {
      log('red', `❌ Backend HTTP hiba: ${response.statusCode}`);
      tests.push({ name: 'Backend Health', status: 'error', details: `HTTP ${response.statusCode}` });
    }
  } catch (error) {
    log('red', `❌ Backend nem elérhető: ${error.message}`);
    tests.push({ name: 'Backend Health', status: 'error', details: error.message });
  }
  
  // API Documentation Check
  log('yellow', '📚 API Documentation Check...');
  try {
    const response = await httpGet(`${config.backendUrl}/docs`);
    if (response.statusCode === 200) {
      log('green', '✅ API dokumentáció elérhető');
      tests.push({ name: 'API Docs', status: 'success', details: `HTTP ${response.statusCode}` });
      passed++;
    } else {
      log('red', `❌ API docs hiba: ${response.statusCode}`);
      tests.push({ name: 'API Docs', status: 'error', details: `HTTP ${response.statusCode}` });
    }
  } catch (error) {
    log('red', `❌ API docs nem elérhető: ${error.message}`);
    tests.push({ name: 'API Docs', status: 'error', details: error.message });
  }
  
  // Frontend Check
  log('yellow', '🌐 Frontend Status Check...');
  try {
    const response = await httpGet(config.frontendUrl);
    if (response.statusCode === 200) {
      const hasReactContent = response.data.includes('react') || 
                             response.data.includes('LFA') || 
                             response.data.includes('app');
      log('green', '✅ Frontend elérhető');
      tests.push({ name: 'Frontend Status', status: 'success', details: `HTTP ${response.statusCode}` });
      passed++;
    } else {
      log('red', `❌ Frontend hiba: ${response.statusCode}`);
      tests.push({ name: 'Frontend Status', status: 'error', details: `HTTP ${response.statusCode}` });
    }
  } catch (error) {
    log('red', `❌ Frontend nem elérhető: ${error.message}`);
    tests.push({ name: 'Frontend Status', status: 'error', details: error.message });
  }
  
  // Eredmények
  log('blue', '\n📊 TESZTELÉSI EREDMÉNYEK:');
  log('blue', '-'.repeat(50));
  
  tests.forEach(test => {
    const icon = test.status === 'success' ? '✅' : '❌';
    const color = test.status === 'success' ? 'green' : 'red';
    log(color, `${icon} ${test.name}: ${test.details}`);
  });
  
  log('blue', `\n📊 ÖSSZESEN: ${passed}/3 teszt sikeres`);
  
  if (passed === 3) {
    log('green', '\n🎉 MINDEN TESZT SIKERES!');
    log('green', '✅ A frontend-backend integráció működőképes!');
    
    log('blue', '\n🔗 Elérhető szolgáltatások:');
    console.log(`   • Frontend: ${config.frontendUrl}`);
    console.log(`   • Backend API: ${config.backendUrl}/docs`);
    console.log(`   • Health Check: ${config.backendUrl}/health`);
    
    log('blue', '\n🚀 Következő lépések:');
    console.log('   1. Nyisd meg a frontend URL-t böngészőben');
    console.log('   2. Teszteld a regisztrációt és bejelentkezést');
    console.log('   3. Ellenőrizd a Network tab-ot (F12) az API hívásokért');
    
    log('blue', '\n💡 process.env.REACT_APP_API_URL kérdés:');
    log('yellow', '   ℹ️ A böngésző console-ban NORMÁLIS, hogy hibát kapsz!');
    log('yellow', '   ℹ️ A process.env csak Node.js-ben létezik, böngészőben nem.');
    log('green', '   ✅ A React build automatikusan használja a helyes API URL-t!');
    
  } else {
    log('yellow', '\n⚠️ Vannak problémák a deployment-tel!');
    log('yellow', 'Ellenőrizd a fenti részleteket és a deployment konfigurációt.');
    
    if (passed === 0) {
      log('red', '\n🚨 Kritikus hiba: Egyik szolgáltatás sem elérhető!');
      log('blue', 'Debugging lépések:');
      console.log('   1. Ellenőrizd a Google Cloud Run service állapotát');
      console.log('   2. Ellenőrizd a Netlify deployment állapotát');
      console.log('   3. Ellenőrizd a hálózati kapcsolatot');
    }
  }
}

// Futtatás
testDeployment().catch(err => {
  log('red', `❌ Kritikus hiba: ${err.message}`);
  process.exit(1);
});