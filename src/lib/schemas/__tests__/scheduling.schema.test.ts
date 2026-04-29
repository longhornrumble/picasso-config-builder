/**
 * scheduling.schema.ts tests
 *
 * Verifies the v1 scheduling config Zod schemas accept valid configs and
 * reject invalid ones. Spec source: scheduling/docs/scheduling_config_schema.md.
 */

import { describe, it, expect } from 'vitest';
import {
  schedulingConfigSchema,
  appointmentTypeSchema,
  routingPolicySchema,
  reminderCadenceSchema,
} from '../scheduling.schema';

// ============================================================================
// Sample fixtures
// ============================================================================

const validAppointmentType = {
  id: 'volunteer_intake',
  name: 'Volunteer intake call',
  duration_minutes: 20,
  location_mode: 'virtual_meet' as const,
  routing_policy_id: 'volunteer_pool',
};

const validRoutingPolicy = {
  id: 'volunteer_pool',
  tag_conditions: [
    { tag: 'program', operator: 'equals' as const, values: ['weekend_food_pantry'] },
  ],
};

const validSchedulingConfig = {
  workspace_domains: ['myrecruiter.ai'],
  scheduling_tag_vocabulary: ['program', 'language'],
  appointment_types: { volunteer_intake: validAppointmentType },
  routing_policies: { volunteer_pool: validRoutingPolicy },
};

// ============================================================================
// schedulingConfigSchema
// ============================================================================

describe('schedulingConfigSchema', () => {
  it('accepts a valid v1 config with required fields and defaults', () => {
    const parsed = schedulingConfigSchema.parse(validSchedulingConfig);
    expect(parsed.workspace_domains).toEqual(['myrecruiter.ai']);
    expect(parsed.default_locale).toBe('en'); // default applied
    expect(parsed.available_locales).toEqual(['en']); // default applied
    expect(parsed.scheduling_tag_vocabulary).toEqual(['program', 'language']);
  });

  it('rejects empty workspace_domains', () => {
    expect(() =>
      schedulingConfigSchema.parse({ ...validSchedulingConfig, workspace_domains: [] }),
    ).toThrow(/At least one workspace domain/);
  });

  it('rejects malformed default_locale (must be BCP-47)', () => {
    expect(() =>
      schedulingConfigSchema.parse({ ...validSchedulingConfig, default_locale: 'english' }),
    ).toThrow(/BCP-47/);
  });

  it('accepts BCP-47 locale variants', () => {
    expect(() =>
      schedulingConfigSchema.parse({ ...validSchedulingConfig, default_locale: 'en-US' }),
    ).not.toThrow();
    expect(() =>
      schedulingConfigSchema.parse({ ...validSchedulingConfig, default_locale: 'es' }),
    ).not.toThrow();
  });

  it('rejects when available_locales is empty', () => {
    expect(() =>
      schedulingConfigSchema.parse({ ...validSchedulingConfig, available_locales: [] }),
    ).toThrow();
  });

  it('rejects invalid fallback_scheduler_url', () => {
    expect(() =>
      schedulingConfigSchema.parse({
        ...validSchedulingConfig,
        fallback_scheduler_url: 'not a url',
      }),
    ).toThrow(/valid URL/);
  });
});

// ============================================================================
// appointmentTypeSchema
// ============================================================================

describe('appointmentTypeSchema', () => {
  it('accepts a minimal valid appointment type and applies defaults', () => {
    const parsed = appointmentTypeSchema.parse(validAppointmentType);
    expect(parsed.buffer_before_minutes).toBe(0);
    expect(parsed.buffer_after_minutes).toBe(0);
    expect(parsed.lead_time_minutes).toBe(0);
    expect(parsed.max_advance_days).toBe(30);
    expect(parsed.slot_granularity_minutes).toBe(30);
    expect(parsed.required_fields).toEqual(['name', 'email']);
    expect(parsed.cancellation_window_hours).toBe(0);
    expect(parsed.format).toBe('one_to_one');
  });

  it('rejects duration_minutes > 480 (8 hour cap)', () => {
    expect(() =>
      appointmentTypeSchema.parse({ ...validAppointmentType, duration_minutes: 481 }),
    ).toThrow();
  });

  it('rejects unsupported slot_granularity_minutes', () => {
    expect(() =>
      appointmentTypeSchema.parse({ ...validAppointmentType, slot_granularity_minutes: 45 }),
    ).toThrow();
  });

  it('rejects v2 format values (group, panel) in v1', () => {
    expect(() =>
      appointmentTypeSchema.parse({ ...validAppointmentType, format: 'group' }),
    ).toThrow();
  });

  it('rejects unknown location_mode', () => {
    expect(() =>
      appointmentTypeSchema.parse({ ...validAppointmentType, location_mode: 'video_call' }),
    ).toThrow();
  });

  it('requires routing_policy_id', () => {
    const { routing_policy_id, ...without } = validAppointmentType;
    expect(() => appointmentTypeSchema.parse(without)).toThrow();
  });
});

// ============================================================================
// routingPolicySchema
// ============================================================================

describe('routingPolicySchema', () => {
  it('accepts a valid policy with default tie_breaker', () => {
    const parsed = routingPolicySchema.parse(validRoutingPolicy);
    expect(parsed.tie_breaker).toBe('round_robin');
    expect(parsed.tag_conditions).toHaveLength(1);
  });

  it('rejects unknown tie_breaker (no load_balance in v1)', () => {
    expect(() =>
      routingPolicySchema.parse({ ...validRoutingPolicy, tie_breaker: 'load_balance' }),
    ).toThrow();
  });

  it('accepts empty tag_conditions (defaults to [])', () => {
    const parsed = routingPolicySchema.parse({ id: 'solo_program' });
    expect(parsed.tag_conditions).toEqual([]);
  });

  it('rejects tag_conditions with empty values array', () => {
    expect(() =>
      routingPolicySchema.parse({
        id: 'p',
        tag_conditions: [{ tag: 'program', values: [] }],
      }),
    ).toThrow();
  });
});

// ============================================================================
// reminderCadenceSchema (override)
// ============================================================================

describe('reminderCadenceSchema', () => {
  it('accepts an empty cadence (all defaults from §12.1 apply)', () => {
    expect(() => reminderCadenceSchema.parse({})).not.toThrow();
  });

  it('accepts a tier with email + sms reminders', () => {
    const parsed = reminderCadenceSchema.parse({
      tiers: [
        {
          lead_time_min_hours: 24,
          lead_time_max_hours: null,
          reminders: [
            { offset_minutes_before: 1440, channel: 'email' },
            { offset_minutes_before: 60, channel: 'sms' },
          ],
        },
      ],
    });
    expect(parsed.tiers).toHaveLength(1);
    expect(parsed.tiers![0].reminders).toHaveLength(2);
  });

  it('rejects offset_minutes_before <= 0', () => {
    expect(() =>
      reminderCadenceSchema.parse({
        tiers: [
          {
            lead_time_min_hours: 0,
            lead_time_max_hours: 1,
            reminders: [{ offset_minutes_before: 0, channel: 'email' }],
          },
        ],
      }),
    ).toThrow();
  });

  it('rejects unknown channel', () => {
    expect(() =>
      reminderCadenceSchema.parse({
        tiers: [
          {
            lead_time_min_hours: 0,
            lead_time_max_hours: 1,
            reminders: [{ offset_minutes_before: 60, channel: 'push' }],
          },
        ],
      }),
    ).toThrow();
  });
});
