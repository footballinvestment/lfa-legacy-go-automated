// Debug script to identify React Error #130 source
const puppeteer = require('puppeteer');

async function debugReactError() {
  console.log('🔍 Starting React Error #130 debug session...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (text.includes('130') || text.includes('invalid element') || text.includes('React')) {
        console.log(`🚨 REACT ERROR: [${type.toUpperCase()}] ${text}`);
      } else {
        console.log(`📝 Console [${type}]: ${text}`);
      }
    });
    
    // Capture all errors
    page.on('error', err => {
      console.log(`💥 PAGE ERROR: ${err.message}`);
      console.log(`Stack: ${err.stack}`);
    });
    
    // Capture unhandled promise rejections
    page.on('pageerror', err => {
      console.log(`🔥 PAGE ERROR: ${err.message}`);
      console.log(`Stack: ${err.stack}`);
    });
    
    console.log('📡 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('⏱️ Waiting 5 seconds for any delayed errors...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to trigger login flow to see if error occurs there
    console.log('🔐 Checking if login form exists...');
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Login form found, trying to interact...');
      // Add more specific debugging here
    }
    
    console.log('✅ Debug session completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugReactError();