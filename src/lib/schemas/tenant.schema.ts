/**
 * Tenant Schema - Zod validation schemas for complete tenant configuration
 */

import { z } from 'zod';
import { programSchema } from './program.schema';
import { conversationalFormSchema } from './form.schema';
import { ctaDefinitionSchema } from './cta.schema';
import { conversationBranchSchema } from './branch.schema';
import { schedulingConfigSchema } from './scheduling.schema';

// ============================================================================
// BRANDING SCHEMA
// ============================================================================

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF5733)');

export const brandingConfigSchema = z.object({
  primary_color: hexColorSchema,
  secondary_color: hexColorSchema.optional(),
  font_family: z.string().min(1, 'Font family is required'),
  chat_position: z.enum(['bottom-right', 'bottom-left']).optional(),
});

// ============================================================================
// FEATURES SCHEMA
// ============================================================================

export const calloutConfigSchema = z.object({
  enabled: z.boolean(),
  text: z.string().max(200, 'Callout text must be 200 characters or less').optional(),
  /** Delay before showing the callout, ms. Widget defaults to 1000 when unset. */
  delay: z.number().int('Must be a whole number of milliseconds').min(0, 'Delay cannot be negative').optional(),
  auto_dismiss: z.boolean(),
  /** Auto-dismiss timeout, ms. Widget defaults to 30000 when unset. */
  dismiss_timeout: z.number().int('Must be a whole number of milliseconds').min(0, 'Timeout cannot be negative').optional(),
});

export const featuresConfigSchema = z.object({
  uploads: z.boolean(),
  photo_uploads: z.boolean(),
  voice_input: z.boolean(),
  sms: z.boolean().optional(),
  callout: calloutConfigSchema,
});

// ============================================================================
// QUICK HELP SCHEMA
// ============================================================================

export const quickHelpConfigSchema = z.object({
  enabled: z.boolean(),
  prompts: z
    .array(z.string().min(1, 'Prompt cannot be empty').max(100, 'Prompt must be 100 characters or less'))
    .min(1, 'At least one prompt is required')
    .max(8, 'Maximum 8 prompts recommended'),
});

// ============================================================================
// ACTION CHIPS SCHEMA
// ============================================================================

export const actionChipSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be 50 characters or less'),
  action: z.enum(['send_query', 'show_info'], {
    errorMap: () => ({ message: 'Action must be either send_query or show_info' }),
  }).optional().default('send_query'),
  value: z.string().min(1, 'Value/message is required'), // No max length - supports paragraphs
  target_branch: z.string().min(1, 'Branch ID cannot be empty').max(100, 'Branch ID must be 100 characters or less').nullable().optional(),
});

export const actionChipsConfigSchema = z.object({
  enabled: z.boolean(),
  max_display: z.number().int().min(1).max(8, 'Max display must be between 1 and 8'),
  show_on_welcome: z.boolean(),
  short_text_threshold: z.number().int().min(10).max(30, 'Threshold should be between 10 and 30').optional(),
  default_chips: z.record(z.string(), actionChipSchema).refine(
    (chips) => Object.keys(chips).length <= 8,
    'Maximum 8 default chips',
  ),
});

// ============================================================================
// WIDGET BEHAVIOR SCHEMA
// ============================================================================

