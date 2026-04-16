/**
 * E2E Test: CTA Creation & Branch Assignment
 *
 * Tests the workflow of creating CTAs and assigning them to branches:
 * 1. Select tenant
 * 2. Create CTA "Apply for Love Box" (action: start_form)
 * 3. Create CTA "Learn More" (action: show_info)
 * 4. Create branch "lovebox_discussion"
 * 5. Assign primary CTA
 * 6. Assign secondary CTA
 * 7. Validate
 * 8. Deploy
 * 9. Verify success
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
  deployConfig,
  createProgram,
} from './fixtures/test-helpers';
import {
  TEST_TENANT,
  SAMPLE_PROGRAMS,
  SAMPLE_FORMS,
  SAMPLE_CTAS,
  SAMPLE_BRANCHES,
} from './fixtures/test-data';

test.describe('CTA Creation & Branch Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await selectTenant(page, TEST_TENANT.displayName);
  });

  test('should create CTAs, assign to branch, validate and deploy', async ({ page }) => {
    // Step 1: Create prerequisite program and form
    await test.step('Create prerequisite program', async () => {
      await createProgram(page, SAMPLE_PROGRAMS.loveBox);
    });

    await test.step('Create prerequisite form', async () => {
      await navigateToSection(page, 'forms');

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', SAMPLE_FORMS.loveBoxApplication.id);
      await fillFormField(page, 'name', SAMPLE_FORMS.loveBoxApplication.name);
      await fillFormField(page, 'description', SAMPLE_FORMS.loveBoxApplication.description);

      await clickButton(page, 'Save');
      await waitForSuccessToast(page);
    });

    // Step 2: Create CTA "Apply for Love Box" (action: start_form)
    await test.step('Create primary CTA with start_form action', async () => {
      await navigateToSection(page, 'ctas');
      await expect(page).toHaveURL(/\/ctas/);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add CTA"), button:has-text("New CTA")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', SAMPLE_CTAS.applyLoveBox.id);
      await fillFormField(page, 'label', SAMPLE_CTAS.applyLoveBox.label);

      // Select action type
      const actionSelect = page.locator('select[name="action"], [data-testid="action-select"]').first();
      await actionSelect.selectOption(SAMPLE_CTAS.applyLoveBox.action);

      // Wait for form selector to appear (conditional field)
      await page.waitForTimeout(500);

      // Select form
      const formSelect = page.locator('select[name="formId"], [data-testid="form-select"]').first();
      await formSelect.selectOption(SAMPLE_CTAS.applyLoveBox.formId!);

      // Select variant
      const variantSelect = page.locator('select[name="variant"], [data-testid="variant-select"]').first();
      if (await variantSelect.isVisible({ timeout: 1000 })) {
        await variantSelect.selectOption(SAMPLE_CTAS.applyLoveBox.variant!);
      }

      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      // Verify CTA appears in list
      const ctaCard = page.locator(`[data-testid="cta-${SAMPLE_CTAS.applyLoveBox.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_CTAS.applyLoveBox.label}")`)
      );
      await expect(ctaCard.first()).toBeVisible({ timeout: 5000 });
    });

    // Step 3: Create CTA "Learn More" (action: show_info)
    await test.step('Create secondary CTA with show_info action', async () => {
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add CTA")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', SAMPLE_CTAS.learnMore.id);
      await fillFormField(page, 'label', SAMPLE_CTAS.learnMore.label);

      const actionSelect = page.locator('select[name="action"]').first();
      await actionSelect.selectOption(SAMPLE_CTAS.learnMore.action);

      const variantSelect = page.locator('select[name="variant"]').first();
      if (await variantSelect.isVisible({ timeout: 1000 })) {
        await variantSelect.selectOption(SAMPLE_CTAS.learnMore.variant!);
      }

      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      const ctaCard = page.locator(`[data-testid="cta-${SAMPLE_CTAS.learnMore.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_CTAS.learnMore.label}")`)
      );
      await expect(ctaCard.first()).toBeVisible({ timeout: 5000 });
    });

    // Step 4: Create branch
    await test.step('Create branch "lovebox_discussion"', async () => {
      await navigateToSection(page, 'branches');
      await expect(page).toHaveURL(/\/branches/);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Branch"), button:has-text("New Branch")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', SAMPLE_BRANCHES.loveBoxDiscussion.id);
      await fillFormField(page, 'name', SAMPLE_BRANCHES.loveBoxDiscussion.name);
      await fillFormField(page, 'description', SAMPLE_BRANCHES.loveBoxDiscussion.description);

      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      const branchCard = page.locator(`[data-testid="branch-${SAMPLE_BRANCHES.loveBoxDiscussion.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_BRANCHES.loveBoxDiscussion.name}")`)
      );
      await expect(branchCard.first()).toBeVisible({ timeout: 5000 });
    });

    // Step 5: Assign primary CTA to branch
    await test.step('Assign primary CTA to branch', async () => {
      // Click on branch to edit
      const branchCard = page.locator(`[data-testid="branch-${SAMPLE_BRANCHES.loveBoxDiscussion.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_BRANCHES.loveBoxDiscussion.name}")`)
      );
      await branchCard.first().click();
      await page.waitForLoadState('networkidle');

      // Select primary CTA
      const primaryCtaSelect = page.locator('select[name="primaryCtaId"], [data-testid="primary-cta-select"]').first();
      await primaryCtaSelect.selectOption(SAMPLE_CTAS.applyLoveBox.id);
      await page.waitForTimeout(500);
    });

    // Step 6: Assign secondary CTA to branch
    await test.step('Assign secondary CTA to branch', async () => {
      const secondaryCtaSelect = page.locator('select[name="secondaryCtaId"], [data-testid="secondary-cta-select"]').first();
      if (await secondaryCtaSelect.isVisible({ timeout: 2000 })) {
        await secondaryCtaSelect.selectOption(SAMPLE_CTAS.learnMore.id);
        await page.waitForTimeout(500);
      }

      // Save branch
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Branch")').first();
      await saveButton.click();
      await waitForSuccessToast(page);
    });

    // Step 7: Add trigger phrases to branch
    await test.step('Add trigger phrases to branch', async () => {
      const triggers = SAMPLE_BRANCHES.loveBoxDiscussion.triggerPhrases;

      for (const trigger of triggers || []) {
        const triggerInput = page.locator('input[name="trigger"], [data-testid="trigger-input"]').first();
        if (await triggerInput.isVisible({ timeout: 1000 })) {
          await triggerInput.fill(trigger);
          const addButton = page.locator('button:has-text("Add Trigger"), [data-testid="add-trigger"]').first();
          await addButton.click();
          await page.waitForTimeout(300);
        }
      }

      // Save again
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 1000 })) {
        await saveButton.click();
        await waitForSuccessToast(page);
      }
    });

    // Step 8: Validate
    await test.step('Validate configuration', async () => {
      const validateButton = page.locator('button:has-text("Validate"), [data-testid="validate-button"]').first();
      if (await validateButton.isVisible({ timeout: 2000 })) {
        await validateButton.click();
        await waitForValidation(page);

        const successMessage = page.locator('[data-testid="validation-success"], :has-text("Validation passed"), :has-text("No errors")').first();
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });

    // Step 9: Deploy
    await test.step('Deploy configuration', async () => {
      await deployConfig(page);
    });

    // Step 10: Verify success
    await test.step('Verify deployment success', async () => {
      const successToast = page.locator('[role="alert"]:has-text("deployed"), [role="alert"]:has-text("success")').first();
      await expect(successToast).toBeVisible({ timeout: 5000 });
    });
  });

  test('should display CTA preview in branch editor', async ({ page }) => {
    // Create a CTA first
    await navigateToSection(page, 'ctas');
    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', 'test_preview_cta');
    await fillFormField(page, 'label', 'Test Preview CTA');
    const actionSelect = page.locator('select[name="action"]').first();
    await actionSelect.selectOption('show_info');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Create a branch
    await navigateToSection(page, 'branches');
    const createBranchButton = page.locator('button:has-text("Create")').first();
    await createBranchButton.click();
    await waitForModal(page);

    await fillFormField(page, 'id', 'test_preview_branch');
    await fillFormField(page, 'name', 'Test Preview Branch');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Assign CTA and check for preview
    const branchCard = page.locator('[data-testid="branch-test_preview_branch"]').or(
      page.locator(':has-text("Test Preview Branch")')
    );
    await branchCard.first().click();

    const primaryCtaSelect = page.locator('select[name="primaryCtaId"]').first();
    await primaryCtaSelect.selectOption('test_preview_cta');

    // Look for CTA preview/label display
    const preview = page.locator(':has-text("Test Preview CTA")').first();
    await expect(preview).toBeVisible({ timeout: 3000 });
  });

  test('should allow editing CTA assignments in branch', async ({ page }) => {
    // Setup: Create 2 CTAs
    await navigateToSection(page, 'ctas');

    // CTA 1
    let createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'cta_edit_test_1');
    await fillFormField(page, 'label', 'CTA Edit Test 1');
    await page.locator('select[name="action"]').first().selectOption('show_info');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // CTA 2
    createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'cta_edit_test_2');
    await fillFormField(page, 'label', 'CTA Edit Test 2');
    await page.locator('select[name="action"]').first().selectOption('show_info');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Create branch with CTA 1
    await navigateToSection(page, 'branches');
    createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'branch_edit_test');
    await fillFormField(page, 'name', 'Branch Edit Test');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    const branchCard = page.locator('[data-testid="branch-branch_edit_test"]').or(
      page.locator(':has-text("Branch Edit Test")')
    );
    await branchCard.first().click();

    // Assign CTA 1
    const primaryCtaSelect = page.locator('select[name="primaryCtaId"]').first();
    await primaryCtaSelect.selectOption('cta_edit_test_1');
    await page.locator('button:has-text("Save")').first().click();
    await waitForSuccessToast(page);

    // Edit to CTA 2
    await primaryCtaSelect.selectOption('cta_edit_test_2');
    await page.locator('button:has-text("Save")').first().click();
    await waitForSuccessToast(page);

    // Verify CTA 2 is selected
    const selectedValue = await primaryCtaSelect.inputValue();
    expect(selectedValue).toBe('cta_edit_test_2');
  });
});
