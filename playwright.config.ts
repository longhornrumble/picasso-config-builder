import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Picasso Config Builder
 *
 * This configuration sets up end-to-end tests across multiple browsers
 * to ensure the config builder works correctly in real browser environments.
 */
export default defineConfig({
  testDir: './e2e',

  // NOTE: Removed global setup/teardown - using real S3 via local dev server instead of mock
  // globalSetup: './playwright.global-setup.ts',
  // globalTeardown: './playwright.global-teardown.ts',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Default navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Browser-specific settings
        launchOptions: {
          args: ['--disable-web-security'], // Allow CORS for local testing
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests.
  //
  // Two backends for the API on :3001:
  //  - E2E_MOCK_BACKEND=true (CI): in-memory mock with fixture tenants,
  //    no AWS creds needed. See e2e/fixtures/mock-server.ts.
  //  - default (local dev): real S3 via `npm run server:dev`, which
  //    reads the `ai-developer` AWS profile from ~/.aws/credentials.
  webServer: [
    {
      command: process.env.E2E_MOCK_BACKEND === 'true'
        ? 'npx tsx e2e/fixtures/start-mock-server.ts'
        : 'npm run server:dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // Frontend dev server on :3000. In CI the build step already
    // produced a bundle with the Clerk bypass, so `npm run dev`
    // (esbuild serve) picks it up consistently.
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        // Propagate bypass through the dev server build context so
        // aliasing stays active when webServer respawns esbuild.
        VITE_E2E_BYPASS_AUTH: process.env.VITE_E2E_BYPASS_AUTH || '',
        VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001',
        BUILD_ENV: 'development',
        PATH: process.env.PATH || '',
      },
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
