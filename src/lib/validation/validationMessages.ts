/**
 * Validation Messages
 * Message templates and helpers for consistent validation messages
 */

import type { ValidationError, ValidationWarning } from './types';

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export const messages = {
  // CTA Messages
  cta: {
    missingFormId: 'Form ID is required when action is "start_form"',
    invalidFormId: (formId: string) => `Referenced form "${formId}" does not exist`,
    missingUrl: 'URL is required when action is "external_link"',
    invalidUrl: 'URL must use https:// protocol',
    missingQuery: 'Query is required when action is "send_query"',
    missingPrompt: 'Prompt is required when action is "show_info"',
    genericLabel: 'Button text is generic. Consider using more specific, actionable text',
    genericLabelExamples: 'Generic labels like "Click Here", "Learn More", or "Submit" reduce user engagement',
    vaguePrompt: 'Info CTA prompts should be specific questions or requests, not vague or generic phrases',
    formWithoutProgram: (formId: string) =>
      `Form "${formId}" referenced by this CTA doesn't have a program assigned`,
  },

  // Form Messages
  form: {
    missingProgram: 'Program reference is required',
    invalidProgram: (programId: string) => `Referenced program "${programId}" does not exist`,
    noFields: 'Form must have at least one field',
    noTriggerPhrases: 'Form has no trigger phrases - users can only access it via CTA',
    tooManyFields: (count: number) =>
      `Form has too many fields (${count} total). Long forms (>10 fields) may reduce completion rates`,
    missingEmailValidation: 'Email fields should have email format validation',
    missingPhoneValidation: 'Phone fields should have phone format validation',
    noRequiredFields: 'Form should have at least one required field',
    selectNeedsOptions: 'Select fields must have at least one option (options required)',
    duplicateFieldId: (id: string) => `duplicate field ID: "${id}"`,
    eligibilityNeedsFailureMessage: 'Eligibility gate fields must have a failure message',
  },

  // Branch Messages
  branch: {
    noKeywords: 'Branch must have at least one detection keyword',
    noPrimaryCTA: 'Branch must have a primary CTA',
    invalidPrimaryCTA: (ctaId: string) => `Referenced CTA "${ctaId}" does not exist`,
    invalidSecondaryCTA: (ctaId: string, index: number) =>
      `secondary CTA ${index + 1} "${ctaId}" does not exist`,
    tooManyCTAs: (count: number) =>
      `Branch has too many CTAs (${count} total). Runtime limits to 3 buttons - only first 3 will be shown`,
    keywordsLookLikeQueries:
      'Keywords contain question words. Detection keywords should match anticipated Bedrock responses, not user queries',
    questionWords: (words: string[]) => `Found question words: ${words.join(', ')}`,
    keywordOverlap: (otherBranchId: string, overlap: string[]) =>
      `Keywords overlap significantly with branch "${otherBranchId}": ${overlap.slice(0, 3).join(', ')}${overlap.length > 3 ? '...' : ''}`,
    prioritySuggestion: 'Broader topics should have higher priority (sorted first), specific programs should have lower priority',
  },

  // Relationship Messages
  relationship: {
    circularDependency: (entities: string[]) => `circular dependency detected: ${entities.join(' → ')}`,
    orphanedEntity: (entityType: string, entityId: string) =>
      `orphaned ${entityType} "${entityId}" is not referenced by any other entity`,
  },

  // Runtime Messages
  runtime: {
    formNeedsProgram:
      'Form should have a program assigned for proper filtering after completion',
    cardInventoryMismatch: (formProgram: string) =>
      `Form references program "${formProgram}" which doesn't exist in card_inventory.program_cards`,
    qualificationFirstNoRequirements:
      'Card inventory uses qualification_first strategy but has no requirements defined',
  },

  // General Messages
  general: {
    required: (field: string) => `${field} is required`,
    tooLong: (field: string, max: number) => `${field} must be ${max} characters or less`,
    tooShort: (field: string, min: number) => `${field} must be at least ${min} characters`,
    invalid: (field: string) => `${field} is invalid`,
  },
} as const;

// ============================================================================
// MESSAGE HELPERS
// ============================================================================

/**
 * Create a validation error with consistent formatting
 */
export function createError(
  message: string,
  entityType: string,
  options?: {
    field?: string;
    entityId?: string;
    suggestedFix?: string;
  }
): ValidationError {
  return {
    level: 'error',
    message: `❌ ${message}`,
    field: options?.field,
    entityType: entityType as any,
    entityId: options?.entityId,
    suggestedFix: options?.suggestedFix,
  };
}

/**
 * Create a validation warning with consistent formatting
 */
export function createWarning(
  message: string,
  entityType: string,
  options?: {
    field?: string;
    entityId?: string;
    suggestedFix?: string;
    level?: 'warning' | 'info';
  }
): ValidationWarning {
  const emoji = options?.level === 'info' ? 'ℹ️' : '⚠️';
  return {
    level: options?.level || 'warning',
    message: `${emoji} ${message}`,
    field: options?.field,
    entityType: entityType as any,
    entityId: options?.entityId,
    suggestedFix: options?.suggestedFix,
  };
}

/**
 * Create a validation info message
 */
export function createInfo(
  message: string,
  entityType: string,
  options?: {
    field?: string;
    entityId?: string;
    suggestedFix?: string;
  }
): ValidationWarning {
  return createWarning(message, entityType, { ...options, level: 'info' });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a string is a generic CTA label
 */
export function isGenericLabel(label: string): boolean {
  const genericLabels = [
    'click here',
    'click',
    'learn more',
    'submit',
    'go',
    'start',
    'begin',
    'next',
    'continue',
    'more info',
    'info',
  ];

  const normalized = label.toLowerCase().trim();
  // Only match exact labels, not if they contain generic words
  return genericLabels.some((generic) => normalized === generic);
}

/**
 * Check if keywords contain question words
 */
export function getQuestionWords(keywords: string[]): string[] {
  const questionWords = ['how', 'what', 'when', 'where', 'who', 'why', 'tell me', 'show me'];

  const found: string[] = [];
  keywords.forEach((keyword) => {
    const lower = keyword.toLowerCase();
    questionWords.forEach((qWord) => {
      if (lower.includes(qWord) && !found.includes(qWord)) {
        found.push(qWord);
      }
    });
  });

  return found;
}

/**
 * Calculate keyword overlap between two sets
 */
export function getKeywordOverlap(keywords1: string[], keywords2: string[]): string[] {
  const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
  const set2 = new Set(keywords2.map((k) => k.toLowerCase()));

  const overlap: string[] = [];
  set1.forEach((k) => {
    if (set2.has(k)) {
      overlap.push(k);
    }
  });

  return overlap;
}

/**
 * Check if URL uses HTTPS protocol
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Format a list of items for display
 */
export function formatList(items: string[], maxDisplay = 5): string {
  if (items.length === 0) return '';
  if (items.length <= maxDisplay) return items.join(', ');

  const displayed = items.slice(0, maxDisplay);
  const remaining = items.length - maxDisplay;
  return `${displayed.join(', ')}... and ${remaining} more`;
}
