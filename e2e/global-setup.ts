/**
 * Playwright Global Setup — Clerk Authentication
 *
 * Runs once before any test. Signs in via the real Clerk sign-in flow using
 * test-user credentials sourced from environment variables, then saves the
 * authenticated browser storage state to e2e/.auth/user.json. Every test in
 * playwright.config.ts loads that state via `use.storageState`, so each test
 * starts already signed in — no per-test login UI work, no flake from sign-in
 * form timing, no Clerk auth-gate timeouts.
 *
 * Required env vars (set by CI workflow, optional locally):
 *   E2E_CLERK_USER_EMAIL    — test user email
 *   E2E_CLERK_USER_PASSWORD — test user password
 *
 * Reference: https://playwright.dev/docs/auth#authenticate-with-api-request
 *            https://clerk.com/docs/testing/playwright/overview
 */

import { chromium, FullConfig } from '@playwright/test';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const AUTH_DIR = join(__dirname, '.auth');
const AUTH_FILE = join(AUTH_DIR, 'user.json');

async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD must be set. ' +
      'Locally: export them in your shell. CI: confirm GitHub repo secrets are wired in e2e-tests.yml.'
    );
  }

  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
  }

  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  console.log(`[global-setup] Signing in as ${email} at ${baseURL}…`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL);

    // Clerk's <SignIn> renders the email field as input[name="identifier"]
    // and the password field as input[name="password"] (standard Clerk markup).
    // Wait for the sign-in form to appear (the app shows it inline when
    // signed-out per src/App.tsx <Show when="signed-out">).
    await page.waitForSelector('input[name="identifier"]', { timeout: 30_000 });
    await page.fill('input[name="identifier"]', email);

    // Clerk uses a multi-step form: click "Continue" after email, then enter password.
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('input[name="password"]', { timeout: 15_000 });
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Continue")');

    // After successful auth, the app's <Show when="signed-in"> renders. The
    // tenant selector (button[role="combobox"]) is the canonical "I'm in the
    // app now" indicator — it only mounts after auth completes.
    await page.waitForSelector('button[role="combobox"]', { timeout: 30_000 });

    // Persist storage state (cookies + localStorage) so every test loads in
    // the signed-in state.
    await context.storageState({ path: AUTH_FILE });

    console.log(`[global-setup] Auth state saved to ${AUTH_FILE}`);
  } catch (err) {
    // Capture a screenshot for CI debugging if sign-in fails.
    const failurePath = join(AUTH_DIR, 'global-setup-failure.png');
    await page.screenshot({ path: failurePath, fullPage: true }).catch(() => {});
    console.error(`[global-setup] Sign-in failed. Screenshot: ${failurePath}`);
    throw err;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
