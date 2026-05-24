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

describe('ctaDefinitionSchema — selection_metadata (CF1)', () => {
  it('round-trips a CTA with selection_metadata.topic_tags and role_axis populated', () => {
    const input = {
      label: 'Learn about volunteering',
      action: 'show_info',
      type: 'info_request',
      prompt: 'Tell me about volunteering opportunities',
      ai_available: true,
      selection_metadata: {
        topic_tags: ['volunteer', 'get_involved'],
        depth_level: 'info' as const,
        role_axis: 'give' as const,
        core_learning: true,
        priority: 30,
      },
    };
    const parsed = ctaDefinitionSchema.parse(input);
    expect(parsed.selection_metadata?.topic_tags).toEqual(['volunteer', 'get_involved']);
    expect(parsed.selection_metadata?.role_axis).toBe('give');
    expect(parsed.selection_metadata?.depth_level).toBe('info');
    expect(parsed.selection_metadata?.core_learning).toBe(true);
    expect(parsed.selection_metadata?.priority).toBe(30);
  });

  it('accepts a CTA without selection_metadata (field is optional)', () => {
    const parsed = ctaDefinitionSchema.parse({
      label: 'Apply Now',
      action: 'start_form',
      type: 'form_trigger',
      formId: 'volunteer_apply',
    });
    expect(parsed.selection_metadata).toBeUndefined();
  });
});

describe('ctaDefinitionSchema — warning branches for mis-wired fields (audit B8)', () => {
  // Audit memory: project_scheduling_subphase_a_phase_completion_audit_2026-05-24
  // B8 specifically calls out start_scheduling + formId as a silent-pass case
  // existing tests didn't cover. The cta.schema superRefine warning block at
  // lines 122-148 was completely uncovered (65% file coverage).

  it('flags formId on start_scheduling (B8: scheduling CTA accidentally carrying formId)', () => {
    const r = ctaDefinitionSchema.safeParse({
      label: 'Schedule',
      action: 'start_scheduling',
      type: 'scheduling_trigger',
      formId: 'leftover_form_ref',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) =>
            i.path.join('.') === 'formId' &&
            i.message === 'Form ID is only used when action is "start_form"',
        ),
      ).toBe(true);
    }
  });

  it('flags url on start_scheduling', () => {
    const r = ctaDefinitionSchema.safeParse({
      label: 'Schedule',
      action: 'start_scheduling',
      type: 'scheduling_trigger',
      url: 'https://example.com/leftover',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) => i.path.join('.') === 'url' && i.message?.includes('external_link'),
        ),
      ).toBe(true);
    }
  });

  it('flags prompt on start_scheduling (and on any non-show_info action)', () => {
    const r = ctaDefinitionSchema.safeParse({
      label: 'Schedule',
      action: 'start_scheduling',
      type: 'scheduling_trigger',
      prompt: 'leftover prompt copy',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) => i.path.join('.') === 'prompt' && i.message?.includes('show_info'),
        ),
      ).toBe(true);
    }
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
