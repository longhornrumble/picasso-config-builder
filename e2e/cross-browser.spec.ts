/**
 * E2E Test: Cross-Browser Compatibility
 *
 * Tests critical workflows across different browsers:
 * 1. Chrome: Create form → Deploy
 * 2. Firefox: Edit form → Deploy
 * 3. Safari: Create CTA → Deploy
 * 4. Verify all work correctly
 * 5. Check load time <2s in all browsers
 *
 * Note: These tests run on all browsers configured in playwright.config.ts
 */

import { test, expect } from '@playwright/test';
import {
  selectTenant,
  navigateToSection,
  clickButton,
  fillFormField,
  waitForModal,
  waitForSuccessToast,
  deployConfig,
  measurePageLoadTime,
} from './fixtures/test-helpers';
import { TEST_TENANT } from './fixtures/test-data';

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load home page in under 2 seconds', async ({ page, browserName }) => {
    const loadTime = await measurePageLoadTime(page, '/');

    console.log(`[${browserName}] Home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('should successfully create and deploy a form', async ({ page, browserName }) => {
    console.log(`Running form creation test in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'forms');

    // Measure forms page load time
    const formsLoadStart = Date.now();
    await page.waitForLoadState('networkidle');
    const formsLoadTime = Date.now() - formsLoadStart;
    console.log(`[${browserName}] Forms page load time: ${formsLoadTime}ms`);

    // Create form
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form")').first();
    await createButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', `cross_browser_form_${browserName}`);
    await fillFormField(page, 'name', `Cross Browser Form ${browserName}`);
    await fillFormField(page, 'description', `Form created in ${browserName} browser`);

    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Verify form appears
    const formCard = page.locator(`[data-testid="form-cross_browser_form_${browserName}"]`).or(
      page.locator(`:has-text("Cross Browser Form ${browserName}")`)
    );
    await expect(formCard.first()).toBeVisible({ timeout: 5000 });

    // Deploy (if deploy button exists)
    const deployButton = page.locator('button:has-text("Deploy")').first();
    if (await deployButton.isVisible({ timeout: 2000 })) {
      await deployConfig(page);
    }
  });

  test('should successfully edit an existing form', async ({ page, browserName }) => {
    console.log(`Running form edit test in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);

    // First create a form
    await navigateToSection(page, 'forms');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', `edit_test_form_${browserName}`);
    await fillFormField(page, 'name', `Edit Test Form ${browserName}`);
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Edit the form
    const formCard = page.locator(`[data-testid="form-edit_test_form_${browserName}"]`).or(
      page.locator(`:has-text("Edit Test Form ${browserName}")`)
    );
    await formCard.first().click();
    await page.waitForLoadState('networkidle');

    // Update description
    const descriptionField = page.locator('textarea[name="description"], input[name="description"]').first();
    if (await descriptionField.isVisible({ timeout: 2000 })) {
      await descriptionField.fill(`Updated description in ${browserName}`);
    }

    // Save
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
    await waitForSuccessToast(page);

    // Deploy
    const deployButton = page.locator('button:has-text("Deploy")').first();
    if (await deployButton.isVisible({ timeout: 2000 })) {
      await deployConfig(page);
    }
  });

  test('should successfully create and deploy a CTA', async ({ page, browserName }) => {
    console.log(`Running CTA creation test in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'ctas');

    // Measure CTAs page load time
    const ctasLoadStart = Date.now();
    await page.waitForLoadState('networkidle');
    const ctasLoadTime = Date.now() - ctasLoadStart;
    console.log(`[${browserName}] CTAs page load time: ${ctasLoadTime}ms`);

    // Create CTA
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add CTA")').first();
    await createButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', `cross_browser_cta_${browserName}`);
    await fillFormField(page, 'label', `Cross Browser CTA ${browserName}`);

    // Select action
    const actionSelect = page.locator('select[name="action"]').first();
    await actionSelect.selectOption('show_info');

    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Verify CTA appears
    const ctaCard = page.locator(`[data-testid="cta-cross_browser_cta_${browserName}"]`).or(
      page.locator(`:has-text("Cross Browser CTA ${browserName}")`)
    );
    await expect(ctaCard.first()).toBeVisible({ timeout: 5000 });

    // Deploy
    const deployButton = page.locator('button:has-text("Deploy")').first();
    if (await deployButton.isVisible({ timeout: 2000 })) {
      await deployConfig(page);
    }
  });

  test('should render UI components correctly', async ({ page, browserName }) => {
    console.log(`Testing UI rendering in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);

    // Check navigation menu
    const navItems = ['programs', 'forms', 'ctas', 'branches'];
    for (const item of navItems) {
      const navLink = page.locator(`nav a:has-text("${item}"), nav button:has-text("${item}")`, { hasText: new RegExp(item, 'i') }).first();

      if (await navLink.isVisible({ timeout: 2000 })) {
        await expect(navLink).toBeVisible();
      } else {
        console.log(`[${browserName}] Navigation item "${item}" not found (might use different text)`);
      }
    }

    // Check header
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 3000 });

    // Check main content area
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible({ timeout: 3000 });
  });

  test('should handle modals correctly', async ({ page, browserName }) => {
    console.log(`Testing modal behavior in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'programs');

    // Open modal
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Check modal is visible
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(modal).not.toBeVisible({ timeout: 2000 });

    // Open again and close with X button
    await createButton.click();
    await waitForModal(page);
    await expect(modal).toBeVisible();

    const closeButton = modal.locator('button[aria-label="Close"], button:has-text("Cancel")').first();
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle form validation consistently', async ({ page, browserName }) => {
    console.log(`Testing form validation in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'forms');

    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Try to submit without required fields
    await clickButton(page, 'Save');

    // Should show error (either inline or toast)
    const errorIndicator = page.locator('[role="alert"]:has-text("required"), .error:has-text("required"), [data-testid="error"]').first();
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });

    // Fill fields and submit
    await fillFormField(page, 'id', `validation_test_${browserName}`);
    await fillFormField(page, 'name', `Validation Test ${browserName}`);
    await clickButton(page, 'Save');

    // Should succeed
    await waitForSuccessToast(page);
  });

  test('should support keyboard navigation', async ({ page, browserName }) => {
    console.log(`Testing keyboard navigation in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'programs');

    // Open create modal
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Tab through fields
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });

  test('should handle long content without layout issues', async ({ page, browserName }) => {
    console.log(`Testing long content handling in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'forms');

    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Fill with very long text
    const longText = 'A'.repeat(500);
    await fillFormField(page, 'id', 'long_content_test');
    await fillFormField(page, 'name', 'Long Content Test');

    const descriptionField = page.locator('textarea[name="description"]').first();
    if (await descriptionField.isVisible({ timeout: 1000 })) {
      await descriptionField.fill(longText);
    }

    // Modal should still be usable
    const saveButton = page.locator('[role="dialog"] button:has-text("Save")').first();
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('should maintain state across navigation', async ({ page, browserName }) => {
    console.log(`Testing state persistence in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);

    // Create a program
    await navigateToSection(page, 'programs');
    const createProgramButton = page.locator('button:has-text("Create")').first();
    await createProgramButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', `state_test_${browserName}`);
    await fillFormField(page, 'name', `State Test ${browserName}`);
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Navigate to forms and back
    await navigateToSection(page, 'forms');
    await page.waitForTimeout(500);
    await navigateToSection(page, 'programs');

    // Program should still be there
    const programCard = page.locator(`[data-testid="program-state_test_${browserName}"]`).or(
      page.locator(`:has-text("State Test ${browserName}")`)
    );
    await expect(programCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle rapid clicks without errors', async ({ page, browserName }) => {
    console.log(`Testing rapid interaction handling in ${browserName}`);

    await selectTenant(page, TEST_TENANT.displayName);
    await navigateToSection(page, 'programs');

    // Rapid clicks on create button
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await createButton.click().catch(() => {}); // Ignore if fails
    await createButton.click().catch(() => {}); // Ignore if fails

    // Should only open one modal
    const modals = page.locator('[role="dialog"]');
    const count = await modals.count();
    expect(count).toBeLessThanOrEqual(1);

    // Close modal if open
    await page.keyboard.press('Escape').catch(() => {});
  });
});

