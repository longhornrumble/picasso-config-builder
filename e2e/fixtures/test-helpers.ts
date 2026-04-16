/**
 * Test Helpers for E2E Tests
 * Common utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for a toast message to appear with specific text
 */
export async function waitForToast(page: Page, text: string, timeout = 5000) {
  const toast = page.locator('[role="alert"], [data-testid="toast"]', { hasText: text }).first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/**
 * Wait for success toast
 */
export async function waitForSuccessToast(page: Page, timeout = 5000) {
  const toast = page.locator('[role="alert"]:has-text("success"), [data-testid="toast"]:has-text("success"), .toast-success').first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/**
 * Wait for error toast
 */
export async function waitForErrorToast(page: Page, timeout = 5000) {
  const toast = page.locator('[role="alert"]:has-text("error"), [data-testid="toast"]:has-text("error"), .toast-error').first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/**
 * Close all toasts
 */
export async function closeAllToasts(page: Page) {
  const closeButtons = page.locator('[role="alert"] button[aria-label="Close"], [data-testid="toast"] button');
  const count = await closeButtons.count();
  for (let i = 0; i < count; i++) {
    await closeButtons.nth(0).click({ force: true }).catch(() => {});
  }
}

/**
 * Navigate to a specific section
 */
export async function navigateToSection(page: Page, section: 'programs' | 'forms' | 'ctas' | 'branches' | 'cards' | 'settings') {
  await page.goto(`/${section}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Select a tenant from the homepage
 * Supports both tenant IDs (e.g., MYR384719) and display names (e.g., Atlanta Angels)
 */
export async function selectTenant(page: Page, tenantIdOrName: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Wait for tenant selector to load (Radix UI Select trigger button)
  const selectTrigger = page.locator('button[role="combobox"]').first();
  await selectTrigger.waitFor({ state: 'visible', timeout: 10000 });

  // Wait for tenants to actually load (button text should change from "Loading tenants...")
  await page.waitForFunction(
    () => {
      const button = document.querySelector('button[role="combobox"]');
      return button && !button.textContent?.includes('Loading');
    },
    { timeout: 15000 }
  );

  // Click to open dropdown
  await selectTrigger.click();

  // Wait for dropdown content to appear
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

  // Click the tenant option by ID or display name
  // Try exact match first, then partial match
  let tenantOption = page.locator(`[role="option"]:has-text("${tenantIdOrName}")`).first();

  // Wait for option to be visible
  await tenantOption.waitFor({ state: 'visible', timeout: 5000 });
  await tenantOption.click();

  // Wait for config to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give time for config loading and store updates
}

/**
 * Fill form field helper
 */
export async function fillFormField(page: Page, label: string, value: string) {
  const input = page.locator(`input[name="${label}"], textarea[name="${label}"], input[id="${label}"], textarea[id="${label}"]`).first();
  await input.fill(value);
}

/**
 * Click button by text or test ID
 * Handles both "Create X" and "Create First X" button variants
 */
export async function clickButton(page: Page, textOrTestId: string) {
  // For Create buttons, try both regular and "First" variants
  let selector = `button:has-text("${textOrTestId}"), [data-testid="${textOrTestId}"]`;

  if (textOrTestId.startsWith('Create ') && !textOrTestId.includes('First')) {
    const entityName = textOrTestId.replace('Create ', '');
    const firstVariant = `Create First ${entityName}`;
    selector = `button:has-text("${textOrTestId}"), button:has-text("${firstVariant}"), [data-testid="${textOrTestId}"]`;
  }

  const button = page.locator(selector).first();
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for modal to open
 */
export async function waitForModal(page: Page, titleText?: string) {
  if (titleText) {
    const modal = page.locator('[role="dialog"], [data-testid="modal"]', { hasText: titleText }).first();
    await expect(modal).toBeVisible();
    return modal;
  } else {
    const modal = page.locator('[role="dialog"], [data-testid="modal"]').first();
    await expect(modal).toBeVisible();
    return modal;
  }
}

/**
 * Close modal
 */
export async function closeModal(page: Page) {
  // Try multiple ways to close modal
  const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [data-testid="modal-close"], [role="dialog"] button:has-text("Cancel")').first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Try pressing Escape
    await page.keyboard.press('Escape');
  }

  await page.waitForLoadState('networkidle');
}

/**
 * Wait for validation to complete
 */
export async function waitForValidation(page: Page) {
  // Wait for validation spinner to disappear
  await page.locator('[data-testid="validation-spinner"], .validation-loading').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

/**
 * Check if element is disabled
 */
export async function expectDisabled(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeDisabled();
}

/**
 * Check if element is enabled
 */
export async function expectEnabled(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeEnabled();
}

/**
 * Get validation errors from the page
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
  const errorElements = page.locator('[data-testid="validation-error"], .validation-error, [role="alert"].error');
  const count = await errorElements.count();
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent();
    if (text) errors.push(text.trim());
  }

  return errors;
}

/**
 * Create a program
 */
export async function createProgram(page: Page, programData: { id: string; name: string; description?: string }) {
  await navigateToSection(page, 'programs');

  // Click create button
  await clickButton(page, 'Create Program');
  await waitForModal(page);

  // Fill form
  await fillFormField(page, 'id', programData.id);
  await fillFormField(page, 'name', programData.name);
  if (programData.description) {
    await fillFormField(page, 'description', programData.description);
  }

  // Submit
  await clickButton(page, 'Save');
  await waitForSuccessToast(page);
}

/**
 * Create a CTA
 */
export async function createCTA(page: Page, ctaData: {
  id: string;
  label: string;
  action: string;
  formId?: string;
  cardId?: string;
}) {
  await navigateToSection(page, 'ctas');

  await clickButton(page, 'Create CTA');
  await waitForModal(page);

  await fillFormField(page, 'id', ctaData.id);
  await fillFormField(page, 'label', ctaData.label);

  // Select action
  const actionSelect = page.locator('select[name="action"], [data-testid="action-select"]').first();
  await actionSelect.selectOption(ctaData.action);

  // Fill optional fields based on action
  if (ctaData.action === 'start_form' && ctaData.formId) {
    const formSelect = page.locator('select[name="formId"], [data-testid="form-select"]').first();
    await formSelect.selectOption(ctaData.formId);
  }

  if (ctaData.action === 'show_card' && ctaData.cardId) {
    await fillFormField(page, 'cardId', ctaData.cardId);
  }

  await clickButton(page, 'Save');
  await waitForSuccessToast(page);
}

/**
 * Deploy configuration
 */
export async function deployConfig(page: Page) {
  // Look for deploy button in header or settings
  const deployButton = page.locator('button:has-text("Deploy"), [data-testid="deploy-button"]').first();
  await deployButton.click();

  // Wait for confirmation modal if it appears
  const confirmButton = page.locator('[role="dialog"] button:has-text("Deploy"), [role="dialog"] button:has-text("Confirm")').first();
  if (await confirmButton.isVisible({ timeout: 2000 })) {
    await confirmButton.click();
  }

  await waitForSuccessToast(page);
}

/**
 * Measure page load time
 */
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Wait for network idle (no requests for 500ms)
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Screenshot helper for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `playwright-report/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}
