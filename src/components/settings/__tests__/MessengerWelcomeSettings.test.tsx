/**
 * MessengerWelcomeSettings — welcome-surfaces editors (Messenger Product Surface
 * T3d + the dynamic CTA-dropdown follow-up). Load-bearing assertions: the payload
 * fields are CTA dropdowns whose options come LIVE from cta_definitions and whose
 * value is the exact `PIC1:cta:{id}` the Messenger processor resolves; adding
 * writes messenger_behavior.welcome.ice_breakers / .persistent_menu; the ≤4 cap
 * disables Add; the deploy-push notice is present; a stale payload is preserved.
 *
 * The `@/components/ui` Select is Radix-backed and awkward to drive in jsdom, so
 * it is mocked to a native <select> here — the value/onValueChange/options
 * contract is identical, and the mapping (value === PIC1:cta:{id}) is what we
 * actually care about.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let mockBaseConfig: Record<string, unknown> | null = {};
let mockCtas: Record<string, { label?: string; action?: string }> = {};
const mockSetState = vi.fn();

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ config: { baseConfig: mockBaseConfig, isDirty: false }, ctas: { ctas: mockCtas } })
  ),
}));

// Native-<select> stand-in for the Radix Select (same value/onValueChange/options API).
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Select: ({
      label,
      placeholder,
      options,
      value,
      onValueChange,
      disabled,
    }: {
      label?: string;
      placeholder?: string;
      options: Array<{ value: string; label: string }>;
      value?: string;
      onValueChange?: (v: string) => void;
      disabled?: boolean;
    }) => (
      <select
        aria-label={label || placeholder}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

import { useConfigStore } from '@/store';
import { MessengerWelcomeSettings } from '../MessengerWelcomeSettings';

beforeEach(() => {
  vi.clearAllMocks();
  mockBaseConfig = {};
  mockCtas = {
    volunteer: { label: 'Volunteer info', action: 'send_query' },
    donate: { label: 'Donate', action: 'external_link' },
  };
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

  it('CTA dropdown options come LIVE from cta_definitions (dynamic)', () => {
    render(<MessengerWelcomeSettings />);
    // Both configured CTAs render as options, labelled with their id.
    expect(screen.getAllByRole('option', { name: /Volunteer info — volunteer/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('option', { name: /Donate — donate/ }).length).toBeGreaterThan(0);
  });

  it('adding an ice breaker stores the exact PIC1:cta:{id} payload from the selected CTA', async () => {
    render(<MessengerWelcomeSettings />);
    await userEvent.type(screen.getByLabelText('Question'), 'How do I volunteer?');
    await userEvent.selectOptions(screen.getByLabelText('Linked CTA'), 'PIC1:cta:volunteer');
    await userEvent.click(screen.getByRole('button', { name: /Add ice breaker/ }));

    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as {
      welcome?: { ice_breakers?: Array<{ question: string; payload: string }> };
    };
    expect(mb.welcome?.ice_breakers).toEqual([
      { question: 'How do I volunteer?', payload: 'PIC1:cta:volunteer' },
    ]);
  });

  it('disables Add ice breaker at the ≤4 cap (Meta platform limit)', () => {
    mockBaseConfig = {
      messenger_behavior: {
        welcome: {
          ice_breakers: [
            { question: 'Q1', payload: 'PIC1:cta:volunteer' },
            { question: 'Q2', payload: 'PIC1:cta:donate' },
            { question: 'Q3', payload: 'PIC1:cta:volunteer' },
            { question: 'Q4', payload: 'PIC1:cta:donate' },
          ],
        },
      },
    };
    render(<MessengerWelcomeSettings />);
    expect(screen.getByRole('button', { name: /Add ice breaker/ })).toBeDisabled();
    expect(screen.getByText(/Maximum of 4 ice breakers reached/)).toBeInTheDocument();
  });

  it('removing an ice breaker writes the filtered list', async () => {
    mockBaseConfig = {
      messenger_behavior: { welcome: { ice_breakers: [{ question: 'Q1', payload: 'PIC1:cta:volunteer' }] } },
    };
    render(<MessengerWelcomeSettings />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove ice breaker 1' }));

    const state = applyLastUpdater({
      messenger_behavior: { welcome: { ice_breakers: [{ question: 'Q1', payload: 'PIC1:cta:volunteer' }] } },
    });
    const mb = state.config.baseConfig.messenger_behavior as { welcome?: { ice_breakers?: unknown[] } };
    expect(mb.welcome?.ice_breakers).toEqual([]);
  });

  it('adding a persistent-menu item links a CTA (PIC1:cta:{id})', async () => {
    render(<MessengerWelcomeSettings />);
    await userEvent.type(screen.getByLabelText('Title'), 'Our programs');
    await userEvent.selectOptions(screen.getByLabelText('Linked CTA (optional)'), 'PIC1:cta:donate');
    await userEvent.click(screen.getByRole('button', { name: /Add menu item/ }));

    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as {
      welcome?: { persistent_menu?: Array<{ title: string; payload?: string }> };
    };
    expect(mb.welcome?.persistent_menu).toEqual([{ title: 'Our programs', payload: 'PIC1:cta:donate' }]);
  });

  it('a menu item can use a URL instead of a CTA', async () => {
    render(<MessengerWelcomeSettings />);
    await userEvent.type(screen.getByLabelText('Title'), 'Website');
    await userEvent.type(screen.getByLabelText('URL (optional)'), 'https://example.org');
    await userEvent.click(screen.getByRole('button', { name: /Add menu item/ }));

    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as {
      welcome?: { persistent_menu?: Array<{ title: string; url?: string }> };
    };
    expect(mb.welcome?.persistent_menu).toEqual([{ title: 'Website', url: 'https://example.org' }]);
  });

  it('lazily creates messenger_behavior.welcome on a bare config (no crash)', async () => {
    mockBaseConfig = {}; // no messenger_behavior
    render(<MessengerWelcomeSettings />);
    await userEvent.type(screen.getByLabelText('Question'), 'Q');
    await userEvent.selectOptions(screen.getByLabelText('Linked CTA'), 'PIC1:cta:volunteer');
    await userEvent.click(screen.getByRole('button', { name: /Add ice breaker/ }));

    const state = applyLastUpdater({});
    const mb = state.config.baseConfig.messenger_behavior as { welcome?: { ice_breakers?: unknown[] } };
    expect(mb?.welcome?.ice_breakers).toEqual([{ question: 'Q', payload: 'PIC1:cta:volunteer' }]);
  });

  it('shows a hint and disables Add when no CTAs are defined yet', () => {
    mockCtas = {};
    render(<MessengerWelcomeSettings />);
    expect(screen.getByText(/No CTAs defined yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add ice breaker/ })).toBeDisabled();
  });

  it('preserves a saved payload that no longer matches a CTA (does not silently blank it)', () => {
    mockBaseConfig = {
      messenger_behavior: {
        welcome: { ice_breakers: [{ question: 'Old', payload: 'PIC1:cta:deleted_cta' }] },
      },
    };
    render(<MessengerWelcomeSettings />);
    // The stale payload survives as a distinctly-labelled option.
    expect(
      screen.getAllByRole('option', { name: /PIC1:cta:deleted_cta — not a current CTA/ }).length
    ).toBeGreaterThan(0);
  });

  it('shows the truthful-state notice (surfaces push to Meta on Deploy; edits alone do not)', () => {
    render(<MessengerWelcomeSettings />);
    expect(screen.getByText(/push to Facebook & Instagram when you Deploy/)).toBeInTheDocument();
    expect(screen.getByText(/Editing here without deploying does not update/)).toBeInTheDocument();
    expect(screen.getByText(/repush_welcome_surfaces\.py/)).toBeInTheDocument();
  });
});
