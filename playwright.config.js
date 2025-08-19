// =============================================
// LFA LEGACY GO - PLAYWRIGHT CONFIGURATION
// Optimized for infinite loop detection and visual automation
// =============================================

const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/automation',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for better loop detection
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Single worker for stability
  
  /* Global test timeout */
  timeout: 120000, // 2 minutes per test
  
  /* Expect timeout */
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    ['json', {
      outputFile: 'test-results/results.json'
    }],
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    ...(process.env.CI ? [['github']] : [['list']])
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.FRONTEND_URL || 'https://lfa-legacy-go.netlify.app',

    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    
    /* Run in headed mode for visual debugging (can be overridden) */
    headless: process.env.CI ? true : false,
    
    /* Action and navigation timeouts */
    actionTimeout: 30000,      // 30 seconds for actions
    navigationTimeout: 60000,  // 60 seconds for navigation (important for loop detection)
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure and always for visual tests */
    screenshot: 'always',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Custom user agent for automation identification */
    userAgent: 'LFA-Legacy-GO-Automation-Bot/1.0 (+https://github.com/lfa-legacy-go/automation)',
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Automation-Test': 'true',
      'X-Test-Environment': process.env.NODE_ENV || 'test'
    },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Storage state for maintaining auth across tests if needed */
    // storageState: 'tests/automation/auth-state.json'
  },

  /* Configure output directory */
  outputDir: 'test-results/automation/',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings for loop detection
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
    },
    
    // Uncomment to test on other browsers (optional)
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */

    /* Test against mobile viewports (optional) */
    /*
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Web Server for local development testing (optional) */
  webServer: process.env.CI ? undefined : {
    command: 'cd frontend && npm start',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'development',
      REACT_APP_API_URL: process.env.BACKEND_URL || 'http://localhost:8080'
    }
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/automation/global-setup.js'),
  // globalTeardown: require.resolve('./tests/automation/global-teardown.js'),

  /* Test metadata */
  metadata: {
    project: 'LFA Legacy GO',
    testType: 'Visual Automation & Infinite Loop Detection', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    frontend: process.env.FRONTEND_URL || 'https://lfa-legacy-go.netlify.app',
    backend: process.env.BACKEND_URL || 'https://lfa-legacy-go-backend-376491487980.us-central1.run.app'
  }
});

// =============================================
// CONFIGURATION NOTES
// =============================================
/*
📋 Key Features:
✅ Infinite loop detection optimized settings
✅ Visual artifact collection (screenshots, videos, traces)  
✅ CI/CD integration with GitHub Actions
✅ Multiple reporter formats (HTML, JSON, JUnit)
✅ Flexible browser support
✅ Environment-specific configurations
✅ Comprehensive timeout management

🔧 Usage:
- Local testing: npx playwright test
- Headed mode: npx playwright test --headed  
- Debug mode: npx playwright test --debug
- Specific test: npx playwright test tests/automation/lfa-visual-automation.spec.js
- CI mode: Automatically configured via environment variables

🎯 Optimization for Loop Detection:
- Single worker to avoid race conditions
- Extended navigation timeouts (60s)
- Always capture screenshots for debugging
- Sequential test execution for stability
- Custom headers for request tracking
*/