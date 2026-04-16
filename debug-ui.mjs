/**
 * Debug script to test UI interaction
 */
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to homepage...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'debug-1-homepage.png' });

  console.log('2. Waiting for tenant selector...');
  await page.waitForTimeout(3000); // Let tenants load
  await page.screenshot({ path: 'debug-2-tenants-loaded.png' });

  console.log('3. Opening tenant dropdown...');
  const selectTrigger = page.locator('button[role="combobox"]').first();
  await selectTrigger.waitFor({ state: 'visible', timeout: 10000 });
  await selectTrigger.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-3-dropdown-open.png' });

  console.log('4. Selecting MYR384719 tenant...');
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  const tenantOption = page.locator('[role="option"]:has-text("MYR384719")').first();
  await tenantOption.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-4-tenant-selected.png' });

  console.log('5. Navigating to Programs...');
  await page.click('text=Programs');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-5-programs-page.png', fullPage: true });

  console.log('6. Looking for Create button...');
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on page`);
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    console.log(`  Button ${i}: "${text}" (visible: ${visible})`);
  }

  console.log('\n✅ Debug complete! Check debug-*.png files');
  console.log('Press Ctrl+C to close browser...');

  // Keep browser open
  await page.waitForTimeout(60000);
}

main().catch(console.error);
