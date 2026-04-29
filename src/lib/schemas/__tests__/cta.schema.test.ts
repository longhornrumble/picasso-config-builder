/**
 * cta.schema.ts tests — focused on scheduling action/type extensions (sub-phase A4).
 *
 * Spec source: scheduling/docs/scheduling_config_schema.md §3.
 * Cross-config invariants (scheduling_enabled + non-empty appointment_types) live
 * in tenant.schema.ts and are covered separately in sub-phase A5.
 */

import { describe, it, expect } from 'vitest';
import { ctaDefinitionSchema } from '../cta.schema';

const baseCta = {
  label: 'Schedule a call',
};

describe('ctaDefinitionSchema — scheduling actions (A4)', () => {
  it('accepts start_scheduling paired with scheduling_trigger', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        ...baseCta,
        action: 'start_scheduling',
        type: 'scheduling_trigger',
      }),
    ).not.toThrow();
  });

  it('accepts resume_scheduling paired with scheduling_trigger', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        ...baseCta,
        label: 'Resume your booking',
        action: 'resume_scheduling',
        type: 'scheduling_trigger',
      }),
    ).not.toThrow();
  });

  it('rejects start_scheduling paired with a non-scheduling type', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        ...baseCta,
        action: 'start_scheduling',
        type: 'form_trigger',
      }),
    ).toThrow(/does not match action.*start_scheduling/);
  });

  it('rejects scheduling_trigger paired with a non-scheduling action', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        ...baseCta,
        action: 'start_form',
        type: 'scheduling_trigger',
        formId: 'volunteer_apply',
      }),
    ).toThrow(/does not match action.*start_form/);
  });

  it('does not require formId / url / query / prompt for scheduling actions', () => {
    const parsed = ctaDefinitionSchema.parse({
      ...baseCta,
      action: 'start_scheduling',
      type: 'scheduling_trigger',
    });
    expect(parsed.formId).toBeUndefined();
    expect(parsed.url).toBeUndefined();
    expect(parsed.query).toBeUndefined();
    expect(parsed.prompt).toBeUndefined();
  });

  it('still rejects unknown action values', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        ...baseCta,
        action: 'totally_unknown',
        type: 'scheduling_trigger',
      }),
    ).toThrow(/Invalid action type/);
  });
});

describe('ctaDefinitionSchema — pre-existing actions remain valid', () => {
  it('still accepts start_form + form_trigger with formId', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        label: 'Apply Now',
        action: 'start_form',
        type: 'form_trigger',
        formId: 'volunteer_apply',
      }),
    ).not.toThrow();
  });

  it('still accepts external_link + external_link with url', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        label: 'Visit Site',
        action: 'external_link',
        type: 'external_link',
        url: 'https://example.com',
      }),
    ).not.toThrow();
  });

  it('still accepts send_query + bedrock_query with query', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        label: 'Tell me more',
        action: 'send_query',
        type: 'bedrock_query',
        query: 'Tell me about your programs',
      }),
    ).not.toThrow();
  });

  it('still accepts show_info + info_request with prompt', () => {
    expect(() =>
      ctaDefinitionSchema.parse({
        label: 'Learn More',
        action: 'show_info',
        type: 'info_request',
        prompt: 'Show information about volunteering',
      }),
    ).not.toThrow();
  });
});
