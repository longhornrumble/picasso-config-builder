/**
 * FeatureFlagsSettings — scheduling_enabled flag (sub-phase A7).
 *
 * A7 adds a `scheduling_enabled` entry to FLAG_DEFINITIONS so operators can
 * toggle the v1 scheduling block from the Pipeline Feature Flags panel.
 * These tests assert the new flag renders, reflects config state, and that
 * toggling it writes feature_flags.scheduling_enabled through the store.
 * The plain <input type="checkbox"> (no Radix) keeps these non-brittle.
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

describe('FeatureFlagsSettings — scheduling_enabled flag', () => {
  it('renders the Scheduling flag with its description', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(
      screen.getByText(/required for start_scheduling\/resume_scheduling CTAs/)
    ).toBeInTheDocument();
  });

  it('does not regress the existing V4.0 Action Selector flag', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByText('V4.0 Action Selector')).toBeInTheDocument();
  });

  it('checkbox is unchecked when feature_flags is absent', () => {
    render(<FeatureFlagsSettings />);
    expect(screen.getByLabelText('Scheduling')).not.toBeChecked();
  });

  it('checkbox is checked when feature_flags.scheduling_enabled is true', () => {
    mockBaseConfig = { feature_flags: { scheduling_enabled: true } };
    render(<FeatureFlagsSettings />);
    expect(screen.getByLabelText('Scheduling')).toBeChecked();
  });

  it('toggling on writes feature_flags.scheduling_enabled = true through the store', async () => {
    const user = userEvent.setup();
    render(<FeatureFlagsSettings />);

    await user.click(screen.getByLabelText('Scheduling'));

    expect(mockSetState).toHaveBeenCalledTimes(1);

    // Run the captured Immer-style updater against a draft to assert its effect.
    const updater = mockSetState.mock.calls[0][0] as (s: unknown) => void;
    const draft = { config: { baseConfig: {} as Record<string, unknown>, isDirty: false } };
    updater(draft);

    expect(draft.config.baseConfig).toEqual({
      feature_flags: { scheduling_enabled: true },
    });
    expect(draft.config.isDirty).toBe(true);
  });
});