export const widgetBehaviorConfigSchema = z.object({
  start_open: z.boolean(),
  remember_state: z.boolean(),
  auto_open_delay: z.number().int().min(0).optional(),
  mobile: z.object({
    start_open: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// AWS CONFIGURATION SCHEMA
// ============================================================================

export const awsConfigSchema = z.object({
  knowledge_base_id: z
    .string()
    .min(10, 'Knowledge base ID must be at least 10 characters')
    .max(20, 'Knowledge base ID must be at most 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Knowledge base ID must contain only uppercase letters and numbers'),
  aws_region: z
    .string()
    .min(1, 'AWS region is required')
    .regex(/^[a-z]{2}-[a-z]+-\d$/, 'Must be a valid AWS region (e.g., us-east-1)'),
});

// ============================================================================
// CTA SETTINGS SCHEMA
// ============================================================================

export const ctaSettingsSchema = z.object({
  fallback_branch: z
    .string()
    .min(1, 'Fallback branch ID cannot be empty')
    .max(100, 'Fallback branch ID must be 100 characters or less')
    .optional()
    .describe('Branch ID to show when no keyword match is found'),
  max_ctas_per_response: z
    .number()
    .int('Must be an integer')
    .min(1, 'Must display at least 1 CTA')
    .max(10, 'Cannot display more than 10 CTAs')
    .optional()
    .describe('Maximum number of CTAs to display per response (default: 4)'),
});

// ============================================================================
// CHANNELS SCHEMA (Facebook Messenger / Instagram DMs)
// ============================================================================

export const channelConnectionSchema = z.object({
  page_id: z.string().min(1, 'Page ID is required'),
  page_name: z.string().min(1, 'Page name is required'),
  enabled: z.boolean(),
  connected_at: z.string(),
  connected_by: z.string(),
});

export const instagramChannelConnectionSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
  account_name: z.string().min(1, 'Account name is required'),
  enabled: z.boolean(),
  connected_at: z.string(),
  connected_by: z.string(),
});

export const channelsConfigSchema = z
  .object({
    messenger: channelConnectionSchema.optional(),
    instagram: instagramChannelConnectionSchema.optional(),
  })
  .optional();

// ============================================================================
// MESSENGER BEHAVIOR SCHEMA (Messenger Channel Experience — contract C2)
// ============================================================================
// Frozen shape: Lambdas/lambda/docs/messenger/CONTRACTS.md C2. All fields
// optional (missing section ⇒ runtime defaults). Strings is an open record so
// additive strings never need a schema change (D10).

export const messengerStringsSchema = z.record(z.string(), z.string());

export const messengerChannelOverrideSchema = z.object({
  tone_override: z.string().optional(),
  model_id: z.string().optional(),
  strings: messengerStringsSchema.optional(),
});

export const messengerBehaviorSchema = z.object({
  tone_override: z.string().optional(),
  escalation_email: z.string().email().optional(),
  model_id: z.string().optional(),
  max_history_turns: z.number().int().positive().optional(),
  strings: messengerStringsSchema.optional(),
  welcome: z
    .object({
      ice_breakers: z
        .array(z.object({ question: z.string().min(1), payload: z.string().min(1) }))
        .max(4, 'Meta allows at most 4 ice breakers per channel (capability map C5)')
        .optional(),
      persistent_menu: z
        .array(z.object({ title: z.string().min(1), payload: z.string().optional(), url: z.string().optional() }))
        .optional(),
    })
    .optional(),
  channel_overrides: z
    .object({
      messenger: messengerChannelOverrideSchema.optional(),
      instagram: messengerChannelOverrideSchema.optional(),
    })
    .optional(),
});

// ============================================================================
// FEATURE FLAGS SCHEMA
// ============================================================================

// Passthrough so existing flags (V4_ACTION_SELECTOR, DYNAMIC_ACTIONS, etc.)
// remain valid without listing them all here. Only fields whose values gate
// other invariants (per scheduling_config_schema §1) are typed.
export const featureFlagsSchema = z
  .object({
    scheduling_enabled: z.boolean().optional().default(false),
  })
  .passthrough();

// ============================================================================
// FULL TENANT CONFIG SCHEMA
// ============================================================================

export const tenantConfigSchema = z.object({
  // Core identity
  tenant_id: z.string().min(1, 'Tenant ID is required').max(50, 'Tenant ID must be 50 characters or less'),
  tenant_hash: z.string().min(1, 'Tenant hash is required').max(100, 'Tenant hash must be 100 characters or less'),
  subscription_tier: z.enum(['Free', 'Standard', 'Premium', 'Enterprise']),
  chat_title: z.string().min(1, 'Chat title is required').max(100, 'Chat title must be 100 characters or less'),
  tone_prompt: z.string().max(2000, 'Tone prompt must be 2000 characters or less'),
  welcome_message: z.string().min(1, 'Welcome message is required').max(500, 'Welcome message must be 500 characters or less'),
  callout_text: z.string().max(200, 'Callout text must be 200 characters or less').optional(),
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be in semver format (e.g., 1.3 or 1.3.0)'),
  generated_at: z.number().int().positive('Generated at must be a positive timestamp'),
  model_id: z.string().optional(),

  // Programs (optional in config)
  programs: z.record(z.string(), programSchema).optional(),

  // Conversational features
  conversational_forms: z.record(z.string(), conversationalFormSchema),
  cta_definitions: z.record(z.string(), ctaDefinitionSchema),
  conversation_branches: z.record(z.string(), conversationBranchSchema),

  // Configuration sections
  branding: brandingConfigSchema,
  features: featuresConfigSchema,
  quick_help: quickHelpConfigSchema.optional(),
  action_chips: actionChipsConfigSchema.optional(),
  widget_behavior: widgetBehaviorConfigSchema.optional(),
  cta_settings: ctaSettingsSchema.optional(),
  aws: awsConfigSchema,

  // Channel integrations
  channels: channelsConfigSchema,

  // Scheduling (optional v1 block — schema spec §1)
  scheduling: schedulingConfigSchema.optional(),
  feature_flags: featureFlagsSchema.optional(),

  // Messenger Channel Experience behavior tuning (contract C2)
  messenger_behavior: messengerBehaviorSchema.optional(),

}).superRefine((data, ctx) => {
  // Validate that all form programs reference existing programs (if programs are defined).
  // A form.program is valid if it matches EITHER the programs object key OR a
  // program's .program_id field. This matches FormCardContent.tsx:18 (the canonical
  // display lookup: `programs[entity.program] || Object.values(programs).find(p => p.program_id === entity.program)`),
  // accommodates real prod data where key !== .program_id (verified on AUS123957
  // 2026-05-23), and stays consistent with the runtime which treats refs as flat
  // strings and doesn't enforce join semantics.
  if (data.programs) {
    const validProgramRefs = new Set<string>();
    for (const [programKey, program] of Object.entries(data.programs)) {
      validProgramRefs.add(programKey);
      // Forward-compat (CLAUDE.md Schema Discipline + audit R11): if a future
      // programSchema relaxation makes program_id optional, this guard stops
      // `undefined` from poisoning the set and silently matching the same on
      // form.program.
      if (program.program_id) validProgramRefs.add(program.program_id);
    }
    Object.entries(data.conversational_forms).forEach(([formId, form]) => {
      if (!validProgramRefs.has(form.program)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversational_forms', formId, 'program'],
          message: `Form references non-existent program: ${form.program}`,
        });
      }
    });
  }

  // Validate that all CTA form references exist
  Object.entries(data.cta_definitions).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_form' && cta.formId) {
      if (!data.conversational_forms[cta.formId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cta_definitions', ctaId, 'formId'],
          message: `CTA references non-existent form: ${cta.formId}`,
        });
      }
    }
  });

  // Validate that all branch CTAs exist
  const ctaIds = new Set(Object.keys(data.cta_definitions));
  Object.entries(data.conversation_branches).forEach(([branchId, branch]) => {
    if (!ctaIds.has(branch.available_ctas.primary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversation_branches', branchId, 'available_ctas', 'primary'],
        message: `Branch references non-existent CTA: ${branch.available_ctas.primary}`,
      });
    }
    branch.available_ctas.secondary.forEach((ctaId, index) => {
      if (!ctaIds.has(ctaId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversation_branches', branchId, 'available_ctas', 'secondary', index],
          message: `Branch references non-existent CTA: ${ctaId}`,
        });
      }
    });
  });

  // ==========================================================================
  // Scheduling cross-section invariants (schema spec §10)
  // ==========================================================================

  const schedulingEnabled = data.feature_flags?.scheduling_enabled === true;

  // Invariant 1: scheduling_enabled === true ⟹ scheduling block present
  if (schedulingEnabled && !data.scheduling) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduling'],
      message: 'scheduling_enabled requires a scheduling configuration block',
    });
  }

  if (data.scheduling) {
    const scheduling = data.scheduling;
    const routingPolicyIds = new Set(Object.keys(scheduling.routing_policies ?? {}));
    const tagVocabulary = new Set(scheduling.scheduling_tag_vocabulary ?? []);

    // Invariant 2: every appointment_types[*].routing_policy_id ∈ routing_policies.
    // routing_policy_id is optional (transitional); only cross-check when set,
    // so old configs without routing wired up still validate (forward-compat).
    Object.entries(scheduling.appointment_types ?? {}).forEach(([typeId, appt]) => {
      if (appt.routing_policy_id && !routingPolicyIds.has(appt.routing_policy_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scheduling', 'appointment_types', typeId, 'routing_policy_id'],
          message: `Appointment type references non-existent routing_policy: ${appt.routing_policy_id}`,
        });
      }
    });

    // Invariant 3: every routing_policies[*].tag_conditions[*].tag ∈ scheduling_tag_vocabulary
    Object.entries(scheduling.routing_policies ?? {}).forEach(([policyId, policy]) => {
      (policy.tag_conditions ?? []).forEach((condition, index) => {
        if (!tagVocabulary.has(condition.tag)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['scheduling', 'routing_policies', policyId, 'tag_conditions', index, 'tag'],
            message: `Tag condition references unknown tag: ${condition.tag}`,
          });
        }
      });
    });

    // Invariant 4: scheduling.pre_call_form_id, when set, ∈ conversational_forms
    if (scheduling.pre_call_form_id && !data.conversational_forms[scheduling.pre_call_form_id]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduling', 'pre_call_form_id'],
        message: `pre_call_form_id references non-existent form: ${scheduling.pre_call_form_id}`,
      });
    }

    // Invariant 5: scheduling.default_locale ∈ scheduling.available_locales
    if (
      scheduling.default_locale &&
      Array.isArray(scheduling.available_locales) &&
      !scheduling.available_locales.includes(scheduling.default_locale)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduling', 'default_locale'],
        message: `default_locale "${scheduling.default_locale}" is not in available_locales`,
      });
    }
  }

  // Invariant 6: every CTA with action ∈ {start_scheduling, resume_scheduling}
  // requires scheduling_enabled === true and non-empty scheduling.appointment_types
  const hasAppointmentTypes =
    !!data.scheduling && Object.keys(data.scheduling.appointment_types ?? {}).length > 0;

  Object.entries(data.cta_definitions).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_scheduling' || cta.action === 'resume_scheduling') {
      if (!schedulingEnabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cta_definitions', ctaId, 'action'],
          message: `CTA action "${cta.action}" requires feature_flags.scheduling_enabled === true`,
        });
      }
      if (!hasAppointmentTypes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cta_definitions', ctaId, 'action'],
          message: `CTA action "${cta.action}" requires non-empty scheduling.appointment_types`,
        });
      }
    }
  });

});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BrandingConfig = z.infer<typeof brandingConfigSchema>;
export type CalloutConfig = z.infer<typeof calloutConfigSchema>;
export type FeaturesConfig = z.infer<typeof featuresConfigSchema>;
export type QuickHelpConfig = z.infer<typeof quickHelpConfigSchema>;
export type ActionChip = z.infer<typeof actionChipSchema>;
export type ActionChipsConfig = z.infer<typeof actionChipsConfigSchema>;
export type WidgetBehaviorConfig = z.infer<typeof widgetBehaviorConfigSchema>;
export type CTASettings = z.infer<typeof ctaSettingsSchema>;
export type AWSConfig = z.infer<typeof awsConfigSchema>;
export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type ChannelConnection = z.infer<typeof channelConnectionSchema>;
export type InstagramChannelConnection = z.infer<typeof instagramChannelConnectionSchema>;
export type ChannelsConfig = z.infer<typeof channelsConfigSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
