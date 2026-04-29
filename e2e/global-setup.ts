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

  if (!publishableKey || !secretKey || !email) {
    throw new Error(
      'Missing one or more required env vars: VITE_CLERK_PUBLISHABLE_KEY, ' +
      'CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL. ' +
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

    // Email-based sign-in via @clerk/testing. Internally:
    //   1. Uses CLERK_SECRET_KEY to look up the user by email (Backend API).
    //   2. Creates a short-lived sign-in token (ticket) via the Backend API.
    //   3. Calls window.Clerk.client.signIn with strategy='ticket' in the page.
    //   4. WAITS for window.Clerk.user !== null before returning.
    //
    // This path is more robust than the signInParams/password path because:
    //   - No password verification flake (secret-key-issued ticket).
    //   - Wraps setupClerkTestingToken automatically (bypasses bot protection).
    //   - Synchronously waits for the session to be active before returning,
    //     so the next page interaction sees the signed-in state.
    await clerk.signIn({ emailAddress: email, page });
    console.log('[global-setup] clerk.signIn() returned; window.Clerk.user is set.');

    // Wait for the app to render in signed-in state. Try multiple anchor
    // selectors — the tenant selector (button[role="combobox"]) is the
    // canonical signed-in indicator, but it depends on TenantSelector
    // having loaded tenants. Fall back to any sidebar nav link, which
    // mounts as soon as the Layout is rendered.
    try {
      await Promise.race([
        page.waitForSelector('button[role="combobox"]', { timeout: 60_000 }),
        page.waitForSelector('nav a[href="/programs"]', { timeout: 60_000 }),
      ]);
    } catch (waitErr) {
      // Surface what's actually on the page when the wait times out.
      const pageState = await page.evaluate(() => {
        const w = window as any;
        return {
          url: location.href,
          title: document.title,
          bodyTextSnippet: document.body?.innerText?.slice(0, 500) ?? '',
          combobox: !!document.querySelector('button[role="combobox"]'),
          signInForm: !!document.querySelector('input[name="identifier"]'),
          navLinks: Array.from(document.querySelectorAll('nav a')).map(
            (a) => (a as HTMLAnchorElement).href
          ).slice(0, 10),
          clerkUser: w.Clerk?.user?.id ?? null,
          clerkSessionStatus: w.Clerk?.session?.status ?? null,
        };
      });
      console.error('[global-setup] Page state at timeout:', JSON.stringify(pageState, null, 2));
      throw waitErr;
    }

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
