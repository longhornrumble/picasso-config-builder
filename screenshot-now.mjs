import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'current-state.png', fullPage: true });

  console.log('Screenshot saved to current-state.png');
  await browser.close();
}

main().catch(console.error);
