/**
 * Schemas Index - Central export for all Zod validation schemas
 *
 * This barrel file exports all schemas and their inferred types
 * for convenient importing throughout the application.
 */

// Program schemas
export {
  programSchema,
  type Program,
} from './program.schema';

// Form schemas
export {
  formFieldOptionSchema,
  formFieldSchema,
  postSubmissionActionSchema,
  fulfillmentSchema,
  postSubmissionConfigSchema,
  conversationalFormSchema,
  type FormFieldOption,
  type FormField,
  type PostSubmissionAction,
  type Fulfillment,
  type PostSubmissionConfig,
  type ConversationalForm,
} from './form.schema';

// CTA schemas
export {
  ctaDefinitionSchema,
  type CTADefinition,
} from './cta.schema';

// Branch schemas
export {
  branchAvailableCTAsSchema,
  conversationBranchSchema,
  type BranchAvailableCTAs,
  type ConversationBranch,
} from './branch.schema';

// Tenant schemas
export {
  brandingConfigSchema,
  calloutConfigSchema,
  featuresConfigSchema,
  quickHelpConfigSchema,
  actionChipSchema,
  actionChipsConfigSchema,
  widgetBehaviorConfigSchema,
  ctaSettingsSchema,
  awsConfigSchema,
  primaryCTASchema,
  requirementSchema,
  programCardSchema,
  readinessThresholdsSchema,
  cardInventorySchema,
  tenantConfigSchema,
  type BrandingConfig,
  type CalloutConfig,
  type FeaturesConfig,
  type QuickHelpConfig,
  type ActionChip,
  type ActionChipsConfig,
  type WidgetBehaviorConfig,
  type CTASettings,
  type AWSConfig,
  type PrimaryCTA,
  type Requirement,
  type ProgramCard,
  type ReadinessThresholds,
  type CardInventory,
  type TenantConfig,
} from './tenant.schema';

// Create Tenant schemas
export {
  createTenantSchema,
  type CreateTenantFormData,
} from './createTenant.schema';

// Scheduling schemas (v1 scheduling config block — see scheduling/docs/scheduling_config_schema.md)
export {
  reminderEntrySchema,
  reminderTierSchema,
  reminderCadenceSchema,
  tagConditionSchema,
  routingPolicySchema,
  appointmentTypeSchema,
  schedulingConfigSchema,
  type ReminderEntry,
  type ReminderTier,
  type ReminderCadence,
  type TagCondition,
  type RoutingPolicy,
  type AppointmentType,
  type SchedulingConfig,
} from './scheduling.schema';
