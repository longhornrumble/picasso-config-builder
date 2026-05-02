/**
 * tenant.schema.ts scheduling cross-section invariants (sub-phase A5).
 *
 * Spec source: scheduling/docs/scheduling_config_schema.md §10. Each test
 * exercises one of the 6 invariants; baselines confirm a valid scheduling
 * config still passes.
 */

import { describe, it, expect } from 'vitest';
import { tenantConfigSchema } from '../tenant.schema';

// ============================================================================
// Helpers — minimal valid tenant config + scheduling block
// ============================================================================

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
  branding: {
    primary_color: '#00AA88',
    font_family: 'Inter',
  },
  features: {
    uploads: false,
    photo_uploads: false,
    voice_input: false,
    streaming: true,
    conversational_forms: false,
    smart_cards: false,
    callout: { enabled: false, auto_dismiss: false },
  },
  aws: {
    knowledge_base_id: 'KBABCDEFGH12',
    aws_region: 'us-east-1',
  },
  channels: undefined,
});

const validScheduling = () => ({
  workspace_domains: ['myrecruiter.ai'],
  default_locale: 'en',
  available_locales: ['en'],
  scheduling_tag_vocabulary: ['program', 'language'],
  appointment_types: {
    volunteer_intake: {
      id: 'volunteer_intake',
      name: 'Volunteer intake call',
      duration_minutes: 20,
      location_mode: 'virtual_meet' as const,
      routing_policy_id: 'volunteer_pool',
    },
  },
  routing_policies: {
    volunteer_pool: {
      id: 'volunteer_pool',
      tag_conditions: [
        { tag: 'program', operator: 'equals' as const, values: ['weekend_food_pantry'] },
      ],
    },
  },
});

// ============================================================================
// Baseline
// ============================================================================

describe('tenantConfigSchema — scheduling baseline', () => {
  it('accepts a tenant with scheduling_enabled and a fully wired scheduling block', () => {
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling: validScheduling(),
    };
    expect(() => tenantConfigSchema.parse(config)).not.toThrow();
  });

  it('accepts a tenant with no scheduling block when scheduling_enabled is absent', () => {
    expect(() => tenantConfigSchema.parse(baseTenant())).not.toThrow();
  });
});

// ============================================================================
// §10 Invariants 1–6
// ============================================================================

describe('tenantConfigSchema — scheduling invariants (§10)', () => {
  it('Invariant 1: scheduling_enabled without scheduling block is rejected', () => {
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /scheduling_enabled requires a scheduling configuration block/,
    );
  });

  it('Invariant 2: appointment_type with unknown routing_policy_id is rejected', () => {
    const scheduling = validScheduling();
    scheduling.appointment_types.volunteer_intake.routing_policy_id = 'ghost_pool';
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling,
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /references non-existent routing_policy: ghost_pool/,
    );
  });

  it('Invariant 3: routing_policy with tag outside vocabulary is rejected', () => {
    const scheduling = validScheduling();
    scheduling.routing_policies.volunteer_pool.tag_conditions = [
      { tag: 'unregistered_tag', operator: 'equals', values: ['x'] },
    ];
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling,
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /references unknown tag: unregistered_tag/,
    );
  });

  it('Invariant 4: pre_call_form_id pointing at non-existent form is rejected', () => {
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling: {
        ...validScheduling(),
        pre_call_form_id: 'missing_form',
      },
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /pre_call_form_id references non-existent form: missing_form/,
    );
  });

  it('Invariant 5: default_locale not in available_locales is rejected', () => {
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling: {
        ...validScheduling(),
        default_locale: 'es',
        available_locales: ['en'],
      },
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /default_locale.*es.*is not in available_locales/,
    );
  });

  it('Invariant 6a: scheduling CTA without scheduling_enabled is rejected', () => {
    const config = {
      ...baseTenant(),
      cta_definitions: {
        book_call: {
          label: 'Book a call',
          action: 'start_scheduling',
          type: 'scheduling_trigger',
        },
      },
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /requires feature_flags\.scheduling_enabled === true/,
    );
  });

  it('Invariant 6b: scheduling CTA with empty appointment_types is rejected', () => {
    const scheduling = validScheduling();
    scheduling.appointment_types = {};
    // Routing policy still references a tag in vocabulary, so we keep policies empty too
    scheduling.routing_policies = {};
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling,
      cta_definitions: {
        book_call: {
          label: 'Book a call',
          action: 'resume_scheduling',
          type: 'scheduling_trigger',
        },
      },
    };
    expect(() => tenantConfigSchema.parse(config)).toThrow(
      /requires non-empty scheduling\.appointment_types/,
    );
  });

  it('Invariant 6 (positive): scheduling CTA accepted when both gates satisfied', () => {
    const config = {
      ...baseTenant(),
      feature_flags: { scheduling_enabled: true },
      scheduling: validScheduling(),
      cta_definitions: {
        book_call: {
          label: 'Book a call',
          action: 'start_scheduling',
          type: 'scheduling_trigger',
        },
      },
    };
    expect(() => tenantConfigSchema.parse(config)).not.toThrow();
  });
});

// ============================================================================
// Passthrough: existing feature_flags coexist with scheduling_enabled
// ============================================================================

describe('tenantConfigSchema — feature_flags passthrough', () => {
  it('accepts unknown feature flags alongside scheduling_enabled', () => {
    const config = {
      ...baseTenant(),
      feature_flags: {
        scheduling_enabled: false,
        V4_ACTION_SELECTOR: true,
        DYNAMIC_CHIPS: true,
      },
    };
    expect(() => tenantConfigSchema.parse(config)).not.toThrow();
  });
});
