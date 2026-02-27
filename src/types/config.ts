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

  // Age-based eligibility (for date fields)
  minimum_age?: number;
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
  // trigger_phrases removed - forms are now triggered via explicit CTA routing in conversational branches
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

export interface CTADefinition {
  text?: string; // Legacy field, use label instead
  label: string;
  action: CTAActionType;
  formId?: string; // Required if action = 'start_form'
  url?: string; // Required if action = 'external_link'
  query?: string; // Required if action = 'send_query'
  prompt?: string; // Required if action = 'show_info'
  type: CTAType;
  // Note: 'style' field removed in v1.5 - CTAs now use position-based styling from conversation branches

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

  /**
   * Program ID to associate this CTA with a specific program.
   * Optional field for organizational purposes.
   */
  program_id?: string;

  /**
   * When true, this CTA is included in the AI vocabulary for dynamic selection
   * (Tier 1-2 scoring via cta_selector). When false or omitted, this CTA only
   * appears when explicitly assigned to a branch.
   */
  ai_available?: boolean;
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

/**
 * CTA configuration for showcase items.
 * Similar to BranchAvailableCTAs but all fields are optional.
 * Showcase items act as "digital flyers" with grouped CTAs.
 */
export interface ShowcaseAvailableCTAs {
  /** Primary/featured CTA ID */
  primary?: string;
  /** Secondary CTA IDs (max 5 recommended) */
  secondary?: string[];
}

export interface ConversationBranch {
  available_ctas: BranchAvailableCTAs;

  /**
   * Description of when this branch should be triggered.
   * Used by AI to determine routing for free-form user queries.
   * Example: "Use when user asks about volunteering, helping families, or enrollment"
   */
  description?: string;

  /**
   * Program ID to associate this branch with a specific program.
   * Optional field for organizational purposes.
   */
  program_id?: string;

  /**
   * Showcase item ID to display when this branch is triggered.
   * Links to content_showcase[].id for "digital flyer" presentation.
   * When set, the showcase card renders with its own CTAs.
   */
  showcase_item_id?: string;
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

  /**
   * @deprecated Use available_ctas instead for multi-CTA support.
   * Single action configuration (legacy support).
   */
  action?: ShowcaseItemAction;

  /**
   * CTA hub configuration - groups multiple CTAs with this showcase item.
   * When set, CTAs render inside the showcase card as a "digital flyer".
   * Primary CTA is featured prominently, secondary CTAs shown below.
   */
  available_ctas?: ShowcaseAvailableCTAs;

  /**
   * Program ID to associate this showcase item with a specific program.
   * Optional field for organizational purposes.
   */
  program_id?: string;
}

export interface ContentShowcase {
  content_showcase: ShowcaseItem[];
}

// ============================================================================
// BRANDING
// ============================================================================

export interface BrandingConfig {
  // Primary colors
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  // Header
  header_background?: string;
  header_text_color?: string;
  header_subtitle_color?: string;
  // Chat bubbles
  user_bubble_color?: string;
  user_text_color?: string;
  bot_bubble_color?: string;
  bot_text_color?: string;
  // Widget
  widget_color?: string;
  widget_text_color?: string;
  widget_icon_color?: string;
  // Legacy
  logo_background_color?: string;
  avatar_background_color?: string;
  // Typography
  font_family: string;
  font_size_base?: string;
  // Layout
  border_radius?: string;
  chat_position?: 'bottom-right' | 'bottom-left';
  // Asset URLs
  logo_url?: string;
  avatar_url?: string;
  company_logo_url?: string;
}

// ============================================================================
// FEATURES
// ============================================================================

export interface CalloutConfig {
  enabled: boolean;
  text?: string;
  delay?: number;
  auto_dismiss: boolean;
  dismiss_timeout?: number;
}

export interface FeaturesConfig {
  uploads: boolean;
  photo_uploads: boolean;
  voice_input: boolean;
  streaming: boolean;
  conversational_forms: boolean;
  smart_cards: boolean;
  sms?: boolean;
  webchat?: boolean;
  qr?: boolean;
  bedrock_kb?: boolean;
  ats?: boolean;
  interview_scheduling?: boolean;
  dashboard_conversations?: boolean;
  dashboard_forms?: boolean;
  dashboard_attribution?: boolean;
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

export type ActionChipActionType = 'send_query' | 'show_info' | 'show_showcase';

export interface ActionChip {
  label: string;
  /**
   * Action type determines chip behavior:
   * - 'send_query': Sends value to Bedrock (default behavior)
   * - 'show_info': Displays value as static message without Bedrock call
   */
  action?: ActionChipActionType;
  /**
   * For 'send_query': Query sent to Bedrock
   * For 'show_info': Static message displayed to user
   */
  value: string;
  /**
   * Branch ID to route to when action chip is clicked (v1.4.1 Explicit Routing)
   * If null/undefined, chip will use fallback routing
   */
  target_branch?: string | null;

