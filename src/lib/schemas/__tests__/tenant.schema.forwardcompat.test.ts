/**
 * tenant.schema.ts / cta.schema.ts forward-compatibility regression guards.
 *
 * These lock in the schema-discipline fixes that make the live test tenant
 * MYR384719 parse (impl plan scheduling sub-phase A §3 exit criterion 3;
 * audit Row 3/Row 5). Each test pins BOTH the loosened acceptance AND the
 * regression direction (so a future "tidy-up" that re-tightens the rule turns
 * this suite red instead of silently re-breaking real prod configs).
 *
 * Real shape verified live against s3://myrecruiter-picasso/tenants/MYR384719/
 * MYR384719-config.json on 2026-05-19.
 */

import { describe, it, expect } from 'vitest';
import { tenantConfigSchema } from '../tenant.schema';
import { ctaDefinitionSchema } from '../cta.schema';

const baseTenant = () => ({
  tenant_id: 'TEST123',
  tenant_hash: 'abc123def456',
  subscription_tier: 'Standard' as const,
  chat_title: 'Test Bot',
  tone_prompt: 'You are a helpful assistant.',
  welcome_message: 'Hello!',
  version: '1.5',
  generated_at: 1700000000,
  conversational_forms: {},
  cta_definitions: {},
  conversation_branches: {},
  branding: { primary_color: '#00AA88', font_family: 'Inter' },
  features: {
    uploads: false,
    photo_uploads: false,
    voice_input: false,
    streaming: true,
    conversational_forms: false,
    smart_cards: false,
    callout: { enabled: false, auto_dismiss: false },
  },
  aws: { knowledge_base_id: 'KBABCDEFGH12', aws_region: 'us-east-1' },
  channels: undefined,
});

const chip = (label = 'Learn more') => ({
  label,
  action: 'send_query' as const,
  value: 'Tell me more.',
});

describe('tenant.schema forward-compat: action_chips.default_chips is a record', () => {
  it('accepts a dict-shaped default_chips (real v1.4.1 runtime format)', () => {
    const cfg = {
      ...baseTenant(),
      action_chips: {
        enabled: true,
        max_display: 4,
        show_on_welcome: true,
        default_chips: { a: chip(), b: chip('Contact') },
      },
    };
    expect(tenantConfigSchema.safeParse(cfg).success).toBe(true);
  });

  it('REJECTS an array-shaped default_chips (regression guard vs z.array revert)', () => {
    const cfg = {
      ...baseTenant(),
      action_chips: {
        enabled: true,
        max_display: 4,
        show_on_welcome: true,
        default_chips: [chip(), chip('Contact')],
      },
    };
    expect(tenantConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('enforces the 8-chip cap via .refine', () => {
    const many = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [`c${i}`, chip(`Chip ${i}`)]),
    );
    const cfg = {
      ...baseTenant(),
      action_chips: { enabled: true, max_display: 4, show_on_welcome: true, default_chips: many },
    };
    const r = tenantConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Maximum 8 default chips')).toBe(true);
    }
  });
});

