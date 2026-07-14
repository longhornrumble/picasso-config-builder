/**
 * MessengerWelcomeSettings — welcome-surfaces editors (Messenger Product Surface
 * T3d). Load-bearing assertions: adding writes the EXACT keys
 * messenger_behavior.welcome.ice_breakers / .persistent_menu; the ice-breaker
 * ≤4 cap (capability map C5) disables Add at 4; the M5 re-push honesty notice
 * is present (Config Builder does NOT push to Meta); messenger_behavior /
 * welcome are lazily created on a bare config (no crash).
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
import { MessengerWelcomeSettings } from '../MessengerWelcomeSettings';

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

describe('MessengerWelcomeSettings', () => {
  it('renders the ice breakers and persistent menu editors', () => {
    render(<MessengerWelcomeSettings />);
    expect(screen.getByText('Ice breakers')).toBeInTheDocument();
    expect(screen.getByText('Persistent menu')).toBeInTheDocument();
  });

  it('shows the truthful-state notice (surfaces push to Meta on Deploy; edits alone do not)', () => {
    render(<MessengerWelcomeSettings />);
    // Title states the push happens on Deploy.
    expect(screen.getByText(/push to Facebook & Instagram when you Deploy/)).toBeInTheDocument();
    // Body is truthful that editing alone does not update Meta.
    expect(screen.getByText(/Editing here without deploying does not update/)).toBeInTheDocument();
    // Manual fallback still referenced.
    expect(screen.getByText(/repush_welcome_surfaces\.py/)).toBeInTheDocument();
  });

  it('adding an ice breaker writes messenger_behavior.welcome.ice_breakers', async () => {
    mockBaseConfig = { messenger_behavior: { welcome: {} } };
    render(<MessengerWelcomeSettings />);

    await userEvent.type(screen.getByLabelText('Question'), 'How do I volunteer?');
    await userEvent.type(screen.getByLabelText('Payload'), 'PIC1:VOLUNTEER_INFO');
    await userEvent.click(screen.getByRole('button', { name: /Add ice breaker/ }));

    const state = applyLastUpdater({ messenger_behavior: { welcome: {} } });
    const welcome = (state.config.baseConfig.messenger_behavior as Record<string, unknown>).welcome as {
      ice_breakers?: Array<{ question: string; payload: string }>;
    };
    expect(welcome.ice_breakers).toEqual([
      { question: 'How do I volunteer?', payload: 'PIC1:VOLUNTEER_INFO' },
    ]);
    expect(state.config.isDirty).toBe(true);
  });

  it('disables Add at the 4-item ice-breaker cap (capability map C5)', () => {
    mockBaseConfig = {
      messenger_behavior: {
        welcome: {
          ice_breakers: [
            { question: 'Q1', payload: 'PIC1:A' },
            { question: 'Q2', payload: 'PIC1:B' },
            { question: 'Q3', payload: 'PIC1:C' },
            { question: 'Q4', payload: 'PIC1:D' },
          ],
        },
      },
    };
    render(<MessengerWelcomeSettings />);

    expect(screen.getByRole('button', { name: /Add ice breaker/ })).toBeDisabled();
    expect(screen.getByText(/Maximum of 4 ice breakers reached/)).toBeInTheDocument();
    expect(screen.getByText('4 / 4 ice breakers')).toBeInTheDocument();
  });

  it('removing an ice breaker updates the array', async () => {
    mockBaseConfig = {
      messenger_behavior: { welcome: { ice_breakers: [{ question: 'Q1', payload: 'PIC1:A' }] } },
    };
    render(<MessengerWelcomeSettings />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove ice breaker 1' }));

    const state = applyLastUpdater({
      messenger_behavior: { welcome: { ice_breakers: [{ question: 'Q1', payload: 'PIC1:A' }] } },
    });
    const welcome = (state.config.baseConfig.messenger_behavior as Record<string, unknown>).welcome as {
      ice_breakers?: unknown[];
    };
    expect(welcome.ice_breakers).toEqual([]);
  });

  it('adding a persistent menu item writes messenger_behavior.welcome.persistent_menu', async () => {
    mockBaseConfig = { messenger_behavior: { welcome: {} } };
    render(<MessengerWelcomeSettings />);

    await userEvent.type(screen.getByLabelText('Title'), 'Our programs');
    await userEvent.type(screen.getByLabelText('Payload (optional)'), 'PIC1:PROGRAMS');
    await userEvent.click(screen.getByRole('button', { name: /Add menu item/ }));

    const state = applyLastUpdater({ messenger_behavior: { welcome: {} } });
    const welcome = (state.config.baseConfig.messenger_behavior as Record<string, unknown>).welcome as {
      persistent_menu?: Array<{ title: string; payload?: string }>;
    };
    expect(welcome.persistent_menu).toEqual([{ title: 'Our programs', payload: 'PIC1:PROGRAMS' }]);
    expect(state.config.isDirty).toBe(true);
  });

  it('creates messenger_behavior.welcome lazily on a bare config (no crash)', async () => {
    mockBaseConfig = {}; // no messenger_behavior, no welcome
    render(<MessengerWelcomeSettings />);

    await userEvent.type(screen.getByLabelText('Question'), 'Q');
    await userEvent.type(screen.getByLabelText('Payload'), 'PIC1:X');
    await userEvent.click(screen.getByRole('button', { name: /Add ice breaker/ }));

    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as { welcome?: { ice_breakers?: unknown[] } };
    expect(mb?.welcome?.ice_breakers).toEqual([{ question: 'Q', payload: 'PIC1:X' }]);
  });
});
