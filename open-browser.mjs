import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  const page = await browser.newPage({ viewport: null });

  try {
    console.log('Opening Config Builder at http://localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('header', { timeout: 10000 });
    
    console.log('\n✅ Application loaded successfully!');
    console.log('\n📋 To test the fixed dropdown options UI:');
    console.log('1. Select a tenant (e.g., Atlanta Angels)');
    console.log('2. Navigate to Forms');
    console.log('3. Create or edit a form');
    console.log('4. Add or edit a field with type "Select (Dropdown)"');
    console.log('5. You should now see TWO input fields per option:');
    console.log('   - Value (e.g., "yes", "no")');
    console.log('   - Label (e.g., "Yes, I am 22 or older")');
    console.log('\nBrowser will stay open for 2 minutes...');
    
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'browser-error.png' });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
