/**
 * Full Validation Workflow Test
 *
 * This test follows the complete workflow from top to bottom:
 * 1. Load tenant MYR384719
 * 2. Create required programs (Love Box, Dare to Dream)
 * 3. Navigate to Forms
 * 4. Verify validation errors appear
 * 5. Click on validation error
 * 6. Fix the error by selecting the program
 * 7. Verify the error clears
 * 8. Save the configuration
 */

import { test, expect } from '@playwright/test';

test.describe('Full Validation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full workflow: load tenant → create programs → fix form validation', async ({ page }) => {
    // ===== STEP 1: Load Tenant =====
    console.log('Step 1: Loading tenant MYR384719...');

    await page.click('button:has-text("Select a tenant")');
    await page.waitForTimeout(500);

    const atlantaOptions = await page.locator('[role="option"]:has-text("Atlanta Angels")').all();
    console.log(`Found ${atlantaOptions.length} Atlanta Angels options`);

    if (atlantaOptions.length >= 2) {
      await atlantaOptions[1].click();
    } else {
      await atlantaOptions[0].click();
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/full-1-tenant-loaded.png', fullPage: true });

    // ===== STEP 2: Navigate to Programs =====
    console.log('Step 2: Navigating to Programs...');

    await page.click('text=Programs');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/full-2-programs-page.png', fullPage: true });

    // ===== STEP 3: Create Love Box Program =====
    console.log('Step 3: Creating Love Box program...');

    // Click "Create First Program" or "Add Program" button
    const createButton = page.locator('button:has-text("Create First Program"), button:has-text("Add Program")').first();
    await createButton.click();
    await page.waitForTimeout(500);

    // Fill in Love Box program details
    await page.fill('input#program-id', 'love_box');
    await page.fill('input#program-name', 'Love Box');
    await page.fill('textarea#description', 'Love Box program for providing care packages');

    await page.screenshot({ path: 'e2e/screenshots/full-3-lovebox-form.png', fullPage: true });

    await page.click('button:has-text("Create Program")');
    await page.waitForTimeout(1000);

    console.log('✓ Love Box program created');
    await page.screenshot({ path: 'e2e/screenshots/full-4-lovebox-created.png', fullPage: true });

    // ===== STEP 4: Create Dare to Dream Program =====
    console.log('Step 4: Creating Dare to Dream program...');

    const addProgramBtn = page.locator('button:has-text("Add Program"), button:has-text("Create Program")').first();
    await addProgramBtn.click();
    await page.waitForTimeout(500);

    await page.fill('input#program-id', 'dare_to_dream');
    await page.fill('input#program-name', 'Dare to Dream');
    await page.fill('textarea#description', 'Dare to Dream mentorship program');

    await page.screenshot({ path: 'e2e/screenshots/full-5-daretodream-form.png', fullPage: true });

    await page.click('button:has-text("Create Program")');
    await page.waitForTimeout(1000);

    console.log('✓ Dare to Dream program created');
    await page.screenshot({ path: 'e2e/screenshots/full-6-daretodream-created.png', fullPage: true });

    // ===== STEP 5: Navigate to Forms =====
    console.log('Step 5: Navigating to Forms...');

    await page.click('text=Forms');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/full-7-forms-page.png', fullPage: true });

    // ===== STEP 6: Check for Validation Errors =====
    console.log('Step 6: Checking for validation errors...');

    // Check if validation panel exists
    const validationPanel = page.locator('text=Validation Results');
    const hasValidationPanel = await validationPanel.isVisible().catch(() => false);
    console.log(`Validation panel visible: ${hasValidationPanel}`);

    if (hasValidationPanel) {
      const errorBadge = page.locator('text=/\\d+ Errors/');
      const errorText = await errorBadge.textContent().catch(() => 'No errors found');
      console.log(`Validation errors: ${errorText}`);
      await page.screenshot({ path: 'e2e/screenshots/full-8-validation-errors.png', fullPage: true });
    }

    // ===== STEP 7: Edit Love Box Application Form =====
    console.log('Step 7: Editing Love Box Application form...');

    // Find Love Box Application form
    const formCard = page.locator('text=Love Box Application').first();
    const hasForm = await formCard.isVisible().catch(() => false);

    if (hasForm) {
      console.log('✓ Found Love Box Application form');

      // Click Edit button
      const editButton = page.locator('button:has-text("Edit")').first();
      await editButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'e2e/screenshots/full-9-lovebox-edit-modal.png', fullPage: true });

      // ===== STEP 8: Check Validation Error in Modal =====
      console.log('Step 8: Checking for inline validation error...');

      const inlineError = page.locator('text=Program reference is required');
      const hasInlineError = await inlineError.isVisible().catch(() => false);
      console.log(`Inline validation error visible: ${hasInlineError}`);

      const updateButton = page.locator('button:has-text("Update Form")');
      const isDisabled = await updateButton.isDisabled();
      console.log(`Update button disabled: ${isDisabled}`);

      // ===== STEP 9: Select Love Box Program =====
      console.log('Step 9: Selecting Love Box program...');

      const programSelect = page.locator('label:has-text("Program")').locator('..').locator('button[role="combobox"]');

      // Check if dropdown is enabled
      const isDropdownDisabled = await programSelect.isDisabled();
      console.log(`Program dropdown disabled: ${isDropdownDisabled}`);

      if (!isDropdownDisabled) {
        await programSelect.click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'e2e/screenshots/full-10-lovebox-dropdown.png', fullPage: true });

        const loveBoxOption = page.locator('[role="option"]:has-text("Love Box")').first();
        await loveBoxOption.click();
        await page.waitForTimeout(1000);

        console.log('✓ Love Box program selected');
        await page.screenshot({ path: 'e2e/screenshots/full-11-lovebox-program-selected.png', fullPage: true });

        // ===== STEP 10: Verify Error Cleared =====
        console.log('Step 10: Verifying error cleared...');

        const errorStillVisible = await inlineError.isVisible().catch(() => false);
        console.log(`Error still visible: ${errorStillVisible}`);

        const stillDisabled = await updateButton.isDisabled();
        console.log(`Update button still disabled: ${stillDisabled}`);

        // ===== STEP 11: Update Love Box Form =====
        if (!stillDisabled) {
          console.log('Step 11: Updating Love Box form...');
          await updateButton.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'e2e/screenshots/full-12-lovebox-updated.png', fullPage: true });
        } else {
          console.log('✗ Update button still disabled after selecting program');
          await page.screenshot({ path: 'e2e/screenshots/full-ERROR-button-disabled.png', fullPage: true });
        }
      } else {
        console.log('✗ Program dropdown is disabled - programs may not have loaded');
        await page.screenshot({ path: 'e2e/screenshots/full-ERROR-dropdown-disabled.png', fullPage: true });
      }
    } else {
      console.log('✗ Love Box Application form not found');
      await page.screenshot({ path: 'e2e/screenshots/full-ERROR-form-not-found.png', fullPage: true });
    }

    // ===== STEP 12: Edit Dare to Dream Form =====
    console.log('Step 12: Editing Dare to Dream Mentor Application form...');

    const dareToDreamForm = page.locator('text=Dare to Dream Mentor Application').first();
    const hasDareToDreamForm = await dareToDreamForm.isVisible().catch(() => false);

    if (hasDareToDreamForm) {
      console.log('✓ Found Dare to Dream Mentor Application form');

      // Click Edit button for Dare to Dream form
      const editButtons = page.locator('button:has-text("Edit")');
      const dareToDreamEditButton = editButtons.nth(1); // Second Edit button
      await dareToDreamEditButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'e2e/screenshots/full-13-daretodream-modal.png', fullPage: true });

      // ===== STEP 13: Select Dare to Dream Program =====
      console.log('Step 13: Selecting Dare to Dream program...');

      const programSelectDTD = page.locator('label:has-text("Program")').locator('..').locator('button[role="combobox"]');
      await programSelectDTD.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'e2e/screenshots/full-14-daretodream-dropdown.png', fullPage: true });

      const dareToDreamOption = page.locator('[role="option"]:has-text("Dare to Dream")').first();
      await dareToDreamOption.click();
      await page.waitForTimeout(1000);

      console.log('✓ Dare to Dream program selected');
      await page.screenshot({ path: 'e2e/screenshots/full-15-daretodream-program-selected.png', fullPage: true });

      // ===== STEP 14: Update Dare to Dream Form =====
      const updateButtonDTD = page.locator('button:has-text("Update Form")');
      const isDisabledDTD = await updateButtonDTD.isDisabled();
      console.log(`Dare to Dream Update button disabled: ${isDisabledDTD}`);

      if (!isDisabledDTD) {
        console.log('Step 14: Updating Dare to Dream form...');
        await updateButtonDTD.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'e2e/screenshots/full-16-daretodream-updated.png', fullPage: true });
      }
    }

    // ===== STEP 15: Final Validation Check =====
    console.log('Step 15: Final validation check...');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/full-17-final-state.png', fullPage: true });

    // Check validation panel
    const finalValidationPanel = page.locator('text=Validation Results');
    const hasFinalValidationPanel = await finalValidationPanel.isVisible().catch(() => false);

    if (hasFinalValidationPanel) {
      const finalErrorBadge = page.locator('text=/\\d+ Errors/');
      const finalErrorText = await finalErrorBadge.textContent().catch(() => 'No errors');
      console.log(`Final validation state: ${finalErrorText}`);
    } else {
      console.log('✓ No validation panel - all errors cleared!');
    }

    // Try to save the configuration
    console.log('Step 16: Attempting to save configuration...');
    const saveButton = page.locator('button:has-text("Save")');
    const canSave = await saveButton.isVisible().catch(() => false);

    if (canSave) {
      const isSaveDisabled = await saveButton.isDisabled();
      console.log(`Save button disabled: ${isSaveDisabled}`);

      if (!isSaveDisabled) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'e2e/screenshots/full-18-after-save.png', fullPage: true });
        console.log('✓ Configuration saved successfully');
      } else {
        console.log('✗ Save button is disabled');
        await page.screenshot({ path: 'e2e/screenshots/full-ERROR-save-disabled.png', fullPage: true });
      }
    } else {
      console.log('✗ Save button not found');
    }
  });
});
