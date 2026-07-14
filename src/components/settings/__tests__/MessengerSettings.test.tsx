/**
 * MessengerSettings — Messenger product page (Messenger Product Surface T2c).
 *
 * Covers the pattern this page seeds: enable toggle + config fields + readiness
 * checklist. Load-bearing assertions: the flag writes the EXACT key
 * feature_flags.MESSENGER_CHANNEL; escalation writes messenger_behavior.escalation_email;
 * readiness reflects config-authoritative state (flag + recipient) and does NOT
 * fabricate connection status.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let mockBaseConfig: Record<string, unknown> | null = {};
const mockSetState = vi.fn();

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ config: { baseConfig: mockBaseConfig, isDirty: false } })
  ),
}));

import { useConfigStore } from '@/store';
import { MessengerSettings } from '../MessengerSettings';

beforeEach(() => {
  vi.clearAllMocks();
  mockBaseConfig = {};
  (useConfigStore as unknown as { setState: typeof mockSetState }).setState = mockSetState;
});

/** Apply the last setState updater to a mutable fake state and return it. */
function applyLastUpdater(initial: Record<string, unknown>) {
  const updater = mockSetState.mock.calls.at(-1)![0] as (s: {
    config: { baseConfig: Record<string, unknown>; isDirty: boolean };
  }) => void;
  const state = { config: { baseConfig: initial, isDirty: false } };
  updater(state);
  return state;
}

describe('MessengerSettings', () => {
  it('renders the enable toggle, escalation field, and readiness section', () => {
    render(<MessengerSettings />);
    expect(screen.getByRole('checkbox', { name: /Enable the Messenger channel/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Escalation recipient email/)).toBeInTheDocument();
    expect(screen.getByText('Readiness')).toBeInTheDocument();
  });

  it('toggling enable writes the exact key feature_flags.MESSENGER_CHANNEL', async () => {
    mockBaseConfig = { feature_flags: {} };
    render(<MessengerSettings />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Enable the Messenger channel/ }));

    const state = applyLastUpdater({ feature_flags: {} as Record<string, boolean> });
    expect((state.config.baseConfig.feature_flags as Record<string, boolean>).MESSENGER_CHANNEL).toBe(true);
    expect(state.config.isDirty).toBe(true);
  });

  it('editing the escalation email writes messenger_behavior.escalation_email (whole-section mutation)', async () => {
    mockBaseConfig = { messenger_behavior: {} };
    render(<MessengerSettings />);

    await userEvent.type(screen.getByLabelText(/Escalation recipient email/), 'x');

    const state = applyLastUpdater({ messenger_behavior: {} as Record<string, unknown> });
    expect((state.config.baseConfig.messenger_behavior as Record<string, unknown>).escalation_email).toBe('x');
    expect(state.config.isDirty).toBe(true);
  });

  it('creates messenger_behavior lazily when absent (no crash on a config without the section)', async () => {
    mockBaseConfig = {}; // no messenger_behavior, no feature_flags
    render(<MessengerSettings />);

    await userEvent.type(screen.getByLabelText(/Disclosure line/), 'a');

    // Updater must create messenger_behavior.strings on a bare config.
    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as { strings?: Record<string, string> };
    expect(mb?.strings?.disclosure_line).toBe('a');
  });

  it('readiness reflects config-authoritative state (flag off + no recipient = both incomplete)', () => {
    mockBaseConfig = {};
    render(<MessengerSettings />);
    // Neither the enable checkbox nor a recipient is set → the two config-owned
    // readiness rows read "not done".
    expect(screen.getByText(/Turn on the Messenger channel above/)).toBeInTheDocument();
    expect(screen.getByText(/Set an escalation recipient above/)).toBeInTheDocument();
  });

  it('readiness reflects a fully-configured tenant (flag on + recipient set = both done)', () => {
    mockBaseConfig = {
      feature_flags: { MESSENGER_CHANNEL: true },
      messenger_behavior: { escalation_email: 'staff@example.org' },
    };
    render(<MessengerSettings />);
    expect(screen.getByText(/MESSENGER_CHANNEL is on\./)).toBeInTheDocument();
    expect(screen.getByText(/Notifications go to staff@example\.org/)).toBeInTheDocument();
  });

  it('connection readiness reads the S3 channels mirror (display-only, D1-compliant) — not connected when absent', () => {
    mockBaseConfig = { feature_flags: { MESSENGER_CHANNEL: true } };
    render(<MessengerSettings />);
    expect(screen.getByText(/No page connected yet/)).toBeInTheDocument();
    // Connection is still managed elsewhere — this page never mutates it.
    expect(screen.getByText(/Connection is managed in the Channels tab/)).toBeInTheDocument();
  });

  it('connection readiness reflects a connected page from channels.messenger (mirrors ChannelsSettings)', () => {
    mockBaseConfig = {
      feature_flags: { MESSENGER_CHANNEL: true },
      channels: { messenger: { page_id: '1', page_name: 'Acme Page', enabled: true, connected_at: '2026-07-13', connected_by: 'x' } },
    };
    render(<MessengerSettings />);
    expect(screen.getByText(/Connected: Acme Page\. Manage in the Channels tab\./)).toBeInTheDocument();
  });
});
