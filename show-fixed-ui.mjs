import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Opening application...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('header', { timeout: 10000 });

    // Select Atlanta Angels tenant
    console.log('Selecting tenant...');
    await page.click('button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('text=Atlanta Angels');
    await page.waitForTimeout(1500);

    // Navigate to Forms
    console.log('Navigating to Forms page...');
    await page.click('text=Forms');
    await page.waitForTimeout(1500);

    // Check for forms
    const formCount = await page.locator('.card').count();
    console.log(`Found ${formCount} forms`);

    if (formCount > 0) {
      // Click first form
      console.log('Opening first form...');
      await page.locator('.card').first().click();
      await page.waitForTimeout(1500);

      // Scroll to see fields
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(500);

      console.log('\n✅ Form editor opened');
      console.log('📸 You can now see the dropdown options with separate Value and Label fields!');
      console.log('\nBrowser will stay open for 60 seconds for you to test...');
      
      await page.waitForTimeout(60000);
    } else {
      console.log('⚠️  No forms found - you may need to create a form first');
      await page.waitForTimeout(30000);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
