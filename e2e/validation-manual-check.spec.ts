/**
 * Manual Validation Check Test
 *
 * This test sets up the state for manual validation testing:
 * 1. Creates both programs (Love Box and Dare to Dream)
 * 2. Navigates to Forms page
 * 3. Takes screenshots showing the validation state
 *
 * Then you can manually:
 * - Click on validation errors
 * - Edit forms and assign programs
 * - Verify errors clear
 * - Save the configuration
 */

import { test } from '@playwright/test';

test.describe('Manual Validation Setup', () => {
  test('should setup programs for manual validation testing', async ({ page }) => {
    // ===== STEP 1: Load Tenant =====
    console.log('Step 1: Loading tenant MYR384719...');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

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
    await page.screenshot({ path: 'e2e/screenshots/manual-1-tenant-loaded.png', fullPage: true });

    // ===== STEP 2: Navigate to Programs =====
    console.log('Step 2: Navigating to Programs...');

    await page.click('text=Programs');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/manual-2-programs-page.png', fullPage: true });

    // ===== STEP 3: Create Love Box Program =====
    console.log('Step 3: Creating Love Box program...');

    const createButton = page.locator('button:has-text("Create First Program"), button:has-text("Add Program")').first();
    await createButton.click();
    await page.waitForTimeout(500);

    await page.fill('input#program-id', 'love_box');
    await page.fill('input#program-name', 'Love Box');
    await page.fill('textarea#description', 'Love Box program for providing care packages');

    await page.screenshot({ path: 'e2e/screenshots/manual-3-lovebox-form.png', fullPage: true });

    await page.click('button:has-text("Create Program")');
    await page.waitForTimeout(1000);

    // Wait for modal to close after creating program
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      console.log('Modal still visible, will continue anyway');
    });
    await page.waitForTimeout(500);

    console.log('✓ Love Box program created');
    await page.screenshot({ path: 'e2e/screenshots/manual-4-lovebox-created.png', fullPage: true });

    // ===== STEP 4: Create Dare to Dream Program =====
    console.log('Step 4: Creating Dare to Dream program...');

    const addProgramBtn = page.locator('button:has-text("Add Program"), button:has-text("Create Program")').first();
    await addProgramBtn.click();
    await page.waitForTimeout(500);

    await page.fill('input#program-id', 'dare_to_dream');
    await page.fill('input#program-name', 'Dare to Dream');
    await page.fill('textarea#description', 'Dare to Dream mentorship program');

    await page.screenshot({ path: 'e2e/screenshots/manual-5-daretodream-form.png', fullPage: true });

    await page.click('button:has-text("Create Program")');
    await page.waitForTimeout(1000);

    console.log('✓ Dare to Dream program created');
    await page.screenshot({ path: 'e2e/screenshots/manual-6-daretodream-created.png', fullPage: true });

    // ===== STEP 5: Navigate to Forms =====
    console.log('Step 5: Navigating to Forms...');

    await page.click('text=Forms');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/manual-7-forms-page.png', fullPage: true });

    // ===== STEP 6: Check Validation Panel =====
    console.log('Step 6: Checking validation state...');

    const validationPanel = page.locator('text=Validation Results');
    const hasValidationPanel = await validationPanel.isVisible().catch(() => false);
    console.log(`Validation panel visible: ${hasValidationPanel}`);

    if (hasValidationPanel) {
      const errorBadge = page.locator('text=/\\d+ Errors/');
      const errorText = await errorBadge.textContent().catch(() => 'No errors found');
      console.log(`Validation errors: ${errorText}`);
      await page.screenshot({ path: 'e2e/screenshots/manual-8-validation-panel.png', fullPage: true });
    }

    // ===== FINAL MESSAGE =====
    console.log('\n========================================');
    console.log('✓ Setup complete!');
    console.log('========================================');
    console.log('Both programs have been created:');
    console.log('  - Love Box');
    console.log('  - Dare to Dream');
    console.log('\nNow you can manually:');
    console.log('  1. Click on validation errors in the sidebar');
    console.log('  2. Verify the modal opens and scrolls to the error field');
    console.log('  3. Select the appropriate program from the dropdown');
    console.log('  4. Click "Update Form"');
    console.log('  5. Verify the validation error clears');
    console.log('  6. Repeat for the second form');
    console.log('  7. Click "Save" to save the configuration');
    console.log('========================================\n');

    // Keep the browser open for manual testing
    await page.waitForTimeout(300000); // Wait 5 minutes for manual testing
  });
});
