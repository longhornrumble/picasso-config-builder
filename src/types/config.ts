/**
 * Core Domain Types for Picasso Config Builder
 * Based on Tenant Config Schema v1.3
 *
 * These types represent the core entities in the tenant configuration:
 * - Programs: Organizational programs/services
 * - Forms: Conversational forms for data collection
 * - CTAs: Call-to-action buttons with various action types
 * - Branches: Conversation routing based on explicit CTA assignments
 * - Card Inventory: Smart response cards and progressive disclosure
 */

// ============================================================================
// PROGRAMS
// ============================================================================

export interface Program {
  program_id: string;
  program_name: string;
  description?: string;
}

// ============================================================================
// FORMS
// ============================================================================

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'select'
  | 'textarea'
  | 'number'
  | 'date'
  | 'name'      // Composite: first/middle/last name fields
  | 'address';  // Composite: street/city/state/zip fields

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  pattern?: string;
  message?: string;
}

/**
 * Subfield definition for composite field types (name, address)
 */
export interface FormSubField {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FormFieldValidation;
  type?: 'text' | 'select';
  options?: FormFieldOption[];
}

/**
 * Predefined subfield configurations for composite field types
 */
export interface CompositeFieldConfig {
  subfields: FormSubField[];
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  prompt: string;
  hint?: string;
  required: boolean;

  // For simple field types
  options?: FormFieldOption[];
  validation?: FormFieldValidation;

  // For composite field types (name, address)
  subfields?: FormSubField[];

  // Eligibility gates
  eligibility_gate?: boolean;
  failure_message?: string;
}

export type PostSubmissionActionType =
  | 'end_conversation'
  | 'continue_conversation'
  | 'start_form'
  | 'external_link';

export interface PostSubmissionAction {
  id: string;
  label: string;
  action: PostSubmissionActionType;
  formId?: string;
  url?: string;
}

export type FulfillmentMethod = 'email' | 'webhook' | 'dynamodb' | 'sheets';

export interface Fulfillment {
  method: FulfillmentMethod;
  recipients?: string[];
  cc?: string[];
  webhook_url?: string;
  subject_template?: string;
  notification_enabled?: boolean;
}

export interface PostSubmissionConfig {
  confirmation_message: string;
  next_steps?: string[];
  actions?: PostSubmissionAction[];
  fulfillment?: Fulfillment;
}

export interface ConversationalForm {
  enabled: boolean;
  form_id: string;
  program: string; // Required v1.3 - references a program ID
  title: string;
  description: string;
  introduction?: string; // Optional user-facing introduction message
  cta_text?: string;
  trigger_phrases: string[];
  fields: FormField[];
  post_submission?: PostSubmissionConfig;

  /**
   * Branch ID to show after successful form submission.
   * Enables routing to specific follow-up conversations based on form completion.
   * This provides an alternative to post_submission actions for conversation flow control.
   */
  on_completion_branch?: string;
}

// ============================================================================
// CTAs (Call-to-Actions)
// ============================================================================

export type CTAActionType = 'start_form' | 'external_link' | 'send_query' | 'show_info';
export type CTAType = 'form_trigger' | 'external_link' | 'bedrock_query' | 'info_request';
export type CTAStyle = 'primary' | 'secondary' | 'info';

export interface CTADefinition {
  text?: string; // Legacy field, use label instead
  label: string;
  action: CTAActionType;
  formId?: string; // Required if action = 'start_form'
  url?: string; // Required if action = 'external_link'
  query?: string; // Required if action = 'send_query'
  prompt?: string; // Required if action = 'show_info'
  type: CTAType;
  style: CTAStyle;

  /**
   * Branch ID to route to when this CTA is clicked.
   * Used for navigation CTAs (e.g., "Learn about Love Box").
   * Enables Lex-style explicit routing without keyword matching.
   */
  target_branch?: string;

  /**
   * Branch ID to show after form completes.
   * Used for form trigger CTAs (e.g., "Enroll in Love Box").
   * Allows routing to specific follow-up conversations after submission.
   */
  on_completion_branch?: string;
}

// ============================================================================
// CTA SETTINGS
// ============================================================================

/**
 * Global CTA behavior configuration.
 * Controls CTA display and routing behavior across the application.
 */
export interface CTASettings {
  /**
   * Branch ID to show when no keyword match is found.
   * Provides a fallback routing option when explicit branch routing is enabled.
   */
  fallback_branch?: string;

  /**
   * Maximum number of CTAs to display per response.
   * Default: 4
   */
  max_ctas_per_response?: number;
}

