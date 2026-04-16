/**
 * Debug intermittent loading issues
 * Tests multiple page loads to identify race conditions
 */
import { chromium } from '@playwright/test';

async function testPageLoad(iteration) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = {
    console: [],
    errors: [],
    networkRequests: [],
    networkFailures: [],
  };

  // Track console messages
  page.on('console', (msg) => {
    logs.console.push({
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
    });
    if (msg.type() === 'error') {
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  // Track page errors
  page.on('pageerror', (error) => {
    logs.errors.push({
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  // Track network requests
  page.on('request', (request) => {
    logs.networkRequests.push({
      url: request.url(),
      method: request.method(),
      time: new Date().toISOString(),
    });
  });

  // Track failed requests
  page.on('requestfailed', (request) => {
    logs.networkFailures.push({
      url: request.url(),
      failure: request.failure().errorText,
      time: new Date().toISOString(),
    });
    console.log(`❌ REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });

  console.log(`\n📊 Test #${iteration} - Starting...`);

  try {
    // Navigate to page
    console.log('  1. Navigating...');
    const startTime = Date.now();
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    const navTime = Date.now() - startTime;
    console.log(`  ✅ Navigation complete (${navTime}ms)`);

    // Check if key elements are visible
    console.log('  2. Checking for key elements...');

    const checks = {
      header: false,
      navigation: false,
      tenantSelector: false,
      quickActions: false,
    };

    try {
      await page.waitForSelector('header', { timeout: 3000 });
      checks.header = true;
      console.log('  ✅ Header found');
    } catch (e) {
      console.log('  ❌ Header NOT found');
    }

    try {
      await page.waitForSelector('nav', { timeout: 3000 });
      checks.navigation = true;
      console.log('  ✅ Navigation found');
    } catch (e) {
      console.log('  ❌ Navigation NOT found');
    }

    try {
      await page.waitForSelector('button[role="combobox"]', { timeout: 3000 });
      checks.tenantSelector = true;
      console.log('  ✅ Tenant selector found');
    } catch (e) {
      console.log('  ❌ Tenant selector NOT found');
    }

    try {
      await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
      checks.quickActions = true;
      console.log('  ✅ Quick Actions found');
    } catch (e) {
      console.log('  ❌ Quick Actions NOT found');
    }

    // Take screenshot
    await page.screenshot({
      path: `debug-test-${iteration}.png`,
      fullPage: true
    });

    const allPassed = Object.values(checks).every(v => v);

    if (!allPassed) {
      console.log(`\n⚠️  Test #${iteration} INCOMPLETE - Some elements missing`);
      console.log('  Missing elements:', Object.entries(checks)
        .filter(([k, v]) => !v)
        .map(([k]) => k)
        .join(', '));
    } else {
      console.log(`\n✅ Test #${iteration} PASSED - All elements found`);
    }

    // Log summary
    console.log(`\n📝 Summary for Test #${iteration}:`);
    console.log(`  Console errors: ${logs.console.filter(l => l.type === 'error').length}`);
    console.log(`  Page errors: ${logs.errors.length}`);
    console.log(`  Network failures: ${logs.networkFailures.length}`);
    console.log(`  Total requests: ${logs.networkRequests.length}`);

    if (logs.errors.length > 0) {
      console.log(`\n  Errors:`);
      logs.errors.forEach(err => console.log(`    - ${err.message}`));
    }

    if (logs.networkFailures.length > 0) {
      console.log(`\n  Failed requests:`);
      logs.networkFailures.forEach(req => console.log(`    - ${req.url}`));
    }

    // Wait before closing
    await page.waitForTimeout(2000);

  } catch (error) {
    console.log(`\n❌ Test #${iteration} FAILED with error:`);
    console.log(`  ${error.message}`);
    await page.screenshot({
      path: `debug-test-${iteration}-error.png`,
      fullPage: true
    });
  } finally {
    await browser.close();
  }

  return logs;
}

async function main() {
  console.log('🔍 Testing page load reliability...\n');
  console.log('Running 5 consecutive tests...\n');

  const results = [];

  for (let i = 1; i <= 5; i++) {
    const logs = await testPageLoad(i);
    results.push(logs);

    // Wait between tests
    if (i < 5) {
      console.log('\n⏳ Waiting 3 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n\n📊 FINAL SUMMARY');
  console.log('================\n');

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalFailures = results.reduce((sum, r) => sum + r.networkFailures.length, 0);

  console.log(`Total tests: 5`);
  console.log(`Total page errors: ${totalErrors}`);
  console.log(`Total network failures: ${totalFailures}`);

  if (totalErrors === 0 && totalFailures === 0) {
    console.log('\n✅ All tests passed - no issues detected');
  } else {
    console.log('\n⚠️  Issues detected - check screenshots for details');
  }
}

main().catch(console.error);