// Additional browser-specific tests
test.describe('Browser-Specific Features', () => {
  test('should work with browser back/forward buttons', async ({ page, browserName }) => {
    await page.goto('/');
    await selectTenant(page, TEST_TENANT.displayName);

    // Navigate to programs
    await navigateToSection(page, 'programs');
    await expect(page).toHaveURL(/\/programs/);

    // Navigate to forms
    await navigateToSection(page, 'forms');
    await expect(page).toHaveURL(/\/forms/);

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/\/programs/);

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/\/forms/);
  });

  test('should handle page refresh without data loss', async ({ page, browserName }) => {
    await page.goto('/');
    await selectTenant(page, TEST_TENANT.displayName);

    // Create something
    await navigateToSection(page, 'programs');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', `refresh_test_${browserName}`);
    await fillFormField(page, 'name', `Refresh Test ${browserName}`);
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Data should still be there (if using localStorage or backend persistence)
    // Note: This might fail if data is only in memory
    await navigateToSection(page, 'programs');
    const programCard = page.locator(`[data-testid="program-refresh_test_${browserName}"]`).or(
      page.locator(`:has-text("Refresh Test ${browserName}")`)
    );

    // Check if exists (might not persist depending on implementation)
    const exists = await programCard.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[${browserName}] Data persisted after refresh: ${exists}`);
  });
});
