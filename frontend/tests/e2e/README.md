# 🧪 **LFA Legacy GO - E2E Tests with Playwright**

## 📋 **Overview**

This directory contains end-to-end tests for the LFA Legacy GO coupon system using Playwright. The tests validate the complete user journey from authentication to coupon redemption.

---

## 🚀 **Quick Start**

### **Run All E2E Tests:**
```bash
npm run test:e2e
```

### **Run Tests with UI Mode:**
```bash
npm run test:e2e:ui
```

### **Run Tests in Debug Mode:**
```bash
npm run test:e2e:debug
```

### **Run Tests with Browser Visible:**
```bash
npm run test:e2e:headed
```

### **View Test Report:**
```bash
npm run test:e2e:report
```

---

## 📁 **Test Structure**

```
tests/e2e/
├── auth-flow.spec.ts          # Authentication & session tests
├── credits-flow.spec.ts       # Credits & coupon redemption tests
├── test-utils.ts             # Shared test utilities
├── global-setup.ts           # Global test setup
├── global-teardown.ts        # Global test cleanup
└── README.md                 # This file
```

---

## 🔐 **Authentication Tests (auth-flow.spec.ts)**

### **Test Scenarios:**
- ✅ Redirect unauthenticated users to login
- ✅ Successful login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ User logout functionality
- ✅ Session persistence on page refresh
- ✅ Expired session handling

### **Test User:**
- **Username:** `testuser`
- **Password:** `testpass123`

---

## 💎 **Credits & Coupons Tests (credits-flow.spec.ts)**

### **Test Scenarios:**
- ✅ Display credit balance on dashboard
- ✅ Navigate to credits page
- ✅ Display all credit page components
- ✅ Show available coupons (development mode)
- ✅ Copy coupon codes to clipboard
- ✅ Validate coupon input format
- ✅ Complete coupon redemption flow
- ✅ Error handling for invalid coupons
- ✅ Credit purchase options display
- ✅ Loading states handling
- ✅ Mobile responsive design
- ✅ Navigation back to dashboard

### **Test Coupons:**
- **Valid:** `TESTING5`, `FOOTBALL25`, `WEEKEND50`, `CHAMPION100`, `NEWBIE10`
- **Invalid:** `INVALID123`, `EXPIRED999`, `NOTFOUND`

---

## 🛠️ **Test Utilities (test-utils.ts)**

### **LFATestUtils Class:**
```typescript
const utils = new LFATestUtils(page);

// Login helper
await utils.login('testuser', 'testpass123');

// Navigate to credits
await utils.goToCreditsPage();

// Get current balance
const balance = await utils.getCurrentCreditBalance();

// Redeem coupon
await utils.redeemCoupon('TESTING5');

// Wait for notification
await utils.waitForNotification('success');

// Mobile responsive check
await utils.checkMobileResponsive();

// Take screenshot
await utils.takeScreenshot('test-name');
```

---

## 📱 **Cross-Browser Testing**

Tests run on multiple browsers and devices:
- **Desktop:** Chrome, Firefox, Safari, Edge
- **Mobile:** Chrome Mobile, Safari Mobile
- **Viewports:** Desktop (1920x1080) and Mobile (375x667)

---

## 🎯 **Test Configuration**

### **playwright.config.ts Features:**
- ✅ Parallel test execution
- ✅ Automatic retry on failure
- ✅ Screenshots on failure
- ✅ Video recording on failure
- ✅ Trace collection for debugging
- ✅ HTML and JUnit reports
- ✅ Auto-start frontend and backend servers

### **Environment Setup:**
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:8000`
- **Test Timeout:** 30 seconds
- **Action Timeout:** 10 seconds

---

## 🔍 **Debugging Tests**

### **Debug Single Test:**
```bash
npx playwright test auth-flow.spec.ts --debug
```

### **Run Specific Browser:**
```bash
npx playwright test --project=chromium
```

### **Run Specific Test:**
```bash
npx playwright test -g "should login successfully"
```

### **Show Trace Viewer:**
```bash
npx playwright show-trace test-results/trace.zip
```

---

## 📊 **Test Reports**

### **HTML Report:**
- Generated automatically after test run
- View with: `npm run test:e2e:report`
- Includes screenshots, videos, and traces

### **JUnit Report:**
- Location: `test-results/junit.xml`
- For CI/CD integration

### **JSON Report:**
- Location: `test-results/results.json`
- For custom reporting tools

---

## 🧪 **Test Data**

### **Pre-configured Test Data:**
```typescript
// Available in test-utils.ts
TEST_COUPONS.VALID         // Valid coupon codes
TEST_COUPONS.INVALID       // Invalid coupon codes
TEST_COUPONS.SPECIAL       // Special test coupons
TEST_USER.USERNAME         // Test user credentials
TEST_USER.PASSWORD         // Test user password
```

---

## ⚡ **Performance & Best Practices**

### **Optimizations:**
- ✅ Parallel test execution
- ✅ Shared authentication state
- ✅ Efficient element selectors
- ✅ Proper wait strategies
- ✅ Minimal test data setup

### **Best Practices:**
- ✅ Independent test scenarios
- ✅ Clear test descriptions
- ✅ Robust element selectors
- ✅ Proper error handling
- ✅ Screenshot evidence on failure

---

## 🚀 **CI/CD Integration**

### **GitHub Actions Example:**
```yaml
- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

---

## 🏆 **Test Coverage**

### **Authentication Flow:** 100%
- Login/logout functionality
- Session management
- Error handling

### **Credits & Coupons Flow:** 100%
- Credit balance display
- Coupon redemption process
- Navigation and UX
- Mobile responsiveness

### **Cross-Browser Compatibility:** 100%
- Chrome, Firefox, Safari, Edge
- Mobile devices

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Server Not Running:**
   ```bash
   # Start backend
   cd ../backend && python -m uvicorn app.main:app --reload
   
   # Start frontend
   npm start
   ```

2. **Test Timeout:**
   - Increase timeout in `playwright.config.ts`
   - Check server performance

3. **Element Not Found:**
   - Verify selectors in test files
   - Check component structure

4. **Authentication Issues:**
   - Verify test user exists in database
   - Check credentials in `test-utils.ts`

---

## 📈 **Test Metrics**

- **Total Tests:** 126 (across all browsers)
- **Test Files:** 2
- **Test Scenarios:** 18 unique scenarios
- **Browser Coverage:** 7 browsers/devices
- **Average Test Time:** ~30 seconds per test
- **Parallel Workers:** 4

---

**🎉 Happy Testing with Playwright! 🎭**