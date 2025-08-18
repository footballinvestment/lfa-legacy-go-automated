// Debug script to find the login form structure
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'login-page-debug.png', fullPage: true });
  
  // Log all input elements
  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input elements:');
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const id = await input.getAttribute('id');
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const ariaLabel = await input.getAttribute('aria-label');
    
    console.log(`Input ${i}:`, {
      id,
      name,
      type,
      placeholder,
      ariaLabel,
      isVisible: await input.isVisible()
    });
  }
  
  // Try to find by text labels
  const labels = await page.locator('label').all();
  console.log('\nFound', labels.length, 'label elements:');
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const text = await label.textContent();
    const forAttr = await label.getAttribute('for');
    console.log(`Label ${i}:`, { text, for: forAttr });
  }
  
  await browser.close();
})();