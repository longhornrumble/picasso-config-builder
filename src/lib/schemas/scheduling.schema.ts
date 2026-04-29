/**
 * Scheduling Schema — Zod validation schemas for the v1 scheduling config block.
 *
 * Spec source: scheduling/docs/scheduling_config_schema.md §4–§7.
 * Implementation plan: scheduling/docs/scheduling_implementation_plan.md task A3.
 *
 * The scheduling block is optional at the tenant-config level — it is required
 * only when feature_flags.scheduling_enabled === true. The cross-section
 * invariant is enforced in tenant.schema.ts (see task A5).
 */

import { z } from 'zod';

// ============================================================================
// REMINDER CADENCE SCHEMAS (spec §7)
// ============================================================================

export const reminderEntrySchema = z.object({
  offset_minutes_before: z
    .number()
    .int()
    .positive('Offset must be a positive integer'),
  channel: z.enum(['email', 'sms', 'both']),
  template_id: z
    .string()
    .min(1)
    .optional()
    .describe('Tenant-custom template ID; defaults to platform template when omitted'),
});

export const reminderTierSchema = z.object({
  lead_time_min_hours: z.number().nonnegative(),
  lead_time_max_hours: z
    .number()
    .positive()
    .nullable()
    .describe('Upper bound for the tier; null indicates no upper bound'),
  reminders: z.array(reminderEntrySchema),
});

export const reminderCadenceSchema = z.object({
  tiers: z
    .array(reminderTierSchema)
    .optional()
    .describe('When unset, platform defaults from canonical §12.1 apply'),
  sms_opt_in_prompt: z
    .string()
    .max(300, 'SMS opt-in prompt must be 300 characters or less')
    .optional()
    .describe('Tenant-custom TCPA opt-in copy; defaults to platform-provided'),
});

// ============================================================================
// ROUTING POLICY SCHEMAS (spec §6)
// ============================================================================

export const tagConditionSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),
  operator: z.enum(['equals', 'in_any']).default('equals'),
  values: z.array(z.string().min(1)).min(1, 'At least one value is required'),
});

export const routingPolicySchema = z.object({
  id: z.string().min(1, 'RoutingPolicy id is required'),
  tag_conditions: z.array(tagConditionSchema).default([]),
  tie_breaker: z.enum(['round_robin', 'first_available']).default('round_robin'),

  // Round-robin state — managed at runtime, not by operator-authored configs.
  // Listed here for schema completeness; absent in operator-edited config files.
  last_assigned_resource_id: z.string().optional(),
  last_assigned_at: z
    .number()
    .int()
    .optional()
    .describe('Unix milliseconds; runtime-managed'),
});

// ============================================================================
// APPOINTMENT TYPE SCHEMA (spec §5)
// ============================================================================

export const appointmentTypeSchema = z.object({
  id: z.string().min(1, 'AppointmentType id is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  duration_minutes: z
    .number()
    .int()
    .positive()
    .max(480, 'Duration cannot exceed 480 minutes (8 hours)'),
  buffer_before_minutes: z.number().int().nonnegative().default(0),
  buffer_after_minutes: z.number().int().nonnegative().default(0),
  lead_time_minutes: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe('Minimum notice required for booking'),
  max_advance_days: z
    .number()
    .int()
    .positive()
    .max(365, 'Max advance days cannot exceed 365')
    .default(30),
  slot_granularity_minutes: z
    .union([z.literal(15), z.literal(30), z.literal(60)])
    .default(30),
  location_mode: z.enum(['virtual_meet', 'virtual_zoom', 'phone', 'in_person']),
  required_fields: z
    .array(z.enum(['name', 'email', 'phone']))
    .default(['name', 'email']),
  routing_policy_id: z
    .string()
    .min(1, 'routing_policy_id reference is required'),
  cancellation_window_hours: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe('Default 0 = reschedule allowed up to start time'),
  reminder_cadence_override: reminderCadenceSchema.optional(),

  // v1 single-format only; widens in v2 to include 'group' and 'panel'.
  // Present in v1 to lock in DB uniqueness scoping per canonical §5.2 item 2.
  format: z.literal('one_to_one').default('one_to_one'),
});

// ============================================================================
// SCHEDULING CONFIG SCHEMA (spec §4 — top-level scheduling block)
// ============================================================================

const bcp47Pattern = /^[a-z]{2}(-[A-Z]{2})?$/;

export const schedulingConfigSchema = z.object({
  // Workspace identity
  workspace_domains: z
    .array(z.string().min(1))
    .min(1, 'At least one workspace domain is required'),

  // Localization
  default_locale: z
    .string()
    .regex(bcp47Pattern, 'Must be a BCP-47 language tag (e.g., "en", "en-US", "es")')
    .default('en'),
  available_locales: z
    .array(z.string().regex(bcp47Pattern))
    .min(1)
    .default(['en']),

  // Tag vocabulary — drives routing eligibility
  scheduling_tag_vocabulary: z
    .array(z.string().min(1).max(50, 'Tag must be 50 characters or less'))
    .default([]),

  // Domain entities (records keyed by id)
  appointment_types: z.record(z.string(), appointmentTypeSchema),
  routing_policies: z.record(z.string(), routingPolicySchema),

  // Optional pre-call form (referenced by start_scheduling CTAs in walk-up case)
  pre_call_form_id: z
    .string()
    .optional()
    .describe('References a key in conversational_forms; validated at config-load time'),

  // Operator-facing fallback
  fallback_scheduler_url: z
    .string()
    .url('Must be a valid URL')
    .optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ReminderEntry = z.infer<typeof reminderEntrySchema>;
export type ReminderTier = z.infer<typeof reminderTierSchema>;
export type ReminderCadence = z.infer<typeof reminderCadenceSchema>;
export type TagCondition = z.infer<typeof tagConditionSchema>;
export type RoutingPolicy = z.infer<typeof routingPolicySchema>;
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;
export type SchedulingConfig = z.infer<typeof schedulingConfigSchema>;
