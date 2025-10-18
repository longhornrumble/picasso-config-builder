/**
 * E2E Test: Dependency Warning Flow
 *
 * Tests the dependency checking and warning system:
 * 1. Select tenant with existing data
 * 2. Attempt to delete program used by form
 * 3. Verify dependency warning modal appears
 * 4. Check warning lists form dependencies
 * 5. Cancel delete
 * 6. Delete form first
 * 7. Delete program (should succeed)
 */

import { test, expect } from '@playwright/test';
import {
  selectTenant,
  navigateToSection,
  clickButton,
  fillFormField,
  waitForModal,
  closeModal,
  waitForSuccessToast,
  createProgram,
} from './fixtures/test-helpers';
import { TEST_TENANT, SAMPLE_PROGRAMS, SAMPLE_FORMS } from './fixtures/test-data';

test.describe('Dependency Warning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await selectTenant(page, TEST_TENANT.id);
  });

  test('should show dependency warning when deleting program used by form', async ({ page }) => {
    // Step 1: Create a program
    await test.step('Create program', async () => {
      await createProgram(page, SAMPLE_PROGRAMS.foodBank);
    });

    // Step 2: Create a form that references the program
    await test.step('Create form referencing the program', async () => {
      await navigateToSection(page, 'forms');

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Form")').first();
      await createButton.click();
      await waitForModal(page);

      await fillFormField(page, 'id', 'dependency_test_form');
      await fillFormField(page, 'name', 'Dependency Test Form');
      await fillFormField(page, 'description', 'Form for testing dependency warnings');

      await clickButton(page, 'Save');
      await waitForSuccessToast(page);

      // Edit form to assign program
      const formCard = page.locator('[data-testid="form-dependency_test_form"]').or(
        page.locator(':has-text("Dependency Test Form")')
      );
      await formCard.first().click();
      await page.waitForLoadState('networkidle');

      // Assign to program
      const programSelect = page.locator('select[name="programId"], [data-testid="program-select"]').first();
      if (await programSelect.isVisible({ timeout: 2000 })) {
        await programSelect.selectOption(SAMPLE_PROGRAMS.foodBank.id);
        await page.waitForTimeout(500);

        const saveButton = page.locator('button:has-text("Save")').first();
        await saveButton.click();
        await waitForSuccessToast(page);
      }
    });

    // Step 3: Attempt to delete the program
    await test.step('Attempt to delete program with dependencies', async () => {
      await navigateToSection(page, 'programs');

      // Find the program card
      const programCard = page.locator(`[data-testid="program-${SAMPLE_PROGRAMS.foodBank.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_PROGRAMS.foodBank.name}")`)
      );
      await expect(programCard.first()).toBeVisible({ timeout: 5000 });

      // Click delete button (might be in a menu or direct button)
      const deleteButton = programCard.locator('button:has-text("Delete"), [data-testid="delete-button"], button[aria-label*="Delete"]').first();

      // If delete button is not immediately visible, try opening a menu
      if (!(await deleteButton.isVisible({ timeout: 1000 }))) {
        const menuButton = programCard.locator('button[aria-label*="menu"], button:has-text("⋮"), [data-testid="menu-button"]').first();
        if (await menuButton.isVisible({ timeout: 1000 })) {
          await menuButton.click();
          await page.waitForTimeout(300);
        }
      }

      // Now click delete
      await page.locator('button:has-text("Delete"), [data-testid="delete-button"]').first().click();
    });

    // Step 4: Verify dependency warning modal appears
    await test.step('Verify dependency warning appears', async () => {
      // Wait for warning modal
      const warningModal = page.locator('[role="dialog"]:has-text("Dependency"), [role="dialog"]:has-text("Warning"), [role="alertdialog"]').first();
      await expect(warningModal).toBeVisible({ timeout: 5000 });

      // Check that it mentions dependencies
      const modalText = await warningModal.textContent();
      expect(modalText).toMatch(/dependenc/i);
    });

    // Step 5: Verify warning lists form dependencies
    await test.step('Verify warning lists dependent forms', async () => {
      const warningModal = page.locator('[role="dialog"]:has-text("Dependency"), [role="dialog"]:has-text("Warning"), [role="alertdialog"]').first();

      // Should mention the form that depends on this program
      const dependencyList = warningModal.locator(':has-text("Dependency Test Form"), :has-text("dependency_test_form")').first();
      await expect(dependencyList).toBeVisible({ timeout: 3000 });
    });

    // Step 6: Cancel delete
    await test.step('Cancel the delete operation', async () => {
      const cancelButton = page.locator('[role="dialog"] button:has-text("Cancel"), [role="alertdialog"] button:has-text("Cancel")').first();
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Verify program still exists
      const programCard = page.locator(`[data-testid="program-${SAMPLE_PROGRAMS.foodBank.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_PROGRAMS.foodBank.name}")`)
      );
      await expect(programCard.first()).toBeVisible({ timeout: 3000 });
    });

    // Step 7: Delete the form first
    await test.step('Delete the dependent form', async () => {
      await navigateToSection(page, 'forms');

      const formCard = page.locator('[data-testid="form-dependency_test_form"]').or(
        page.locator(':has-text("Dependency Test Form")')
      );

      // Click delete
      const deleteButton = formCard.locator('button:has-text("Delete"), [data-testid="delete-button"]').first();

      if (!(await deleteButton.isVisible({ timeout: 1000 }))) {
        const menuButton = formCard.locator('button[aria-label*="menu"], button:has-text("⋮")').first();
        if (await menuButton.isVisible({ timeout: 1000 })) {
          await menuButton.click();
        }
      }

      await page.locator('button:has-text("Delete")').first().click();

      // Confirm deletion (if confirmation modal appears)
      const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      await waitForSuccessToast(page);

      // Verify form is gone
      await expect(formCard.first()).not.toBeVisible({ timeout: 3000 });
    });

    // Step 8: Delete the program (should now succeed)
    await test.step('Delete program without dependencies', async () => {
      await navigateToSection(page, 'programs');

      const programCard = page.locator(`[data-testid="program-${SAMPLE_PROGRAMS.foodBank.id}"]`).or(
        page.locator(`:has-text("${SAMPLE_PROGRAMS.foodBank.name}")`)
      );

      // Click delete
      const deleteButton = programCard.locator('button:has-text("Delete"), [data-testid="delete-button"]').first();

      if (!(await deleteButton.isVisible({ timeout: 1000 }))) {
        const menuButton = programCard.locator('button[aria-label*="menu"], button:has-text("⋮")').first();
        if (await menuButton.isVisible({ timeout: 1000 })) {
          await menuButton.click();
        }
      }

      await page.locator('button:has-text("Delete")').first().click();

      // Confirm if needed
      const confirmButton = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        // Should NOT show dependency warning this time
        const modalText = await page.locator('[role="dialog"]').first().textContent();
        expect(modalText).not.toMatch(/dependenc/i);

        await confirmButton.click();
      }

      await waitForSuccessToast(page);

      // Verify program is deleted
      await expect(programCard.first()).not.toBeVisible({ timeout: 3000 });
    });
  });

  test('should show dependency warning when deleting form used by CTA', async ({ page }) => {
    // Create form
    await navigateToSection(page, 'forms');
    const createFormButton = page.locator('button:has-text("Create")').first();
    await createFormButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'cta_dependency_form');
    await fillFormField(page, 'name', 'CTA Dependency Form');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Create CTA that references the form
    await navigateToSection(page, 'ctas');
    const createCtaButton = page.locator('button:has-text("Create")').first();
    await createCtaButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'cta_dependency_test');
    await fillFormField(page, 'label', 'CTA Dependency Test');
    await page.locator('select[name="action"]').first().selectOption('start_form');
    await page.waitForTimeout(500);
    await page.locator('select[name="formId"]').first().selectOption('cta_dependency_form');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Try to delete the form
    await navigateToSection(page, 'forms');
    const formCard = page.locator('[data-testid="form-cta_dependency_form"]').or(
      page.locator(':has-text("CTA Dependency Form")')
    );

    const deleteButton = formCard.locator('button:has-text("Delete")').first();
    if (!(await deleteButton.isVisible({ timeout: 1000 }))) {
      const menuButton = formCard.locator('button[aria-label*="menu"]').first();
      if (await menuButton.isVisible({ timeout: 1000 })) {
        await menuButton.click();
      }
    }

    await page.locator('button:has-text("Delete")').first().click();

    // Should show dependency warning
    const warningModal = page.locator('[role="dialog"]:has-text("Dependency"), [role="dialog"]:has-text("Warning"), [role="alertdialog"]').first();
    await expect(warningModal).toBeVisible({ timeout: 5000 });

    // Should mention the CTA
    const dependencyList = warningModal.locator(':has-text("CTA Dependency Test"), :has-text("cta_dependency_test")').first();
    await expect(dependencyList).toBeVisible({ timeout: 3000 });
  });

  test('should show dependency warning when deleting CTA used by branch', async ({ page }) => {
    // Create CTA
    await navigateToSection(page, 'ctas');
    const createCtaButton = page.locator('button:has-text("Create")').first();
    await createCtaButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'branch_dependency_cta');
    await fillFormField(page, 'label', 'Branch Dependency CTA');
    await page.locator('select[name="action"]').first().selectOption('show_info');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Create branch that references the CTA
    await navigateToSection(page, 'branches');
    const createBranchButton = page.locator('button:has-text("Create")').first();
    await createBranchButton.click();
    await waitForModal(page);
    await fillFormField(page, 'id', 'branch_dependency_test');
    await fillFormField(page, 'name', 'Branch Dependency Test');
    await clickButton(page, 'Save');
    await waitForSuccessToast(page);

    // Assign CTA to branch
    const branchCard = page.locator('[data-testid="branch-branch_dependency_test"]').or(
      page.locator(':has-text("Branch Dependency Test")')
    );
    await branchCard.first().click();
    await page.locator('select[name="primaryCtaId"]').first().selectOption('branch_dependency_cta');
    await page.locator('button:has-text("Save")').first().click();
    await waitForSuccessToast(page);

    // Try to delete the CTA
    await navigateToSection(page, 'ctas');
    const ctaCard = page.locator('[data-testid="cta-branch_dependency_cta"]').or(
      page.locator(':has-text("Branch Dependency CTA")')
    );

    const deleteButton = ctaCard.locator('button:has-text("Delete")').first();
    if (!(await deleteButton.isVisible({ timeout: 1000 }))) {
      const menuButton = ctaCard.locator('button[aria-label*="menu"]').first();
      if (await menuButton.isVisible({ timeout: 1000 })) {
        await menuButton.click();
      }
    }

    await page.locator('button:has-text("Delete")').first().click();

    // Should show dependency warning
    const warningModal = page.locator('[role="dialog"]:has-text("Dependency"), [role="dialog"]:has-text("Warning"), [role="alertdialog"]').first();
    await expect(warningModal).toBeVisible({ timeout: 5000 });

    // Should mention the branch
    const dependencyList = warningModal.locator(':has-text("Branch Dependency Test"), :has-text("branch_dependency_test")').first();
    await expect(dependencyList).toBeVisible({ timeout: 3000 });
  });
});
