/**
 * ChannelsSettings — fail-loud when VITE_CHANNELS_API_URL is unset (T3a / G6).
 *
 * The component no longer hardcodes the PROD OAuth URL as a fallback. When a
 * build fails to declare VITE_CHANNELS_API_URL, connect/manage must fail loud
 * (visible notice + no network call) rather than silently driving the prod
 * OAuth handler from a staging/dev build.
 *
 * The URL is resolved into a module-level const, so this file resets modules and
 * re-imports the component with the env stubbed empty (setup.ts stubs a default
 * for every other test).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSetState = vi.fn();
vi.mock('@/store', () => ({
  useConfigStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) =>
      selector({ config: { tenantId: 'TENANT123', baseConfig: {}, isDirty: false } })
    ),
    { setState: (fn: unknown) => mockSetState(fn) }
  ),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('mock-jwt-token') }),
}));

const mockFetch = vi.fn();

describe('ChannelsSettings — fail-loud when channels API is not configured', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_CHANNELS_API_URL', '');
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function renderUnconfigured() {
    const { ChannelsSettings } = await import('../ChannelsSettings');
    return render(<ChannelsSettings />);
  }

  it('shows a not-configured notice', async () => {
    await renderUnconfigured();
    expect(screen.getByText(/not configured for this build/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_CHANNELS_API_URL/)).toBeInTheDocument();
  });

  it('connect click fails loud and sends NO network request', async () => {
    const user = userEvent.setup();
    await renderUnconfigured();

    await user.click(screen.getByRole('button', { name: /connect a facebook page/i }));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/No request was sent/i)).toBeInTheDocument();
  });
});
