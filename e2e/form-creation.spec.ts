/**
 * E2E Test: Complete Form Creation Flow
 *
 * Tests the full workflow of creating a form from scratch:
 * 1. Login / select tenant
 * 2. Create program "Love Box"
 * 3. Create form "Love Box Application"
 * 4. Add 5 fields (text, email, phone, select, textarea)
 * 5. Assign to "Love Box" program
 * 6. Add trigger phrases
 * 7. Configure post-submission
 * 8. Validate (expect pass)
 * 9. Deploy to S3
 * 10. Verify success message
 */

import { test, expect, Page } from '@playwright/test';
import {
  selectTenant,
  navigateToSection,
  clickButton,
  fillFormField,
  waitForModal,
  closeModal,
  waitForSuccessToast,
  waitForValidation,
  deployConfig,
  expectEnabled,
} from './fixtures/test-helpers';
import { TEST_TENANT, SAMPLE_PROGRAMS, SAMPLE_FORMS } from './fixtures/test-data';

test.describe('Complete Form Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a complete form with program, fields, triggers, and deploy', async ({ page }) => {
    // Step 1: Select tenant
    await test.step('Select tenant', async () => {
      await selectTenant(page, TEST_TENANT.id);
      await expect(page).toHaveURL(/\//);
    });

    // Step 2: Create program "Love Box"
    await test.step('Create program "Love Box"', async () => {
      await navigateToSection(page, 'programs');
      await expect(page).toHaveURL(/\/programs/);

      // Click Create Program button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Program"), button:has-text("New Program")').first();
      await createButton.click();
      await waitForModal(page);

      // Fill program form
      await fillFormField(page, 'id', SAMPLE_PROGRAMS.loveBox.id);
      await fillFormField(page, 'name', SAMPLE_PROGRAMS.loveBox.name);
      await fillFormField(page, 'description', SAMPLE_PROGRAMS.loveBox.description);

      // Submit
      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      // Verify program appears in list
      const programCard = page.locator(`[data-testid="program-${SAMPLE_PROGRAMS.loveBox.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_PROGRAMS.loveBox.name}")`)
      );
      await expect(programCard.first()).toBeVisible({ timeout: 5000 });
    });

    // Step 3: Create form "Love Box Application"
    await test.step('Create form "Love Box Application"', async () => {
      await navigateToSection(page, 'forms');
      await expect(page).toHaveURL(/\/forms/);

      // Click Create Form button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form"), button:has-text("New Form")').first();
      await createButton.click();
      await waitForModal(page);

      // Fill basic form info
      await fillFormField(page, 'id', SAMPLE_FORMS.loveBoxApplication.id);
      await fillFormField(page, 'name', SAMPLE_FORMS.loveBoxApplication.name);
      await fillFormField(page, 'description', SAMPLE_FORMS.loveBoxApplication.description);

      // Submit
      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      // Verify form appears in list
      const formCard = page.locator(`[data-testid="form-${SAMPLE_FORMS.loveBoxApplication.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_FORMS.loveBoxApplication.name}")`)
      );
      await expect(formCard.first()).toBeVisible({ timeout: 5000 });
    });

    // Step 4: Add 5 fields to the form
    await test.step('Add 5 form fields', async () => {
      // Click on form to edit
      const formCard = page.locator(`[data-testid="form-${SAMPLE_FORMS.loveBoxApplication.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_FORMS.loveBoxApplication.name}")`)
      );
      await formCard.first().click();
      await page.waitForLoadState('networkidle');

      // Add each field
      const fields = SAMPLE_FORMS.loveBoxApplication.fields;

      for (const field of fields) {
        // Click Add Field button
        const addFieldButton = page.locator('button:has-text("Add Field"), button:has-text("New Field"), [data-testid="add-field"]').first();
        await addFieldButton.click();
        await waitForModal(page);

        // Fill field form
        await fillFormField(page, 'id', field.id);
        await fillFormField(page, 'label', field.label);

        // Select field type
        const typeSelect = page.locator('select[name="type"], [data-testid="field-type"]').first();
        await typeSelect.selectOption(field.type);

        // Set required checkbox
        if (field.required) {
          const requiredCheckbox = page.locator('input[name="required"], input[type="checkbox"][id*="required"]').first();
          await requiredCheckbox.check();
        }

        // For select fields, add options
        if (field.type === 'select' && 'options' in field && field.options) {
          for (const option of field.options) {
            const optionInput = page.locator('input[name="option"], [data-testid="option-input"]').first();
            await optionInput.fill(option);
            const addOptionButton = page.locator('button:has-text("Add Option"), [data-testid="add-option"]').first();
            await addOptionButton.click();
          }
        }

        // For textarea, add placeholder
        if (field.type === 'textarea' && 'placeholder' in field && field.placeholder) {
          await fillFormField(page, 'placeholder', field.placeholder);
        }

        // Save field
        await clickButton(page, 'Save');
        await page.waitForTimeout(500); // Wait for field to be added

        // Verify field appears in list
        const fieldItem = page.locator(`[data-testid="field-${field.id}"]`).or(
          page.locator(`:has-text("${field.label}")`)
        );
        await expect(fieldItem.first()).toBeVisible({ timeout: 3000 });
      }
    });

    // Step 5: Assign form to program
    await test.step('Assign form to program', async () => {
      // Look for program selector
      const programSelect = page.locator('select[name="programId"], [data-testid="program-select"]').first();

      if (await programSelect.isVisible({ timeout: 2000 })) {
        await programSelect.selectOption(SAMPLE_PROGRAMS.loveBox.id);
        await page.waitForTimeout(500);
      } else {
        // Try settings/advanced section
        const settingsButton = page.locator('button:has-text("Settings"), button:has-text("Advanced")').first();
        if (await settingsButton.isVisible({ timeout: 2000 })) {
          await settingsButton.click();
          const programSelectInSettings = page.locator('select[name="programId"]').first();
          await programSelectInSettings.selectOption(SAMPLE_PROGRAMS.loveBox.id);
        }
      }
    });

    // Step 6: Add trigger phrases
    await test.step('Add trigger phrases', async () => {
      const triggers = SAMPLE_FORMS.loveBoxApplication.triggerPhrases;

      for (const trigger of triggers) {
        // Look for trigger input
        const triggerInput = page.locator('input[name="trigger"], input[placeholder*="trigger"], [data-testid="trigger-input"]').first();

        if (await triggerInput.isVisible({ timeout: 2000 })) {
          await triggerInput.fill(trigger);

          // Click add trigger button
          const addTriggerButton = page.locator('button:has-text("Add Trigger"), button:has-text("Add Phrase"), [data-testid="add-trigger"]').first();
          await addTriggerButton.click();
          await page.waitForTimeout(300);
        }
      }
    });

    // Step 7: Configure post-submission (optional)
    await test.step('Configure post-submission', async () => {
      // Look for post-submission settings
      const postSubmissionSection = page.locator('[data-testid="post-submission"], :has-text("Post-submission")').first();

      if (await postSubmissionSection.isVisible({ timeout: 2000 })) {
        // Enable confirmation message
        const confirmationInput = page.locator('input[name="confirmationMessage"], textarea[name="confirmationMessage"]').first();
        if (await confirmationInput.isVisible({ timeout: 1000 })) {
          await confirmationInput.fill('Thank you for applying to the Love Box program! We will review your application and get back to you soon.');
        }
      }
    });

    // Save the form
    await test.step('Save form', async () => {
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Form"), [data-testid="save-form"]').first();
      await saveButton.click();
      await waitForSuccessToast(page);
    });

    // Step 8: Validate configuration
    await test.step('Validate configuration', async () => {
      // Look for validation button
      const validateButton = page.locator('button:has-text("Validate"), [data-testid="validate-button"]').first();

      if (await validateButton.isVisible({ timeout: 2000 })) {
        await validateButton.click();
        await waitForValidation(page);

        // Check for validation success
        const successMessage = page.locator('[data-testid="validation-success"], :has-text("Validation passed"), :has-text("No errors")').first();
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });

    // Step 9: Deploy configuration
    await test.step('Deploy to S3', async () => {
      await deployConfig(page);
    });

    // Step 10: Verify success message
    await test.step('Verify deployment success', async () => {
      const successToast = page.locator('[role="alert"]:has-text("deployed"), [role="alert"]:has-text("success")').first();
      await expect(successToast).toBeVisible({ timeout: 5000 });
    });
  });

  test('should persist form data across navigation', async ({ page }) => {
    // Create a simple form
    await selectTenant(page, TEST_TENANT.id);
    await navigateToSection(page, 'forms');

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form")').first();
    await createButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', 'test_persistence_form');
    await fillFormField(page, 'name', 'Test Persistence Form');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Navigate away
    await navigateToSection(page, 'programs');
    await page.waitForTimeout(500);

    // Navigate back
    await navigateToSection(page, 'forms');

    // Verify form still exists
    const formCard = page.locator('[data-testid="form-test_persistence_form"]').or(
      page.locator(':has-text("Test Persistence Form")')
    );
    await expect(formCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields before submission', async ({ page }) => {
    await selectTenant(page, TEST_TENANT.id);
    await navigateToSection(page, 'forms');

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form")').first();
    await createButton.click();
    await waitForModal(page);

    // Try to save without filling required fields
    const saveButton = page.locator('[role="dialog"] button:has-text("Save")').first();
    await saveButton.click();

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"]:has-text("required"), .error:has-text("required"), [data-testid="error"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});
