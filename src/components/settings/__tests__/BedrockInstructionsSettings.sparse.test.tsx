/**
 * BedrockInstructionsSettings — sparse-shape forward compat (Schema Discipline).
 *
 * Externally-authored configs carry a sparse bedrock_instructions: the live
 * BRI071351 persona pack has formatting_preferences WITHOUT
 * max_emojis_per_response and no _version/_updated. The component crashed on
 * `.toString()` of undefined, taking down the whole AI & AWS settings page.
 * Readers must tolerate missing fields — these tests render the component
 * against the real sparse shape and assert per-field defaults fill the gaps.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let mockBaseConfig: Record<string, unknown> = {};
const mockSetState = vi.fn();

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ config: { baseConfig: mockBaseConfig, isDirty: false, markDirty: vi.fn() } })
  ),
}));

import { useConfigStore } from '@/store';
import { BedrockInstructionsSettings } from '../BedrockInstructionsSettings';

beforeEach(() => {
  vi.clearAllMocks();
  mockBaseConfig = {};
  (useConfigStore as unknown as { setState: typeof mockSetState }).setState = mockSetState;
});

describe('BedrockInstructionsSettings — sparse stored shapes', () => {
  it('renders the live BRI071351 sparse shape without crashing (missing max_emojis_per_response)', () => {
    mockBaseConfig = {
      bedrock_instructions: {
        role_instructions: 'You help visitors understand our programs.',
        formatting_preferences: {
          emoji_usage: 'none',
          response_style: 'conversational',
          detail_level: 'concise',
        },
        custom_constraints: [],
        fallback_message: 'I do not have that information.',
      },
    };

    render(<BedrockInstructionsSettings />);

    // Missing max_emojis_per_response falls back to the default (3).
    expect(screen.getByLabelText('Max Emojis Per Response')).toHaveValue(3);
    // Stored values still win where present.
    expect(screen.getByText(/I do not have that information\./)).toBeInTheDocument();
  });

  it('renders a config with bedrock_instructions missing entirely', () => {
    mockBaseConfig = {};
    render(<BedrockInstructionsSettings />);
    expect(screen.getByLabelText('Max Emojis Per Response')).toHaveValue(3);
  });

  it('renders a bare bedrock_instructions object (every sub-field missing)', () => {
    mockBaseConfig = { bedrock_instructions: {} };
    render(<BedrockInstructionsSettings />);
    expect(screen.getByLabelText('Max Emojis Per Response')).toHaveValue(3);
    // custom_constraints defaults to [] — the counter renders instead of crashing on .length
    expect(screen.getByText(/0 \/ 10 constraints/)).toBeInTheDocument();
  });
});
