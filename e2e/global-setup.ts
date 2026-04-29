/**
 * Playwright Global Setup — Clerk Authentication via @clerk/testing
 *
 * Uses Clerk's official testing package (@clerk/testing) to:
 *   1. Fetch a TestingToken from Clerk Backend API (bypasses bot protection in CI).
 *   2. Sign in programmatically via Clerk Frontend API — no form interaction,
 *      no Google OAuth redirect concerns, no flaky selectors.
 *   3. Save the authenticated browser storage state to e2e/.auth/user.json
 *      so every test loads it via use.storageState (defined in playwright.config.ts).
 *
 * Required env vars (set via GitHub repo secrets in CI; export locally for dev):
 *   VITE_CLERK_PUBLISHABLE_KEY — Clerk dev/test instance publishable key (pk_test_…)
 *   CLERK_SECRET_KEY           — Clerk dev/test instance secret key (sk_test_…)
 *   E2E_CLERK_USER_EMAIL       — test user email
 *   E2E_CLERK_USER_PASSWORD    — test user password
 *
 * Reference: https://clerk.com/docs/testing/playwright/overview
 */

import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { chromium, FullConfig } from '@playwright/test';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const AUTH_DIR = join(__dirname, '.auth');
const AUTH_FILE = join(AUTH_DIR, 'user.json');

async function globalSetup(config: FullConfig) {
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!publishableKey || !secretKey || !email || !password) {
    throw new Error(
      'Missing one or more required env vars: VITE_CLERK_PUBLISHABLE_KEY, ' +
      'CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_PASSWORD. ' +
      'CI: confirm GitHub repo secrets are set and injected via the workflow. ' +
      'Local: export them in your shell before running.'
    );
  }

  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
  }

  console.log('[global-setup] Fetching Clerk testing token…');
  await clerkSetup({ publishableKey });

  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  console.log(`[global-setup] Signing in via Clerk Frontend API at ${baseURL}…`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL);

    // Programmatic sign-in via Clerk Frontend API. Bypasses the form, OAuth
    // redirects, and bot protection. Authenticates the page's Clerk session
    // directly with the password strategy.
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: email,
        password,
      },
    });
    console.log('[global-setup] clerk.signIn() returned without error');

    // Reload so React detects the new Clerk session and re-renders to the
    // signed-in branch. Without this, <Show when="signed-out"> can stay
    // mounted indefinitely even though cookies/localStorage are now signed-in.
    await page.reload();

    // Wait for the app to render in signed-in state. The tenant selector
    // (button[role="combobox"]) only mounts inside <Show when="signed-in">,
    // so its presence confirms auth completed.
    await page.waitForSelector('button[role="combobox"]', { timeout: 30_000 });

    await context.storageState({ path: AUTH_FILE });
    console.log(`[global-setup] Auth state saved to ${AUTH_FILE}`);
  } catch (err) {
    const failurePath = join(AUTH_DIR, 'global-setup-failure.png');
    await page.screenshot({ path: failurePath, fullPage: true }).catch(() => {});
    console.error(`[global-setup] Sign-in failed. Screenshot: ${failurePath}`);
    throw err;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
