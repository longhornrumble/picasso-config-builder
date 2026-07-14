import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// A real build always declares VITE_CHANNELS_API_URL (staging in pr-checks.yml,
// prod in deploy-production.yml). Give the test env a default so ChannelsSettings
// behaves as "configured" by default; the fail-loud (unset) path is exercised in
// ChannelsSettings.failLoud.test.tsx via vi.stubEnv('') + module reset.
vi.stubEnv('VITE_CHANNELS_API_URL', 'https://channels.test.example');

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});
