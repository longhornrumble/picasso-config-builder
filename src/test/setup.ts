import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// A real build always declares VITE_CHANNELS_API_URL (staging in pr-checks.yml,
// prod in deploy-production.yml). Give the test env a default so the welcome
// auto-push (metaWelcome.ts) resolves as "configured" by default; its
// not-configured path is exercised via vi.stubEnv('') + module reset.
vi.stubEnv('VITE_CHANNELS_API_URL', 'https://channels.test.example');

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});
