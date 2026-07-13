/**
 * Contract fixtures for the additive `messenger_behavior` section (M0, contract C2 —
 * Lambdas/lambda/docs/messenger/CONTRACTS.md).
 *
 * Schema Discipline (CLAUDE.md): old-shape configs — every config written before
 * this section existed — must not crash any reader. Readers use optional access
 * with defaults, never bracket access.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { TenantConfig, MessengerBehaviorConfig } from '../config';
import { messengerBehaviorSchema } from '../../lib/schemas/tenant.schema';

/** The reader pattern the processor/UI will use — exercised against both shapes. */
function readMessengerBehavior(config: TenantConfig) {
  return {
    gated: config.feature_flags?.MESSENGER_CHANNEL === true,
    disclosure: config.messenger_behavior?.strings?.disclosure_line ?? 'default-disclosure',
    tone: config.messenger_behavior?.tone_override ?? config.tone_prompt,
    igModel:
      config.messenger_behavior?.channel_overrides?.instagram?.model_id ??
      config.messenger_behavior?.model_id ??
      config.model_id,
    iceBreakers: config.messenger_behavior?.welcome?.ice_breakers ?? [],
  };
}

const oldShape = {
  tenant_id: 'TEST_OLD',
  tenant_hash: 'abc123',
  subscription_tier: 'Standard',
  chat_title: 'Old Tenant',
  tone_prompt: 'You are a helpful assistant.',
  welcome_message: 'Hi!',
  version: '1.0',
  generated_at: 0,
  conversational_forms: {},
  cta_definitions: {},
  conversation_branches: {},
  branding: {},
  features: {},
  aws: { knowledge_base_id: 'KB', aws_region: 'us-east-1' },
} as unknown as TenantConfig;

describe('messenger_behavior — old-shape configs (section absent)', () => {
  it('reader returns defaults without crashing', () => {
    const result = readMessengerBehavior(oldShape);
    expect(result.gated).toBe(false);
    expect(result.disclosure).toBe('default-disclosure');
    expect(result.tone).toBe('You are a helpful assistant.');
    expect(result.iceBreakers).toEqual([]);
  });

  it('flag absent from feature_flags reads as not gated', () => {
    const withFlags = { ...oldShape, feature_flags: { V5_SINGLE_PASS: true } } as TenantConfig;
    expect(readMessengerBehavior(withFlags).gated).toBe(false);
  });

  it('real mock-s3 configs (pre-messenger_behavior wire shapes) pass the reader', () => {
    for (const file of ['TEST001-config.json', 'TEST002-config.json']) {
      const raw = fs.readFileSync(path.join(process.cwd(), 'mock-s3', file), 'utf-8');
      const config = JSON.parse(raw) as TenantConfig;
      expect(config.messenger_behavior).toBeUndefined();
      expect(() => readMessengerBehavior(config)).not.toThrow();
    }
  });
});

describe('messenger_behavior — new-shape configs (C2 section present)', () => {
  // Parsed from a JSON string: proves the wire format, not just object literals.
  const newShape = JSON.parse(
    JSON.stringify({
      ...oldShape,
      feature_flags: { MESSENGER_CHANNEL: true },
      messenger_behavior: {
        tone_override: 'You are the Messenger assistant.',
        model_id: 'model-a',
        max_history_turns: 3,
        strings: {
          disclosure_line: "I'm the Org assistant.",
          unsupported_input_fallback: 'I can only read text right now.',
          future_additive_string: 'tolerated', // index-signature additive key
        },
        welcome: {
          ice_breakers: [{ question: 'How do I volunteer?', payload: 'PIC1:cta:volunteer' }],
        },
        channel_overrides: {
          instagram: { model_id: 'model-ig' },
        },
      } satisfies MessengerBehaviorConfig,
    })
  ) as TenantConfig;

  it('reader picks up configured values and per-channel precedence', () => {
    const result = readMessengerBehavior(newShape);
    expect(result.gated).toBe(true);
    expect(result.disclosure).toBe("I'm the Org assistant.");
    expect(result.tone).toBe('You are the Messenger assistant.');
    expect(result.igModel).toBe('model-ig'); // channel override beats section model_id
    expect(result.iceBreakers).toHaveLength(1);
  });

  it('partial section: missing subtrees fall through to defaults', () => {
    const partial = {
      ...newShape,
      messenger_behavior: { model_id: 'model-a' },
    } as TenantConfig;
    const result = readMessengerBehavior(partial);
    expect(result.disclosure).toBe('default-disclosure');
    expect(result.igModel).toBe('model-a'); // no channel override → section model_id
  });

  it('full C2 surface compiles and reads: messenger override, history window, menu, remaining strings', () => {
    const full = {
      ...newShape,
      messenger_behavior: {
        max_history_turns: 8,
        strings: {
          escalation_confirmation: 'Connecting you with a person…',
          rate_limited: 'One moment please.',
          form_summary_intro: 'Here is what I have:',
        },
        welcome: {
          persistent_menu: [
            { title: 'Volunteer', payload: 'PIC1:cta:volunteer' },
            { title: 'Our site', url: 'https://example.org' },
          ],
        },
        channel_overrides: {
          messenger: { tone_override: 'FB-specific tone', strings: { disclosure_line: 'FB disclosure' } },
        },
      } satisfies MessengerBehaviorConfig,
    } as TenantConfig;
    expect(full.messenger_behavior?.max_history_turns ?? 5).toBe(8);
    expect(full.messenger_behavior?.welcome?.persistent_menu).toHaveLength(2);
    expect(
      full.messenger_behavior?.channel_overrides?.messenger?.strings?.disclosure_line ??
        full.messenger_behavior?.strings?.disclosure_line
    ).toBe('FB disclosure');
    expect(full.messenger_behavior?.strings?.rate_limited).toBe('One moment please.');
  });
});

describe('messengerBehaviorSchema (Zod mirror of C2)', () => {
  it('accepts the full new-shape section', () => {
    const result = messengerBehaviorSchema.safeParse({
      tone_override: 'Messenger tone',
      max_history_turns: 5,
      strings: { disclosure_line: 'hi', some_future_string: 'ok' },
      welcome: { ice_breakers: [{ question: 'Q?', payload: 'PIC1:cta:x' }] },
      channel_overrides: { instagram: { model_id: 'm' } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects >4 ice breakers (capability map C5)', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ question: `Q${i}?`, payload: `PIC1:cta:${i}` }));
    const result = messengerBehaviorSchema.safeParse({ welcome: { ice_breakers: five } });
    expect(result.success).toBe(false);
  });

  it('tenant configs without the section remain valid (optional at TenantConfig level)', () => {
    expect(messengerBehaviorSchema.optional().safeParse(undefined).success).toBe(true);
  });
});
