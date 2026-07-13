/**
 * FeatureFlagsSettings — MESSENGER_CHANNEL flag (Messenger Product Surface T1).
 *
 * MESSENGER_CHANNEL gates the entire Meta Messenger / Instagram DM layer in the
 * lambda pipeline (V5 prompt, escalation, forms, scheduling). The type already
 * exists (config contract C2, landed by the sibling program's M0); this flag is
 * the Config Builder toggle that lets an operator turn it on per tenant. These
 * tests mirror FeatureFlagsSettings.v5.test.tsx: the flag renders, reflects
 * config state, and toggling writes the EXACT key feature_flags.MESSENGER_CHANNEL
 * through the store.
 *
 * The exact-key assertion is load-bearing: FeatureFlags carries a string index
 * signature (config.ts), so `keyof FeatureFlags` is `string` and a typo in the
 * flag key would compile clean. The test is the only guardrail against that.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let mockBaseConfig: Record<string, unknown> = {};
const mockSetState = vi.fn();

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ config: { baseConfig: mockBaseConfig, isDirty: false } })
  ),
}));

import { useConfigStore } from '@/store';
import { FeatureFlagsSettings } from '../FeatureFlagsSettings';

beforeEach(() => {
  vi.clearAllMocks();
  mockBaseConfig = {};
  (useConfigStore as unknown as { setState: typeof mockSetState }).setState = mockSetState;
});

describe('FeatureFlagsSettings — MESSENGER_CHANNEL flag', () => {
  it('renders the Messenger Channel flag with its description and a stable checkbox id', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('Messenger Channel')).toBeInTheDocument();
    expect(
      screen.getByText(/Facebook Messenger \/ Instagram DM channel/)
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Messenger Channel/ })).toHaveAttribute(
      'id',
      'flag-MESSENGER_CHANNEL'
    );
  });

  it('reflects config state: unchecked when absent, checked when true', () => {
    const { unmount } = render(<FeatureFlagsSettings />);
    expect(screen.getByRole('checkbox', { name: /Messenger Channel/ })).not.toBeChecked();
    unmount();

    mockBaseConfig = { feature_flags: { MESSENGER_CHANNEL: true } };
    render(<FeatureFlagsSettings />);
    expect(screen.getByRole('checkbox', { name: /Messenger Channel/ })).toBeChecked();
  });

  it('toggling writes the exact key feature_flags.MESSENGER_CHANNEL through the store and dirties the config', async () => {
    mockBaseConfig = { feature_flags: {} };
    render(<FeatureFlagsSettings />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Messenger Channel/ }));
    expect(mockSetState).toHaveBeenCalledTimes(1);

    const updater = mockSetState.mock.calls[0][0] as (s: {
      config: { baseConfig: { feature_flags?: Record<string, boolean> }; isDirty: boolean };
    }) => void;
    const state = { config: { baseConfig: { feature_flags: {} as Record<string, boolean> }, isDirty: false } };
    updater(state);
    // Assert the literal key string — not merely "a boolean changed".
    expect(state.config.baseConfig.feature_flags?.MESSENGER_CHANNEL).toBe(true);
    expect(Object.keys(state.config.baseConfig.feature_flags ?? {})).toContain('MESSENGER_CHANNEL');
    expect(state.config.isDirty).toBe(true);
  });

  it('existing flags still render (no regression to prior definitions)', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('V5 Single-Pass Turn')).toBeInTheDocument();
    expect(screen.getByText('V4.0 Action Selector')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
  });
});