  /**
   * Showcase Item ID to display when action is 'show_showcase'.
   * Renders the showcase as a "digital flyer" with embedded CTAs.
   * Bypasses Bedrock entirely.
   */
  target_showcase_id?: string;

  /**
   * Program ID to associate this action chip with a specific program.
   * Optional field for organizational purposes.
   */
  program_id?: string;
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

export interface WidgetBehaviorMobileConfig {
  start_open?: boolean;
}

export interface WidgetBehaviorConfig {
  start_open: boolean;
  remember_state: boolean;
  persist_conversations: boolean;
  session_timeout_minutes: number;
  auto_open_delay?: number;
  mobile?: WidgetBehaviorMobileConfig;
}

// ============================================================================
// INTENT DEFINITIONS (V4 Classification)
// ============================================================================

/**
 * A single intent definition for V4 classification routing.
 * The classifier reads the description and compares it to the user's messages
 * to determine which intent best matches.
 *
 * Routing priority: target_branch > cta_id > no routing (response only)
 */
export interface IntentDefinition {
  /** Unique identifier for this intent. Used in routing rules and logs. */
  name: string;

  /** Natural language description read by the classifier. Quality of this field determines accuracy. */
  description: string;

  /** Key in conversation_branches to activate when this intent is matched. */
  target_branch?: string;

  /** Key in cta_definitions to surface as a single button when this intent is matched. */
  cta_id?: string;
}

// ============================================================================
// FEATURE FLAGS (V3.5 + V4)
// ============================================================================

export interface FeatureFlagsConfig {
  DYNAMIC_ACTIONS?: boolean;
  DYNAMIC_CHIPS?: boolean;
  GUIDANCE_MODULES?: boolean;
  DYNAMIC_CTA_SELECTION?: boolean;
  WORKFLOW_TRACKING?: boolean;
  V4_PIPELINE?: boolean;
}

// ============================================================================
// BEDROCK INSTRUCTIONS (Multi-Tenant Prompt Customization)
// ============================================================================

export type EmojiUsage = 'none' | 'moderate' | 'generous';
export type ResponseStyle = 'professional_concise' | 'warm_conversational' | 'structured_detailed';
export type DetailLevel = 'concise' | 'balanced' | 'comprehensive';

export interface FormattingPreferences {
  emoji_usage: EmojiUsage;
  max_emojis_per_response: number;
  response_style: ResponseStyle;
  detail_level: DetailLevel;
}

export interface BedrockInstructions {
  _version: string;
  _updated: string; // ISO timestamp
  role_instructions: string;
  formatting_preferences: FormattingPreferences;
  custom_constraints: string[];
  fallback_message: string;
}

// ============================================================================
// AWS CONFIGURATION
// ============================================================================

export interface AWSConfig {
  knowledge_base_id: string;
  aws_region: string;
  bot_id?: string;
  bot_alias_id?: string;
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
  tenant_type?: string;
  org_name?: string;
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
  bedrock_instructions?: BedrockInstructions;
  aws: AWSConfig;

  // V3.5 features
  feature_flags?: FeatureFlagsConfig;

  // V4 classification routing
  intent_definitions?: IntentDefinition[];
}
