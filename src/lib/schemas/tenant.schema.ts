/**
 * Tenant Schema - Zod validation schemas for complete tenant configuration
 */

import { z } from 'zod';
import { programSchema } from './program.schema';
import { conversationalFormSchema } from './form.schema';
import { ctaDefinitionSchema } from './cta.schema';
import { conversationBranchSchema } from './branch.schema';

// ============================================================================
// BRANDING SCHEMA
// ============================================================================

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF5733)');

export const brandingConfigSchema = z.object({
  logo_background_color: hexColorSchema.optional(),
  primary_color: hexColorSchema,
  avatar_background_color: hexColorSchema.optional(),
  header_text_color: hexColorSchema.optional(),
  widget_icon_color: hexColorSchema.optional(),
  font_family: z.string().min(1, 'Font family is required'),
  logo_url: z.string().url('Must be a valid URL').optional(),
  avatar_url: z.string().url('Must be a valid URL').optional(),
});

// ============================================================================
// FEATURES SCHEMA
// ============================================================================

export const calloutConfigSchema = z.object({
  enabled: z.boolean(),
  text: z.string().max(200, 'Callout text must be 200 characters or less').optional(),
  auto_dismiss: z.boolean(),
});

export const featuresConfigSchema = z.object({
  uploads: z.boolean(),
  photo_uploads: z.boolean(),
  voice_input: z.boolean(),
  streaming: z.boolean(),
  conversational_forms: z.boolean(),
  smart_cards: z.boolean(),
  callout: calloutConfigSchema,
});

// ============================================================================
// QUICK HELP SCHEMA
// ============================================================================

export const quickHelpConfigSchema = z.object({
  enabled: z.boolean(),
  title: z.string().min(1, 'Title is required').max(50, 'Title must be 50 characters or less'),
  toggle_text: z.string().min(1, 'Toggle text is required').max(50, 'Toggle text must be 50 characters or less'),
  close_after_selection: z.boolean(),
  prompts: z
    .array(z.string().min(1, 'Prompt cannot be empty').max(100, 'Prompt must be 100 characters or less'))
    .min(1, 'At least one prompt is required')
    .max(8, 'Maximum 8 prompts recommended'),
});

// ============================================================================
// ACTION CHIPS SCHEMA
// ============================================================================

export const actionChipSchema = z.object({
  label: z.string().min(1, 'Label is required').max(30, 'Label must be 30 characters or less'),
  value: z.string().min(1, 'Value is required').max(200, 'Value must be 200 characters or less'),
});

export const actionChipsConfigSchema = z.object({
  enabled: z.boolean(),
  max_display: z.number().int().min(1).max(5, 'Max display must be between 1 and 5'),
  show_on_welcome: z.boolean(),
  short_text_threshold: z.number().int().min(10).max(30, 'Threshold should be between 10 and 30'),
  default_chips: z.array(actionChipSchema).max(8, 'Maximum 8 default chips'),
});

// ============================================================================
// WIDGET BEHAVIOR SCHEMA
// ============================================================================

export const widgetBehaviorConfigSchema = z.object({
  start_open: z.boolean(),
  remember_state: z.boolean(),
  persist_conversations: z.boolean(),
  session_timeout_minutes: z.number().int().min(5).max(1440, 'Timeout must be between 5 and 1440 minutes (24 hours)'),
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
// CARD INVENTORY SCHEMA
// ============================================================================

export const primaryCTASchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  url: z.string().url('Must be a valid URL').optional(),
  trigger_phrases: z.array(z.string().min(1, 'Trigger phrase cannot be empty')),
});

export const requirementSchema = z.object({
  type: z.enum(['age', 'commitment', 'background_check', 'location', 'custom']),
  value: z.string().min(1, 'Value is required').max(100, 'Value must be 100 characters or less'),
  critical: z.boolean(),
  emphasis: z.enum(['low', 'medium', 'high']),
  display_text: z.string().min(1, 'Display text is required').max(200, 'Display text must be 200 characters or less'),
});

export const programCardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  commitment: z.string().min(1, 'Commitment is required').max(100, 'Commitment must be 100 characters or less'),
  url: z.string().url('Must be a valid URL'),
});

export const readinessThresholdsSchema = z.object({
  show_requirements: z.number().min(0).max(1),
  show_programs: z.number().min(0).max(1),
  show_cta: z.number().min(0).max(1),
  show_forms: z.number().min(0).max(1),
}).superRefine((data, ctx) => {
  // Validate threshold progression (each should be >= previous)
  if (data.show_programs < data.show_requirements) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['show_programs'],
      message: 'show_programs should be >= show_requirements',
    });
  }
  if (data.show_cta < data.show_programs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['show_cta'],
      message: 'show_cta should be >= show_programs',
    });
  }
  if (data.show_forms < data.show_cta) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['show_forms'],
      message: 'show_forms should be >= show_cta',
    });
  }
});

export const cardInventorySchema = z.object({
  strategy: z.enum(['qualification_first', 'exploration_first', 'custom']),
  primary_cta: primaryCTASchema,
  requirements: z.array(requirementSchema),
  program_cards: z.array(programCardSchema),
  readiness_thresholds: readinessThresholdsSchema,
});

// ============================================================================
// FULL TENANT CONFIG SCHEMA
// ============================================================================

export const tenantConfigSchema = z.object({
  // Core identity
  tenant_id: z.string().min(1, 'Tenant ID is required').max(50, 'Tenant ID must be 50 characters or less'),
  tenant_hash: z.string().min(1, 'Tenant hash is required').max(100, 'Tenant hash must be 100 characters or less'),
  subscription_tier: z.enum(['Free', 'Standard', 'Premium', 'Enterprise']),
  chat_title: z.string().min(1, 'Chat title is required').max(100, 'Chat title must be 100 characters or less'),
  tone_prompt: z.string().min(1, 'Tone prompt is required').max(2000, 'Tone prompt must be 2000 characters or less'),
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
  card_inventory: cardInventorySchema.optional(),

  // Configuration sections
  branding: brandingConfigSchema,
  features: featuresConfigSchema,
  quick_help: quickHelpConfigSchema.optional(),
  action_chips: actionChipsConfigSchema.optional(),
  widget_behavior: widgetBehaviorConfigSchema.optional(),
  cta_settings: ctaSettingsSchema.optional(),
  aws: awsConfigSchema,
}).superRefine((data, ctx) => {
  // Validate feature dependencies
  if (data.features.conversational_forms && Object.keys(data.conversational_forms).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['features', 'conversational_forms'],
      message: 'Conversational forms feature is enabled but no forms are defined',
    });
  }

  if (data.features.smart_cards) {
    if (Object.keys(data.cta_definitions).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['features', 'smart_cards'],
        message: 'Smart cards feature is enabled but no CTAs are defined',
      });
    }
    if (Object.keys(data.conversation_branches).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['features', 'smart_cards'],
        message: 'Smart cards feature is enabled but no conversation branches are defined',
      });
    }
  }

  // Validate that all form programs reference existing programs (if programs are defined)
  if (data.programs) {
    const programIds = new Set(Object.keys(data.programs));
    Object.entries(data.conversational_forms).forEach(([formId, form]) => {
      if (!programIds.has(form.program)) {
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
export type PrimaryCTA = z.infer<typeof primaryCTASchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type ProgramCard = z.infer<typeof programCardSchema>;
export type ReadinessThresholds = z.infer<typeof readinessThresholdsSchema>;
export type CardInventory = z.infer<typeof cardInventorySchema>;
export type TenantConfig = z.infer<typeof tenantConfigSchema>;
