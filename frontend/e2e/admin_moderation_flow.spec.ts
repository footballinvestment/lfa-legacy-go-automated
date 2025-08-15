// frontend/e2e/admin_moderation_flow.spec.ts
// End-to-end tests for admin moderation workflows
// These tests require Playwright or Cypress to be set up

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Mock admin user credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@lfagolegacy.com',
};

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  await page.fill('[data-testid="username-input"]', ADMIN_CREDENTIALS.username);
  await page.fill('[data-testid="password-input"]', ADMIN_CREDENTIALS.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login and redirect
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  
  // Verify admin user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toContainText('admin');
}

// Helper function to navigate to admin panel
async function navigateToAdminPanel(page: Page) {
  // Look for admin menu or navigation
  await page.click('[data-testid="admin-menu"]');
  await expect(page).toHaveURL(/.*\/admin/);
}

// Helper function to create test user via API
async function createTestUser(page: Page, userData: any) {
  const response = await page.request.post(`${API_URL}/api/admin/users`, {
    data: userData,
    headers: {
      'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`,
    },
  });
  return await response.json();
}

test.describe('Admin Moderation Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await loginAsAdmin(page);
    await navigateToAdminPanel(page);
  });

  test.describe('User Management Workflow', () => {
    test('Admin can view user list and details', async () => {
      // Navigate to user management
      await page.click('[data-testid="user-management-link"]');
      await expect(page).toHaveURL(/.*\/admin\/users/);
      
      // Verify user list is loaded
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row"]').first()).toBeVisible();
      
      // Click on first user to view details
      await page.click('[data-testid="view-user-button"]');
      
      // User detail modal should open
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-overview-tab"]')).toBeVisible();
    });

    test('Admin can create violation for user', async () => {
      // Navigate to user management and open user details
      await page.click('[data-testid="user-management-link"]');
      await page.click('[data-testid="view-user-button"]');
      
      // Navigate to violations tab
      await page.click('[data-testid="violations-tab"]');
      await expect(page.locator('[data-testid="violations-content"]')).toBeVisible();
      
      // Click Add Violation button
      await page.click('[data-testid="add-violation-button"]');
      
      // Fill violation form
      await page.selectOption('[data-testid="violation-type-select"]', 'warning');
      await page.fill('[data-testid="violation-reason-input"]', 'E2E Test Violation');
      await page.fill('[data-testid="violation-notes-input"]', 'Created via E2E test');
      
      // Submit violation
      await page.click('[data-testid="save-violation-button"]');
      
      // Verify violation was created
      await expect(page.locator('[data-testid="violation-success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="violations-table"]')).toContainText('E2E Test Violation');
    });

    test('Admin can perform bulk user operations', async () => {
      // Navigate to advanced user management
      await page.click('[data-testid="advanced-user-management-link"]');
      await expect(page).toHaveURL(/.*\/admin\/users\/advanced/);
      
      // Select multiple users
      const userCheckboxes = page.locator('[data-testid="user-checkbox"]');
      await userCheckboxes.first().check();
      await userCheckboxes.nth(1).check();
      await userCheckboxes.nth(2).check();
      
      // Open bulk actions menu
      await page.click('[data-testid="bulk-actions-button"]');
      await expect(page.locator('[data-testid="bulk-actions-menu"]')).toBeVisible();
      
      // Select suspend action
      await page.click('[data-testid="bulk-suspend-button"]');
      
      // Confirm bulk operation modal should appear
      await expect(page.locator('[data-testid="bulk-operation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-users-count"]')).toContainText('3');
      
      // Add reason and confirm
      await page.fill('[data-testid="bulk-operation-reason"]', 'E2E bulk suspension test');
      await page.click('[data-testid="confirm-bulk-operation"]');
      
      // Wait for operation to complete
      await expect(page.locator('[data-testid="bulk-operation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-operation-results"]')).toContainText('3 successful');
    });
  });

  test.describe('Moderation Tools Workflow', () => {
    test('Admin can access moderation dashboard', async () => {
      // Navigate to moderation tools
      await page.click('[data-testid="moderation-tools-link"]');
      await expect(page).toHaveURL(/.*\/admin\/moderation/);
      
      // Verify dashboard elements
      await expect(page.locator('[data-testid="moderation-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-reports-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="open-reports-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-violations-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    });

    test('Admin can handle user reports', async () => {
      // Navigate to moderation tools and reports tab
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="reports-tab"]');
      
      // Verify reports list loads
      await expect(page.locator('[data-testid="reports-table"]')).toBeVisible();
      
      // Filter by open reports
      await page.selectOption('[data-testid="reports-filter"]', 'open');
      await page.click('[data-testid="reports-refresh"]');
      
      // Take action on first report (if any)
      const actionButton = page.locator('[data-testid="report-action-button"]').first();
      if (await actionButton.isVisible()) {
        await actionButton.click();
        
        // Report action dialog should open
        await expect(page.locator('[data-testid="report-action-modal"]')).toBeVisible();
        
        // Select dismiss action
        await page.selectOption('[data-testid="report-action-select"]', 'dismiss');
        await page.fill('[data-testid="report-action-notes"]', 'E2E test dismissal');
        
        // Confirm action
        await page.click('[data-testid="confirm-report-action"]');
        
        // Verify success
        await expect(page.locator('[data-testid="report-action-success"]')).toBeVisible();
      }
    });

    test('Admin can view moderation logs', async () => {
      // Navigate to moderation tools and logs tab
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="logs-tab"]');
      
      // Verify logs table loads
      await expect(page.locator('[data-testid="moderation-logs-table"]')).toBeVisible();
      
      // Verify log entries contain expected data
      const logRows = page.locator('[data-testid="log-row"]');
      if (await logRows.count() > 0) {
        await expect(logRows.first()).toContainText(/violation_created|user_suspended|report_/);
        
        // Test pagination if available
        const nextPageButton = page.locator('[data-testid="logs-next-page"]');
        if (await nextPageButton.isVisible()) {
          await nextPageButton.click();
          await expect(page.locator('[data-testid="moderation-logs-table"]')).toBeVisible();
        }
      }
    });

    test('Admin can configure moderation settings', async () => {
      // Navigate to moderation settings
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="settings-tab"]');
      
      // Verify settings interface
      await expect(page.locator('[data-testid="moderation-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="auto-assign-toggle"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-notifications-toggle"]')).toBeVisible();
      
      // Toggle auto-assign setting
      const autoAssignToggle = page.locator('[data-testid="auto-assign-toggle"]');
      const initialState = await autoAssignToggle.isChecked();
      
      await autoAssignToggle.click();
      
      // Verify toggle changed
      await expect(autoAssignToggle).toHaveProperty('checked', !initialState);
      
      // Test quick actions
      await page.click('[data-testid="generate-report-button"]');
      // Should trigger report generation (mock or actual)
    });
  });

  test.describe('Complete User Management Flow', () => {
    test('Complete moderation workflow: Report → Violation → Resolution', async () => {
      // Step 1: Create a mock user report (via API or UI)
      const testUser = await createTestUser(page, {
        username: 'e2e_test_user',
        email: 'e2e@test.com',
        full_name: 'E2E Test User',
        user_type: 'player',
      });

      // Step 2: Navigate to reports and create violation
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="reports-tab"]');
      
      // If no reports exist, we'll simulate the workflow
      await page.click('[data-testid="violations-tab"]');
      await expect(page.locator('[data-testid="violations-table"]')).toBeVisible();
      
      // Step 3: Navigate to user management to verify user
      await page.click('[data-testid="user-management-link"]');
      await page.fill('[data-testid="user-search"]', 'e2e_test_user');
      
      // Find and click on our test user
      await expect(page.locator('[data-testid="user-row"]')).toContainText('e2e_test_user');
      await page.click('[data-testid="view-user-button"]');
      
      // Step 4: Add violation to user
      await page.click('[data-testid="violations-tab"]');
      await page.click('[data-testid="add-violation-button"]');
      
      await page.selectOption('[data-testid="violation-type-select"]', 'warning');
      await page.fill('[data-testid="violation-reason-input"]', 'Complete E2E workflow test');
      await page.click('[data-testid="save-violation-button"]');
      
      // Step 5: Verify violation appears in moderation logs
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="logs-tab"]');
      
      await expect(page.locator('[data-testid="moderation-logs-table"]'))
        .toContainText('violation_created');
      
      // Step 6: Resolve the violation
      await page.click('[data-testid="user-management-link"]');
      await page.fill('[data-testid="user-search"]', 'e2e_test_user');
      await page.click('[data-testid="view-user-button"]');
      await page.click('[data-testid="violations-tab"]');
      
      // Edit the violation to resolve it
      await page.click('[data-testid="edit-violation-button"]');
      await page.selectOption('[data-testid="violation-status-select"]', 'resolved');
      await page.fill('[data-testid="violation-notes-input"]', 'Resolved via E2E test');
      await page.click('[data-testid="update-violation-button"]');
      
      // Verify resolution
      await expect(page.locator('[data-testid="violation-status"]')).toContainText('resolved');
    });

    test('User search and filtering workflow', async () => {
      // Navigate to advanced user management
      await page.click('[data-testid="advanced-user-management-link"]');
      
      // Test search functionality
      await page.fill('[data-testid="user-search-input"]', 'test');
      await expect(page.locator('[data-testid="users-table"]')).toContainText('test');
      
      // Test status filtering
      await page.click('[data-testid="filter-button"]');
      await page.selectOption('[data-testid="status-filter"]', 'active');
      await page.click('[data-testid="apply-filter"]');
      
      // Verify filtered results
      const statusChips = page.locator('[data-testid="user-status-chip"]');
      const count = await statusChips.count();
      for (let i = 0; i < count; i++) {
        await expect(statusChips.nth(i)).toContainText('active');
      }
      
      // Test view mode switching
      await page.click('[data-testid="card-view-button"]');
      await expect(page.locator('[data-testid="users-cards"]')).toBeVisible();
      
      await page.click('[data-testid="table-view-button"]');
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Handles API errors gracefully', async () => {
      // Navigate to user management
      await page.click('[data-testid="user-management-link"]');
      
      // Try to access non-existent user
      await page.goto(`${BASE_URL}/admin/users/999999`);
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]'))
        .toContainText('User not found');
    });

    test('Validates form inputs', async () => {
      // Navigate to user details and try to create invalid violation
      await page.click('[data-testid="user-management-link"]');
      await page.click('[data-testid="view-user-button"]');
      await page.click('[data-testid="violations-tab"]');
      await page.click('[data-testid="add-violation-button"]');
      
      // Try to submit without required fields
      await page.click('[data-testid="save-violation-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="violation-type-error"]'))
        .toContainText('required');
    });

    test('Handles network errors', async () => {
      // Simulate network offline
      await page.context().setOffline(true);
      
      // Try to perform action that requires network
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="reports-tab"]');
      
      // Should show network error or loading state
      await expect(page.locator('[data-testid="error-message"], [data-testid="loading-indicator"]'))
        .toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('Loads moderation interface within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.click('[data-testid="moderation-tools-link"]');
      await expect(page.locator('[data-testid="moderation-overview"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('Has proper accessibility attributes', async () => {
      await page.click('[data-testid="moderation-tools-link"]');
      
      // Check for proper ARIA labels and roles
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tab"]').first()).toHaveAttribute('aria-selected');
      
      // Check for proper heading hierarchy
      await expect(page.locator('h1, h2, h3, h4, h5, h6').first()).toBeVisible();
      
      // Check that interactive elements are keyboard accessible
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('Handles large data sets efficiently', async () => {
      // Navigate to logs which might have many entries
      await page.click('[data-testid="moderation-tools-link"]');
      await page.click('[data-testid="logs-tab"]');
      
      // Should handle pagination without performance issues
      const startTime = Date.now();
      
      if (await page.locator('[data-testid="logs-next-page"]').isVisible()) {
        await page.click('[data-testid="logs-next-page"]');
        await expect(page.locator('[data-testid="moderation-logs-table"]')).toBeVisible();
      }
      
      const paginationTime = Date.now() - startTime;
      expect(paginationTime).toBeLessThan(2000); // Pagination should be fast
    });
  });

  // Cleanup after tests
  test.afterEach(async () => {
    // Clear any test data or reset state if needed
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear();
      sessionStorage.clear();
    });
  });
});

// Test configuration and setup
test.describe.configure({ 
  mode: 'parallel', 
  timeout: 30000 
});

// Global test hooks
test.beforeAll(async () => {
  // Setup test database or mock data if needed
  console.log('Setting up E2E test environment...');
});

test.afterAll(async () => {
  // Cleanup test environment
  console.log('Cleaning up E2E test environment...');
});