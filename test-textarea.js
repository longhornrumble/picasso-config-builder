import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Select tenant
    await page.selectOption('select#tenant-select', 'MYR384719');
    await page.waitForTimeout(1000);

    // Navigate to Programs Editor
    await page.click('button:has-text("Programs")');
    await page.waitForTimeout(500);

    // Click Create Program button
    await page.click('button:has-text("Create Program")');
    await page.waitForTimeout(500);

    // Fill the input fields (these work)
    await page.fill('input[id="program-id"]', 'test_program');
    await page.fill('input[id="program-name"]', 'Test Program');

    // Try to interact with textarea
    console.log('Attempting to click and type in textarea...');
    const textarea = await page.locator('textarea[id="description"]');

    // Check if textarea exists
    const exists = await textarea.count();
    console.log('Textarea exists:', exists > 0);

    if (exists > 0) {
      // Check properties
      const isVisible = await textarea.isVisible();
      const isEnabled = await textarea.isEnabled();
      const isEditable = await textarea.isEditable();
      const currentValue = await textarea.inputValue();

      console.log('Textarea visible:', isVisible);
      console.log('Textarea enabled:', isEnabled);
      console.log('Textarea editable:', isEditable);
      console.log('Current value:', currentValue);

      // Try to fill it
      await textarea.click();
      await textarea.fill('This is a test description');

      // Check if value changed
      const newValue = await textarea.inputValue();
      console.log('New value:', newValue);
      console.log('Fill successful:', newValue === 'This is a test description');
    }

    // Keep browser open for 30 seconds for manual inspection
    console.log('\nKeeping browser open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
