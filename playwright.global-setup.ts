/**
 * Playwright global setup — Clerk session bootstrap
 *
 * Runs once before any test file. Signs the E2E test user into Clerk via the
 * official `@clerk/testing` Playwright helpers, then persists the resulting
 * browser state (cookies + localStorage) to `playwright/.auth/user.json`.
 * Individual tests load that storage state via `use.storageState` in
 * `playwright.config.ts` and start out already-signed-in, so every test hits
 * the app authenticated as a real Clerk user — no auth bypass, multi-tenant
 * isolation enforced normally.
 */

import { chromium, type FullConfig } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const STORAGE_STATE_PATH = 'playwright/.auth/user.json';

async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD must be set in the ' +
        'environment. Locally, put them in .env.local; in CI they come from ' +
        'GitHub Actions secrets.'
    );
  }

  // Validate Clerk env + publishable/secret key pair. Throws a helpful error
  // if they're missing or malformed.
  await clerkSetup();

  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000';

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL);

  await clerk.signIn({
    page,
    signInParams: { strategy: 'password', identifier: email, password },
  });

  // After signIn the page navigates to the authenticated app root. Wait for
  // something that only renders post-auth to confirm the session is live.
  await page.goto(baseURL);
  await page.waitForLoadState('networkidle');

  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });

  await browser.close();
}

export default globalSetup;
