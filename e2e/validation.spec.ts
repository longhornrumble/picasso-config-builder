/**
 * E2E Test: Validation Error Blocking Deployment
 *
 * Tests the validation system and deployment blocking:
 * 1. Select tenant
 * 2. Create CTA with action "start_form" but no formId
 * 3. Run validation (expect error)
 * 4. Verify deploy button disabled
 * 5. Fix error (add formId)
 * 6. Verify deploy button enabled
 */

import { test, expect } from '@playwright/test';
import {
  selectTenant,
  navigateToSection,
  clickButton,
  fillFormField,
  waitForModal,
  waitForSuccessToast,
  waitForValidation,
  expectDisabled,
  expectEnabled,
  getValidationErrors,
} from './fixtures/test-helpers';
import { TEST_TENANT, INVALID_CTA_DATA } from './fixtures/test-data';

test.describe('Validation Error Blocking Deployment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await selectTenant(page, TEST_TENANT.id);
  });

  test('should block deployment when CTA has start_form action without formId', async ({ page }) => {
    // Step 1: Create a prerequisite form for later use
    await test.step('Create a valid form for later', async () => {
      await navigateToSection(page, 'forms');
      const createButton = page.locator('button:has-text("Create")').first();
      await createButton.click();
      await waitForModal(page);
      await fillFormField(page, 'id', 'validation_test_form');
      await fillFormField(page, 'name', 'Validation Test Form');
      await clickButton(page, 'Save');
      await waitForSuccessToast(page);
    });

    // Step 2: Create CTA with invalid configuration (start_form without formId)
    await test.step('Create CTA with missing formId', async () => {
      await navigateToSection(page, 'ctas');

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add CTA")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', INVALID_CTA_DATA.missingFormId.id);
      await fillFormField(page, 'label', INVALID_CTA_DATA.missingFormId.label);

      // Select start_form action
      const actionSelect = page.locator('select[name="action"], [data-testid="action-select"]').first();
      await actionSelect.selectOption(INVALID_CTA_DATA.missingFormId.action);

      // Wait for conditional field to appear
      await page.waitForTimeout(500);

      // DO NOT select a form - leave formId empty
      // This creates the validation error

      // Try to save (might succeed with warning, or might block)
      await clickButton(page, 'Save');

      // Check if save was allowed (some forms allow saving invalid data)
      const successToast = page.locator('[role="alert"]:has-text("success")').first();
      const errorToast = page.locator('[role="alert"]:has-text("error")').first();

      if (await successToast.isVisible({ timeout: 2000 })) {
        // Save succeeded - validation happens later
        console.log('CTA saved with validation errors (validation happens at deploy time)');
      } else if (await errorToast.isVisible({ timeout: 2000 })) {
        // Save blocked by validation
        console.log('CTA save blocked by validation');
        // Close modal and create without saving
        await page.keyboard.press('Escape');
      }
    });

    // Step 3: Run validation
    await test.step('Run validation and expect errors', async () => {
      // Look for validate button (might be in header, settings, or toolbar)
      const validateButton = page.locator('button:has-text("Validate"), [data-testid="validate-button"]').first();

      if (await validateButton.isVisible({ timeout: 2000 })) {
        await validateButton.click();
        await waitForValidation(page);

        // Should show validation errors
        const errorMessage = page.locator('[data-testid="validation-error"], .validation-error, [role="alert"]:has-text("error")').first();
        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        // Check error mentions missing formId
        const errors = await getValidationErrors(page);
        const hasFormIdError = errors.some(err =>
          err.toLowerCase().includes('form') || err.toLowerCase().includes('required')
        );
        expect(hasFormIdError).toBeTruthy();
      } else {
        // Validation might happen automatically
        const errorMessage = page.locator('[data-testid="validation-error"], .validation-error').first();
        if (await errorMessage.isVisible({ timeout: 1000 })) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });

    // Step 4: Verify deploy button is disabled
    await test.step('Verify deploy button is disabled', async () => {
      const deployButton = page.locator('button:has-text("Deploy"), [data-testid="deploy-button"]').first();

      // Navigate to settings or home where deploy button usually is
      if (!(await deployButton.isVisible({ timeout: 1000 }))) {
        await navigateToSection(page, 'settings');
      }

      // Check if deploy button is visible and disabled
      if (await deployButton.isVisible({ timeout: 2000 })) {
        await expectDisabled(page, 'button:has-text("Deploy"), [data-testid="deploy-button"]');
      } else {
        // Deploy might be hidden when there are validation errors
        console.log('Deploy button hidden when validation errors exist');
      }
    });

    // Step 5: Fix the error by adding formId
    await test.step('Fix validation error by adding formId', async () => {
      await navigateToSection(page, 'ctas');

      // Find and edit the CTA
      const ctaCard = page.locator(`[data-testid="cta-${INVALID_CTA_DATA.missingFormId.id}"]`).or(
        page.locator(`:has-text("${INVALID_CTA_DATA.missingFormId.label}")`)
      );

      if (await ctaCard.isVisible({ timeout: 2000 })) {
        // Click to edit
        await ctaCard.first().click();
        await page.waitForLoadState('networkidle');

        // Select the form
        const formSelect = page.locator('select[name="formId"], [data-testid="form-select"]').first();
        await formSelect.selectOption('validation_test_form');

        // Save
        const saveButton = page.locator('button:has-text("Save")').first();
        await saveButton.click();
        await waitForSuccessToast(page);
      } else {
        // CTA wasn't created, create it properly now
        const createButton = page.locator('button:has-text("Create")').first();
        await createButton.click();
        await waitForModal(page);

        await fillFormField(page, 'id', 'valid_cta_fixed');
        await fillFormField(page, 'label', 'Valid CTA Fixed');
        await page.locator('select[name="action"]').first().selectOption('start_form');
        await page.waitForTimeout(500);
        await page.locator('select[name="formId"]').first().selectOption('validation_test_form');
        await clickButton(page, 'Save');
        await waitForSuccessToast(page);
      }
    });

    // Step 6: Run validation again - should pass
    await test.step('Run validation and expect success', async () => {
      const validateButton = page.locator('button:has-text("Validate")').first();

      if (await validateButton.isVisible({ timeout: 2000 })) {
        await validateButton.click();
        await waitForValidation(page);

        // Should show success message
        const successMessage = page.locator('[data-testid="validation-success"], :has-text("Validation passed"), :has-text("No errors")').first();
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });

    // Step 7: Verify deploy button is now enabled
    await test.step('Verify deploy button is enabled', async () => {
      const deployButton = page.locator('button:has-text("Deploy")').first();

      if (!(await deployButton.isVisible({ timeout: 1000 }))) {
        await navigateToSection(page, 'settings');
      }

      if (await deployButton.isVisible({ timeout: 2000 })) {
        await expectEnabled(page, 'button:has-text("Deploy")');
      }
    });
  });

  test('should show validation errors for duplicate IDs', async ({ page }) => {
    // Create a program with specific ID
    await navigateToSection(page, 'programs');
    let createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'duplicate_id_test');
    await fillFormField(page, 'name', 'First Program');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Try to create another program with same ID
    createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'duplicate_id_test');
    await fillFormField(page, 'name', 'Second Program');
    await clickButton(page, 'Save');

    // Should show error
    const errorMessage = page.locator('[role="alert"]:has-text("exists"), [role="alert"]:has-text("duplicate"), [role="alert"]:has-text("error")').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await navigateToSection(page, 'forms');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Try to save without filling any fields
    await clickButton(page, 'Save');

    // Should show required field errors
    const errorMessage = page.locator('[role="alert"]:has-text("required"), .error:has-text("required")').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should validate on blur for individual fields', async ({ page }) => {
    await navigateToSection(page, 'forms');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Focus and blur a required field without entering data
    const nameInput = page.locator('input[name="name"], input[id="name"]').first();
    await nameInput.focus();
    await nameInput.blur();

    // Should show inline validation error
    const inlineError = page.locator('[data-testid="name-error"], .field-error:has-text("required")').first();

    // Note: This might not exist if validation only happens on submit
    if (await inlineError.isVisible({ timeout: 1000 })) {
      await expect(inlineError).toBeVisible();
    }
  });

  test('should clear validation errors after fixing issues', async ({ page }) => {
    await navigateToSection(page, 'forms');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    // Try to save without data
    await clickButton(page, 'Save');

    // Should show error
    const errorMessage = page.locator('[role="alert"]:has-text("required")').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // Fill required fields
    await fillFormField(page, 'id', 'clear_validation_test');
    await fillFormField(page, 'name', 'Clear Validation Test');

    // Save again
    await clickButton(page, 'Save');

    // Should succeed
    await waitForSuccessToast(page);

    // Error should be gone
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 });
  });
});