describe('tenant.schema forward-compat: loosened bounds for real prod configs', () => {
  it('accepts an empty tone_prompt (V4 tenants put tone in bedrock_instructions)', () => {
    expect(tenantConfigSchema.safeParse({ ...baseTenant(), tone_prompt: '' }).success).toBe(true);
  });

  it('still rejects tone_prompt over 2000 chars (upper bound preserved)', () => {
    const cfg = { ...baseTenant(), tone_prompt: 'x'.repeat(2001) };
    expect(tenantConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('accepts a features object missing conversational_forms / smart_cards keys', () => {
    const cfg = {
      ...baseTenant(),
      features: {
        uploads: false,
        photo_uploads: false,
        voice_input: false,
        streaming: true,
        callout: { enabled: false, auto_dismiss: false },
      },
    };
    expect(tenantConfigSchema.safeParse(cfg).success).toBe(true);
  });

  it('accepts action_chips without short_text_threshold; max_display up to 8, not 9', () => {
    const ac = (max_display: number, withThreshold: boolean) => ({
      ...baseTenant(),
      action_chips: {
        enabled: true,
        max_display,
        show_on_welcome: true,
        ...(withThreshold ? { short_text_threshold: 20 } : {}),
        default_chips: { a: chip() },
      },
    });
    expect(tenantConfigSchema.safeParse(ac(8, false)).success).toBe(true);
    expect(tenantConfigSchema.safeParse(ac(8, true)).success).toBe(true);
    expect(tenantConfigSchema.safeParse(ac(9, false)).success).toBe(false);
  });

  it('accepts a 50-char chip label, rejects 51 (bound moved 30 -> 50)', () => {
    const withLabel = (n: number) => ({
      ...baseTenant(),
      action_chips: {
        enabled: true,
        max_display: 4,
        show_on_welcome: true,
        default_chips: { a: chip('x'.repeat(n)) },
      },
    });
    expect(tenantConfigSchema.safeParse(withLabel(50)).success).toBe(true);
    expect(tenantConfigSchema.safeParse(withLabel(51)).success).toBe(false);
  });
});

describe('tenant.schema forward-compat: program ref-join handles unknown form.program (audit R11 pin)', () => {
  // Audit R11 lock-in. Today programSchema REQUIRES program_id, so
  // `undefined` can't reach the superRefine join. The R11 risk is forward-
  // compat: if program_id becomes optional later, the join code at
  // tenant.schema.ts:319-321 must NOT add `undefined` into the set (it would
  // silently match form.program === undefined). The guard `if
  // (program.program_id) validProgramRefs.add(...)` makes that explicit; this
  // test pins the cross-form join semantics so a regression that combines a
  // programSchema loosening with a removed guard becomes visible.
  it('rejects form.program that matches neither key nor any program_id (single-program shape)', () => {
    const cfg = {
      ...baseTenant(),
      programs: {
        love_box_application: {
          program_id: 'love_box_request',
          program_name: 'Love Box Application',
        },
      },
      conversational_forms: {
        broken_ref: {
          enabled: true,
          form_id: 'broken_ref',
          program: 'something_that_doesnt_exist',
          title: 'Broken',
          description: 'no match',
          fields: [
            {
              id: 'q',
              type: 'text' as const,
              label: 'Q',
              prompt: 'Q?',
              required: true,
            },
          ],
        },
      },
    };
    const r = tenantConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) =>
            i.path.join('.') === 'conversational_forms.broken_ref.program' &&
            i.code === 'custom',
        ),
      ).toBe(true);
    }
  });
});

describe('cta.schema forward-compat: query allowed on non-send_query CTAs', () => {
  it('accepts an external_link CTA that also carries a human-readable query', () => {
    const r = ctaDefinitionSchema.safeParse({
      label: 'Contact us',
      action: 'external_link',
      type: 'external_link',
      url: 'https://example.com/contact',
      query: 'How do I contact you?',
    });
    expect(r.success).toBe(true);
  });
});

describe('tenant.schema forward-compat: form->program join accepts key OR .program_id (matches FormCardContent.tsx:18)', () => {
  // Real AUS123957 shape: programs object keyed by something other than the
  // program_id field (e.g. key="love_box_application", program_id="love_box_request",
  // and key="request_daretodream", program_id="daretodream_request"). Forms reference
  // either form. Schema must match pcb's actual display lookup at
  // FormCardContent.tsx:18 (key first, .program_id fallback).
  const cfgWithFormRef = (formProgramRef: string) => ({
    ...baseTenant(),
    programs: {
      love_box_application: {
        program_id: 'love_box_request',
        program_name: 'Love Box Application',
      },
      request_daretodream: {
        program_id: 'daretodream_request',
        program_name: 'Dare to Dream Request',
      },
    },
    conversational_forms: {
      love_box_referral: {
        enabled: true,
        form_id: 'love_box_referral',
        program: formProgramRef,
        title: 'Love Box Referral',
        description: 'Refer a family for a Love Box.',
        fields: [
          {
            id: 'family_name',
            type: 'text' as const,
            label: 'Family name',
            prompt: 'What is the family name?',
            required: true,
          },
        ],
      },
    },
  });

  it('accepts form.program matching a program.program_id (key !== program_id)', () => {
    expect(tenantConfigSchema.safeParse(cfgWithFormRef('love_box_request')).success).toBe(true);
  });

  it('accepts form.program matching only the object key (real AUS dare2dream_referral shape)', () => {
    expect(tenantConfigSchema.safeParse(cfgWithFormRef('request_daretodream')).success).toBe(true);
  });

  it('REJECTS form.program matching neither key nor any program_id', () => {
    const r = tenantConfigSchema.safeParse(cfgWithFormRef('nonexistent_program'));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) =>
            i.path.join('.') === 'conversational_forms.love_box_referral.program' &&
            i.code === 'custom',
        ),
      ).toBe(true);
    }
  });
});
