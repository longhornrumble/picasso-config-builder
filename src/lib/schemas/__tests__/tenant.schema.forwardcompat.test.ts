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
