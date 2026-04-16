/**
 * Debug script to capture console errors
 */
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log('❌ PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });

  console.log('1. Navigating to homepage...');
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (err) {
    console.log('⚠️  Navigation warning:', err.message);
  }

  // Wait a bit to let errors surface
  await page.waitForTimeout(3000);

  console.log('2. Taking screenshot...');
  await page.screenshot({ path: 'debug-error-screenshot.png' });

  console.log('\n📝 Console Messages Summary:');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');

  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Total Messages: ${consoleMessages.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach((err, i) => {
      console.log(`\n  ${i + 1}. ${err.text}`);
      if (err.location) {
        console.log(`     Location: ${err.location.url}:${err.location.lineNumber}`);
      }
    });
  }

  console.log('\n✅ Debug complete! Check debug-error-screenshot.png');
  console.log('Keeping browser open for 60 seconds...\n');

  // Keep browser open
  await page.waitForTimeout(60000);
  await browser.close();
}

main().catch(console.error);