// ============================================================================
// CONVERSATION BRANCHES
// ============================================================================

export interface BranchAvailableCTAs {
  primary: string; // CTA ID
  secondary: string[]; // Array of CTA IDs
}

export interface ConversationBranch {
  available_ctas: BranchAvailableCTAs;
}

// ============================================================================
// CONTENT SHOWCASE (Content Inventory / Ad System)
// ============================================================================

export type ShowcaseItemType = 'program' | 'event' | 'initiative' | 'campaign';
export type ShowcaseActionType = 'prompt' | 'url' | 'cta';

export interface ShowcaseItemAction {
  type: ShowcaseActionType;
  label: string;

  // For 'prompt' action - sends message to Bedrock
  prompt?: string;

  // For 'url' action - opens external link
  url?: string;
  open_in_new_tab?: boolean;

  // For 'cta' action - triggers existing CTA
  cta_id?: string;
}

export interface ShowcaseItem {
  id: string;
  type: ShowcaseItemType;
  enabled: boolean;

  // Content
  name: string;
  tagline: string;
  description: string;
  image_url?: string;

  // Supporting details
  stats?: string;
  testimonial?: string;
  highlights?: string[];

  // Targeting
  keywords: string[];

  // Action configuration
  action?: ShowcaseItemAction;
}

export interface ContentShowcase {
  content_showcase: ShowcaseItem[];
}

// ============================================================================
// BRANDING
// ============================================================================

export interface BrandingConfig {
  logo_background_color?: string;
  primary_color: string;
  avatar_background_color?: string;
  header_text_color?: string;
  widget_icon_color?: string;
  font_family: string;
  logo_url?: string;
  avatar_url?: string;
}

// ============================================================================
// FEATURES
// ============================================================================

export interface CalloutConfig {
  enabled: boolean;
  text?: string;
  auto_dismiss: boolean;
}

export interface FeaturesConfig {
  uploads: boolean;
  photo_uploads: boolean;
  voice_input: boolean;
  streaming: boolean;
  conversational_forms: boolean;
  smart_cards: boolean;
  callout: CalloutConfig;
}

// ============================================================================
// QUICK HELP
// ============================================================================

export interface QuickHelpConfig {
  enabled: boolean;
  title: string;
  toggle_text: string;
  close_after_selection: boolean;
  prompts: string[];
}

// ============================================================================
// ACTION CHIPS
// ============================================================================

export interface ActionChip {
  label: string;
  value: string;
  /**
   * Branch ID to route to when action chip is clicked (v1.4.1 Explicit Routing)
   * If null/undefined, chip will use fallback routing
   */
  target_branch?: string | null;
}

export interface ActionChipsConfig {
  enabled: boolean;
  max_display?: number;
  show_on_welcome?: boolean;
  short_text_threshold?: number;
  /**
   * Action chips in dictionary format (v1.4.1+)
   * Key = chip ID (auto-generated from label)
   * Value = ActionChip object with label, value, target_branch
   */
  default_chips: Record<string, ActionChip>;
}

// ============================================================================
// WIDGET BEHAVIOR
// ============================================================================

export interface WidgetBehaviorConfig {
  start_open: boolean;
  remember_state: boolean;
  persist_conversations: boolean;
  session_timeout_minutes: number;
}

// ============================================================================
// AWS CONFIGURATION
// ============================================================================

export interface AWSConfig {
  knowledge_base_id: string;
  aws_region: string;
}

// ============================================================================
// FULL TENANT CONFIG
// ============================================================================

export type SubscriptionTier = 'Free' | 'Standard' | 'Premium' | 'Enterprise';

export interface TenantConfig {
  // Core identity
  tenant_id: string;
  tenant_hash: string;
  subscription_tier: SubscriptionTier;
  chat_title: string;
  tone_prompt: string;
  welcome_message: string;
  callout_text?: string;
  version: string;
  generated_at: number;
  model_id?: string;

  // Programs (optional in config, but used by forms)
  programs?: Record<string, Program>;

  // Conversational features
  conversational_forms: Record<string, ConversationalForm>;
  cta_definitions: Record<string, CTADefinition>;
  conversation_branches: Record<string, ConversationBranch>;
  content_showcase?: ShowcaseItem[];

  // Configuration sections
  branding: BrandingConfig;
  features: FeaturesConfig;
  quick_help?: QuickHelpConfig;
  action_chips?: ActionChipsConfig;
  widget_behavior?: WidgetBehaviorConfig;
  cta_settings?: CTASettings;
  aws: AWSConfig;
}
