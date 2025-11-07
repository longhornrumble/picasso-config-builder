/**
 * Type Guards - Runtime type checking utilities
 *
 * These functions provide runtime type checking for discriminated unions
 * and other complex types, enabling type narrowing in TypeScript.
 */

import type {
  CTADefinition,
  FormField,
  ValidationIssue,
  ValidationError,
  ValidationWarning,
  PostSubmissionAction,
  ConversationBranch,
  ConversationalForm,
} from '../../types';

// ============================================================================
// CTA TYPE GUARDS
// ============================================================================

/**
 * Type guard for CTAs that trigger forms
 */
export const isFormCTA = (cta: CTADefinition): cta is CTADefinition & { action: 'start_form'; formId: string } => {
  return cta.action === 'start_form' && typeof cta.formId === 'string' && cta.formId.length > 0;
};

/**
 * Type guard for CTAs that open external links
 */
export const isExternalLinkCTA = (cta: CTADefinition): cta is CTADefinition & { action: 'external_link'; url: string } => {
  return cta.action === 'external_link' && typeof cta.url === 'string' && cta.url.length > 0;
};

/**
 * Type guard for CTAs that send queries to Bedrock
 */
export const isSendQueryCTA = (cta: CTADefinition): cta is CTADefinition & { action: 'send_query'; query: string } => {
  return cta.action === 'send_query' && typeof cta.query === 'string' && cta.query.length > 0;
};

/**
 * Type guard for CTAs that show info (v1.3+)
 */
export const isShowInfoCTA = (cta: CTADefinition): cta is CTADefinition & { action: 'show_info'; prompt: string } => {
  return cta.action === 'show_info' && typeof cta.prompt === 'string' && cta.prompt.length > 0;
};

// ============================================================================
// FORM FIELD TYPE GUARDS
// ============================================================================

/**
 * Type guard for select fields (have options)
 */
export const isSelectField = (field: FormField): field is FormField & { type: 'select'; options: Array<{ value: string; label: string }> } => {
  return field.type === 'select' && Array.isArray(field.options) && field.options.length > 0;
};

/**
 * Type guard for eligibility gate fields
 */
export const isEligibilityGateField = (field: FormField): field is FormField & { eligibility_gate: true; failure_message: string } => {
  return field.eligibility_gate === true && typeof field.failure_message === 'string';
};

/**
 * Type guard for required fields
 */
export const isRequiredField = (field: FormField): boolean => {
  return field.required === true;
};

// ============================================================================
// VALIDATION TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a validation issue is an error
 */
export const isValidationError = (issue: ValidationIssue): issue is ValidationError => {
  return issue.severity === 'error';
};

/**
 * Type guard to check if a validation issue is a warning
 */
export const isValidationWarning = (issue: ValidationIssue): issue is ValidationWarning => {
  return issue.severity === 'warning';
};

// ============================================================================
// POST-SUBMISSION ACTION TYPE GUARDS
// ============================================================================

/**
 * Type guard for actions that end the conversation
 */
export const isEndConversationAction = (action: PostSubmissionAction): action is PostSubmissionAction & { action: 'end_conversation' } => {
  return action.action === 'end_conversation';
};

/**
 * Type guard for actions that continue the conversation
 */
export const isContinueConversationAction = (action: PostSubmissionAction): action is PostSubmissionAction & { action: 'continue_conversation' } => {
  return action.action === 'continue_conversation';
};

/**
 * Type guard for actions that start a new form
 */
export const isStartFormAction = (action: PostSubmissionAction): action is PostSubmissionAction & { action: 'start_form'; formId: string } => {
  return action.action === 'start_form' && typeof action.formId === 'string';
};

/**
 * Type guard for actions that open external links
 */
export const isExternalLinkAction = (action: PostSubmissionAction): action is PostSubmissionAction & { action: 'external_link'; url: string } => {
  return action.action === 'external_link' && typeof action.url === 'string';
};

// ============================================================================
// ENTITY EXISTENCE GUARDS
// ============================================================================

/**
 * Check if a value is defined (not null or undefined)
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Check if a value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Check if a value is a non-empty array
 */
export const isNonEmptyArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * Check if an object has a specific property
 */
export const hasProperty = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj;
};

// ============================================================================
// CONFIG ENTITY TYPE GUARDS
// ============================================================================

/**
 * Type guard for valid conversation branches
 */
export const isValidBranch = (branch: unknown): branch is ConversationBranch => {
  if (typeof branch !== 'object' || branch === null) return false;

  const b = branch as Partial<ConversationBranch>;

  return (
    typeof b.available_ctas === 'object' &&
    b.available_ctas !== null &&
    typeof b.available_ctas.primary === 'string' &&
    Array.isArray(b.available_ctas.secondary)
  );
};

/**
 * Type guard for valid conversational forms
 */
export const isValidForm = (form: unknown): form is ConversationalForm => {
  if (typeof form !== 'object' || form === null) return false;

  const f = form as Partial<ConversationalForm>;

  return (
    typeof f.enabled === 'boolean' &&
    typeof f.form_id === 'string' &&
    f.form_id.length > 0 &&
    typeof f.program === 'string' &&
    f.program.length > 0 &&
    typeof f.title === 'string' &&
    f.title.length > 0 &&
    Array.isArray(f.fields) &&
    f.fields.length > 0
  );
};

/**
 * Type guard for valid CTA definitions
 */
export const isValidCTA = (cta: unknown): cta is CTADefinition => {
  if (typeof cta !== 'object' || cta === null) return false;

  const c = cta as Partial<CTADefinition>;

  return (
    typeof c.label === 'string' &&
    c.label.length > 0 &&
    typeof c.action === 'string' &&
    ['start_form', 'external_link', 'send_query', 'show_info'].includes(c.action) &&
    typeof c.type === 'string'
    // Note: style field removed in v1.5 - position-based styling
  );
};

// ============================================================================
// UTILITY GUARDS
// ============================================================================

/**
 * Check if a value is a valid hex color
 */
export const isValidHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
};

/**
 * Check if a value is a valid URL
 */
export const isValidURL = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a value is a valid email
 */
export const isValidEmail = (value: unknown): value is string => {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/**
 * Check if a string is a valid ID format (lowercase letters, numbers, underscores)
 */
export const isValidID = (value: unknown): value is string => {
  return typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value);
};
