# E2E Test Suite

End-to-end tests for Picasso Config Builder using Playwright.

## Quick Start

```bash
# Install dependencies (first time only)
npm install
npx playwright install chromium firefox webkit

# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run in interactive UI mode
npm run test:e2e:ui
```

## Test Files

- **form-creation.spec.ts** - Complete form creation workflow (3 tests)
- **branch-editor.spec.ts** - CTA and branch assignment workflow (3 tests)
- **dependency-warnings.spec.ts** - Dependency checking system (3 tests)
- **validation.spec.ts** - Validation and deployment blocking (5 tests)
- **cross-browser.spec.ts** - Cross-browser compatibility (13+ tests)

## Running Specific Tests

```bash
# Run single test file
npx playwright test e2e/form-creation.spec.ts

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run tests matching pattern
npx playwright test --grep "dependency warning"

# Debug mode
npx playwright test --debug
```

## Test Structure

### Fixtures (Test Helpers)

**test-helpers.ts** - Reusable utilities:
- `selectTenant()` - Select tenant from homepage
- `navigateToSection()` - Navigate to forms/ctas/branches
- `createProgram()` - Create a program
- `createCTA()` - Create a CTA
- `deployConfig()` - Deploy configuration
- `waitForToast()` - Wait for toast notifications
- `waitForModal()` - Wait for modal dialogs
- And many more...

**test-data.ts** - Mock data:
- `TEST_TENANT` - Test tenant configuration
- `SAMPLE_PROGRAMS` - Sample program data
- `SAMPLE_FORMS` - Sample form configurations
- `SAMPLE_CTAS` - Sample CTA data
- `INVALID_CTA_DATA` - Data for validation testing

**mock-server.ts** - Mock backend:
- In-memory config storage
- RESTful API endpoints
- Automatic reset between tests

## Writing New Tests

### Template

```typescript
import { test, expect } from '@playwright/test';
import { selectTenant, navigateToSection, clickButton } from './fixtures/test-helpers';
import { TEST_TENANT } from './fixtures/test-data';

test.describe('My New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await selectTenant(page, TEST_TENANT.id);
  });

  test('should do something', async ({ page }) => {
    await navigateToSection(page, 'forms');
    await clickButton(page, 'Create');
    // ... test steps
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use test helpers** - Don't repeat common actions
2. **Use test data** - Don't hardcode data in tests
3. **Independent tests** - Each test should run standalone
4. **Auto-waiting** - Use Playwright's auto-wait instead of `waitForTimeout`
5. **Descriptive names** - Test names should describe the behavior
6. **Test steps** - Use `test.step()` for better reporting

## Debugging

### Visual Debugging

```bash
# UI mode (best for development)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (pause on errors)
npx playwright test --debug

# Specific test in debug mode
npx playwright test e2e/form-creation.spec.ts --debug
```

### Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots

Screenshots are automatically captured on failure:
- Location: `playwright-report/screenshots/`
- View in HTML report: `npx playwright show-report`

## CI/CD

Tests automatically run on:
- Push to `main` or `develop`
- Pull requests

See `.github/workflows/e2e-tests.yml` for configuration.

## Troubleshooting

### Tests timeout
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 90000, // 90 seconds
```

### Port already in use
Stop dev server or change port:
```bash
killall node
# or
export DEV_SERVER_PORT=8081
```

### Flaky tests
Use auto-wait instead of fixed timeouts:
```typescript
// Bad
await page.waitForTimeout(1000);

// Good
await expect(element).toBeVisible();
```

### Browser not found
Reinstall browsers:
```bash
npx playwright install --with-deps
```

## Performance

Average test execution times (parallel):
- Form Creation: ~15s
- Branch Editor: ~12s
- Dependency Warnings: ~18s
- Validation: ~20s
- Cross-Browser: ~45s

**Total**: ~2 minutes for all tests

## Documentation

See [E2E_TEST_DOCUMENTATION.md](../E2E_TEST_DOCUMENTATION.md) for comprehensive documentation.

## Support

Questions? Contact:
- QA Team: qa@company.com
- Dev Lead: dev-lead@company.com
- Slack: #picasso-e2e-tests
