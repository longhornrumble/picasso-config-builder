/**
 * Debug Validation Workflow Test
 *
 * This test will help identify where the validation workflow is breaking:
 * 1. Load tenant MYR384719
 * 2. Check initial validation errors
 * 3. Click on a validation error
 * 4. Verify modal opens
 * 5. Make the fix (select program)
 * 6. Verify validation re-runs
 * 7. Verify error clears
 * 8. Verify save button enables
 * 9. Save the change
 * 10. Verify error is gone from global validation
 */

import { test, expect } from '@playwright/test';

test.describe('Validation Workflow Debugging', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should load tenant and show validation errors', async ({ page }) => {
    console.log('Step 1: Loading tenant MYR384719...');

    // Open tenant selector
    await page.click('button:has-text("Select a tenant")');
    await page.waitForTimeout(500);

    // Click the second "Atlanta Angels" (MYR384719)
    const atlantaOptions = await page.locator('[role="option"]:has-text("Atlanta Angels")').all();
    console.log(`Found ${atlantaOptions.length} Atlanta Angels options`);

    if (atlantaOptions.length >= 2) {
      await atlantaOptions[1].click();
    } else {
      await atlantaOptions[0].click();
    }

    // Wait for config to load
    await page.waitForTimeout(2000);

    // Take screenshot of loaded state
    await page.screenshot({ path: 'e2e/screenshots/1-tenant-loaded.png', fullPage: true });

    // Check for validation panel
    const validationPanel = page.locator('text=Validation Results');
    await expect(validationPanel).toBeVisible({ timeout: 5000 });

    // Count errors
    const errorBadge = page.locator('text=/\\d+ Errors/');
    const errorText = await errorBadge.textContent();
    console.log(`Validation errors found: ${errorText}`);

    // Take screenshot of validation panel
    await page.screenshot({ path: 'e2e/screenshots/2-validation-errors.png', fullPage: true });
  });

  test('should click validation error and open modal', async ({ page }) => {
    console.log('Step 2: Testing click-to-navigate...');

    // Load tenant first
    await page.click('button:has-text("Select a tenant")');
    await page.waitForTimeout(500);
    const atlantaOptions = await page.locator('[role="option"]:has-text("Atlanta Angels")').all();
    await atlantaOptions[1].click();
    await page.waitForTimeout(2000);

    // Find and click on a form validation error
    const formError = page.locator('text=lovebox_application').first();
    await expect(formError).toBeVisible({ timeout: 5000 });

    console.log('Clicking on lovebox_application error...');
    await formError.click();

    // Wait for navigation and modal
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modal = page.locator('[role="dialog"]');
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      console.log('✓ Modal opened successfully');
      await page.screenshot({ path: 'e2e/screenshots/3-modal-opened.png', fullPage: true });

      // Check modal title
      const modalTitle = await page.locator('[role="dialog"] h2').textContent();
      console.log(`Modal title: ${modalTitle}`);
    } else {
      console.log('✗ Modal did NOT open');
      await page.screenshot({ path: 'e2e/screenshots/3-modal-failed.png', fullPage: true });
    }

    // Check URL
    const url = page.url();
    console.log(`Current URL: ${url}`);
    expect(url).toContain('forms');
  });

  test('should fix validation error and verify it clears', async ({ page }) => {
    console.log('Step 3: Testing validation fix workflow...');

    // Load tenant
    await page.click('button:has-text("Select a tenant")');
    await page.waitForTimeout(500);
    const atlantaOptions = await page.locator('[role="option"]:has-text("Atlanta Angels")').all();
    await atlantaOptions[1].click();
    await page.waitForTimeout(2000);

    // Navigate directly to Forms page
    await page.click('text=Forms');
    await page.waitForTimeout(1000);

    // Find the lovebox_application form and click Edit
    const formCard = page.locator('text=Love Box Application').first();
    await expect(formCard).toBeVisible({ timeout: 5000 });

    // Click Edit button for this form
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/4-edit-form-modal.png', fullPage: true });

    // Check for validation error in modal
    const inlineError = page.locator('text=Program reference is required');
    const hasInlineError = await inlineError.isVisible().catch(() => false);
    console.log(`Inline validation error visible: ${hasInlineError}`);

    // Check if Update button is disabled
    const updateButton = page.locator('button:has-text("Update Form")');
    const isDisabled = await updateButton.isDisabled();
    console.log(`Update button disabled: ${isDisabled}`);

    // Select a program from dropdown
    console.log('Selecting program from dropdown...');
    const programSelect = page.locator('label:has-text("Program")').locator('..').locator('button[role="combobox"]');
    await programSelect.click();
    await page.waitForTimeout(500);

    // Click "Love Box" option
    const loveBoxOption = page.locator('[role="option"]:has-text("Love Box")').first();
    await loveBoxOption.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/5-program-selected.png', fullPage: true });

    // Check if error cleared
    const errorStillVisible = await inlineError.isVisible().catch(() => false);
    console.log(`Error still visible after selection: ${errorStillVisible}`);

    // Check if Update button is now enabled
    const stillDisabled = await updateButton.isDisabled();
    console.log(`Update button still disabled: ${stillDisabled}`);

    if (!stillDisabled) {
      console.log('✓ Update button is now enabled - clicking it...');
      await updateButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'e2e/screenshots/6-after-update.png', fullPage: true });

      // Check if modal closed
      const modalClosed = !(await page.locator('[role="dialog"]').isVisible().catch(() => false));
      console.log(`Modal closed after update: ${modalClosed}`);

      // Check if validation error is gone from validation panel
      await page.waitForTimeout(1000);
      const globalError = page.locator('text=lovebox_application');
      const errorGone = !(await globalError.isVisible().catch(() => false));
      console.log(`Error removed from validation panel: ${errorGone}`);

      await page.screenshot({ path: 'e2e/screenshots/7-final-state.png', fullPage: true });
    } else {
      console.log('✗ Update button is STILL disabled after selecting program');

      // Debug: Check form data state
      const formData = await page.evaluate(() => {
        return (window as any).__ZUSTAND_STORE_STATE__;
      });
      console.log('Store state:', JSON.stringify(formData, null, 2));
    }
  });

  test('should check console for validation errors', async ({ page }) => {
    console.log('Step 4: Monitoring console for errors...');

    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
      if (text.includes('validation') || text.includes('Validation')) {
        console.log(`[CONSOLE] ${msg.type()}: ${text}`);
      }
    });

    // Load tenant
    await page.click('button:has-text("Select a tenant")');
    await page.waitForTimeout(500);
    const atlantaOptions = await page.locator('[role="option"]:has-text("Atlanta Angels")').all();
    await atlantaOptions[1].click();
    await page.waitForTimeout(3000);

    // Navigate to forms
    await page.click('text=Forms');
    await page.waitForTimeout(1000);

    // Edit a form
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Select program
    const programSelect = page.locator('label:has-text("Program")').locator('..').locator('button[role="combobox"]');
    await programSelect.click();
    await page.waitForTimeout(500);
    const loveBoxOption = page.locator('[role="option"]:has-text("Love Box")').first();
    await loveBoxOption.click();
    await page.waitForTimeout(2000);

    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => {
      if (msg.includes('validation') || msg.includes('Validation')) {
        console.log(msg);
      }
    });

    console.log('\n=== Console Errors ===');
    errors.forEach(err => console.log(err));

    if (errors.length > 0) {
      console.log(`\n⚠️  Found ${errors.length} console errors`);
    } else {
      console.log('\n✓ No console errors found');
    }
  });
});
