/**
 * CTAFormFields — scheduling action wiring (sub-phase A7).
 *
 * A7 adds start_scheduling / resume_scheduling to the Action dropdown and
 * maps them to the scheduling_trigger type. Scheduling actions are
 * metadata-driven (the scheduling config lives in the tenant `scheduling`
 * block, not on the CTA) so — unlike start_form/external_link/send_query/
 * show_info — they render NO conditional input field. These tests assert
 * that conditional-render contract. The action→type contract itself is
 * compile-checked by the exhaustive Record<CTAActionType,CTAType> and
 * covered end-to-end by cta.schema.test.ts / tenant.schema.scheduling.test.ts.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// useConfigStore selectors used by CTAFormFields: forms/branches/programs lists.
vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      forms: { getAllForms: () => [] },
      branches: { getAllBranches: () => [] },
      programs: { getAllPrograms: () => [] },
    })
  ),
}));

import { CTAFormFields } from '../CTAFormFields';
import type { CTAEntity } from '../types';
import type { CTAActionType, CTAType } from '@/types/config';

function renderField(action: CTAActionType, type: CTAType) {
  const value: CTAEntity = { ctaId: 'cta_1', label: 'Book a call', action, type };
  return render(
    <CTAFormFields
      value={value}
      onChange={vi.fn()}
      errors={{}}
      touched={{}}
      onBlur={vi.fn()}
      isEditMode={false}
    />
  );
}

// Anchors that uniquely identify each non-scheduling action's conditional field.
const URL_PLACEHOLDER = 'https://example.com';
const QUERY_PLACEHOLDER = /Enter the query to send to Bedrock/;
const MESSAGE_PLACEHOLDER = /Enter information to display/;

describe('CTAFormFields — scheduling actions render no conditional field', () => {
  it.each([
    ['start_scheduling'],
    ['resume_scheduling'],
  ] as const)('%s: no Form/URL/Query/Message conditional input', (action) => {
    renderField(action, 'scheduling_trigger');

    // Core selects always present.
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();

    // None of the other actions' conditional fields appear.
    expect(screen.queryByText('Form')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(URL_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(QUERY_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(MESSAGE_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it('contrast — start_form DOES render its Form conditional field', () => {
    // Proves the absence assertions above are meaningful, not vacuous.
    renderField('start_form', 'form_trigger');
    expect(screen.getByText('Form')).toBeInTheDocument();
  });

  it('contrast — external_link DOES render its URL conditional field', () => {
    renderField('external_link', 'external_link');
    expect(screen.getByPlaceholderText(URL_PLACEHOLDER)).toBeInTheDocument();
  });
});
