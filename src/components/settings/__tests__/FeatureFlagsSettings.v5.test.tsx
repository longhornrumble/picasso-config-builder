/**
 * FeatureFlagsSettings — V5_SINGLE_PASS flag (V5.7 prerequisite).
 *
 * The V5 single-pass turn rollout flips feature_flags.V5_SINGLE_PASS per
 * tenant, and the Config Builder is where tenant config changes start — so
 * the flag must be toggleable from the Pipeline Feature Flags panel. These
 * tests mirror FeatureFlagsSettings.scheduling.test.tsx: the flag renders,
 * reflects config state, and toggling writes feature_flags.V5_SINGLE_PASS
 * through the store.
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

describe('FeatureFlagsSettings — V5_SINGLE_PASS flag', () => {
  it('renders the V5 flag with its description, listed above V4 (precedence order)', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('V5 Single-Pass Turn')).toBeInTheDocument();
    expect(
      screen.getByText(/Takes precedence over V4\.0 Action Selector when both are enabled/)
    ).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('id', 'flag-V5_SINGLE_PASS');
    expect(checkboxes[1]).toHaveAttribute('id', 'flag-V4_ACTION_SELECTOR');
  });

  it('reflects config state: unchecked when absent, checked when true', () => {
    const { unmount } = render(<FeatureFlagsSettings />);
    expect(screen.getByRole('checkbox', { name: /V5 Single-Pass Turn/ })).not.toBeChecked();
    unmount();

    mockBaseConfig = { feature_flags: { V5_SINGLE_PASS: true } };
    render(<FeatureFlagsSettings />);
    expect(screen.getByRole('checkbox', { name: /V5 Single-Pass Turn/ })).toBeChecked();
  });

  it('toggling writes feature_flags.V5_SINGLE_PASS through the store and dirties the config', async () => {
    mockBaseConfig = { feature_flags: {} };
    render(<FeatureFlagsSettings />);

    await userEvent.click(screen.getByRole('checkbox', { name: /V5 Single-Pass Turn/ }));
    expect(mockSetState).toHaveBeenCalledTimes(1);

    // Apply the updater to a fake state and assert the write.
    const updater = mockSetState.mock.calls[0][0] as (s: {
      config: { baseConfig: { feature_flags?: Record<string, boolean> }; isDirty: boolean };
    }) => void;
    const state = { config: { baseConfig: { feature_flags: {} as Record<string, boolean> }, isDirty: false } };
    updater(state);
    expect(state.config.baseConfig.feature_flags?.V5_SINGLE_PASS).toBe(true);
    expect(state.config.isDirty).toBe(true);
  });

  it('V4 and scheduling flags still render (no regression to existing definitions)', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('V4.0 Action Selector')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
  });
});
