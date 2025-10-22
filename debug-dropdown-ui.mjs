/**
 * Debug dropdown options UI
 */
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('header', { timeout: 10000 });

    // Select tenant
    console.log('Selecting tenant...');
    await page.click('button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('text=Atlanta Angels');
    await page.waitForTimeout(1000);

    // Navigate to Forms
    console.log('Navigating to Forms...');
    await page.click('text=Forms');
    await page.waitForTimeout(1000);

    // Look for an existing form to edit
    console.log('Looking for existing forms...');
    const formCards = await page.locator('.card').count();
    
    if (formCards > 0) {
      // Click the first form
      console.log('Opening first form...');
      await page.locator('.card').first().click();
      await page.waitForTimeout(1000);

      // Look for fields
      const fieldEditButtons = await page.locator('button:has-text("Edit")').count();
      console.log(`Found ${fieldEditButtons} field edit buttons`);

      if (fieldEditButtons > 0) {
        // Click the first Edit button
        console.log('Clicking Edit button for first field...');
        await page.locator('button').filter({ hasText: /^Edit$/ }).first().click();
        await page.waitForTimeout(1000);

        // Take screenshot of the FieldEditor modal
        console.log('Taking screenshot of FieldEditor modal...');
        await page.screenshot({ path: 'field-editor-modal.png', fullPage: true });

        // Check if it's a select field
        const fieldTypeValue = await page.locator('select[id="field_type"]').inputValue().catch(() => null);
        console.log(`Field type: ${fieldTypeValue}`);

        // Look for dropdown options section
        const optionsSection = await page.locator('text=Dropdown Options').count();
        console.log(`Dropdown Options sections found: ${optionsSection}`);

        if (optionsSection > 0) {
          // Get the HTML of the options section
          const optionsHtml = await page.locator('text=Dropdown Options').locator('..').innerHTML();
          console.log('\nOptions section HTML:');
          console.log(optionsHtml.substring(0, 500));
        }
      }
    }

    console.log('\nScreenshot saved to field-editor-modal.png');
    console.log('Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'debug-dropdown-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
