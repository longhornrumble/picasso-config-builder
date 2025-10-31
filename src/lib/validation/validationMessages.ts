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
    missingFormId: 'Form ID is required when action is "start_form"\n→ Fix: Select a form from the dropdown',
    invalidFormId: (formId: string) => `Referenced form "${formId}" does not exist\n→ Fix: Select an existing form or create the form first`,
    missingUrl: 'URL is required when action is "external_link"\n→ Fix: Enter a valid HTTPS URL (e.g., https://example.com)',
    invalidUrl: 'URL must use https:// protocol\n→ Fix: Change http:// to https:// or use a secure URL',
    missingQuery: 'Query is required when action is "send_query"\n→ Fix: Enter the query text to send to the assistant',
    missingPrompt: 'Prompt is required when action is "show_info"\n→ Fix: Enter what information should be shown to the user',
    genericLabel: 'Button text is generic. Consider using more specific, actionable text\n→ Suggestion: Use action verbs like "Apply Now", "Get Started", "Schedule Visit"',
    genericLabelExamples: 'Generic labels like "Click Here", "Learn More", or "Submit" reduce user engagement\n→ Better: "Apply for Love Box", "Schedule a Tour", "Download Guide"',
    vaguePrompt: 'Info CTA prompts should be specific questions or requests, not vague or generic phrases\n→ Fix: Be specific about what information to show (e.g., "Tell me about volunteer requirements")',
    formWithoutProgram: (formId: string) =>
      `Form "${formId}" referenced by this CTA doesn't have a program assigned\n→ Fix: Open the form and assign it to a program`,
  },

  // Form Messages
  form: {
    missingProgram: 'Program reference is required\n→ Fix: Select a program from the dropdown or create one first',
    invalidProgram: (programId: string) => `Referenced program "${programId}" does not exist\n→ Fix: Select an existing program or create the program first`,
    noFields: 'Form must have at least one field\n→ Fix: Click "Add Field" to create form fields',
    noTriggerPhrases: 'Form has no trigger phrases - users can only access it via CTA\n→ Suggestion: Add trigger phrases like "apply", "sign up", or "register" so users can activate the form conversationally',
    tooManyFields: (count: number) =>
      `Form has too many fields (${count} total). Long forms (>10 fields) may reduce completion rates\n→ Suggestion: Consider breaking into multiple shorter forms or removing optional fields`,
    missingEmailValidation: 'Email fields should have email format validation\n→ Fix: Enable email validation in the field settings',
    missingPhoneValidation: 'Phone fields should have phone format validation\n→ Fix: Enable phone validation in the field settings',
    noRequiredFields: 'Form should have at least one required field\n→ Suggestion: Mark critical fields as required to ensure you collect essential information',
    selectNeedsOptions: 'Select fields must have at least one option\n→ Fix: Add options to the select field (e.g., "Option 1", "Option 2")',
    duplicateFieldId: (id: string) => `Duplicate field ID: "${id}"\n→ Fix: This is a system error - try re-creating the field or contact support`,
    eligibilityNeedsFailureMessage: 'Eligibility gate fields must have a failure message\n→ Fix: Enter a message to show when eligibility requirements are not met',
  },

  // Branch Messages
  branch: {
    noKeywords: 'Branch must have at least one detection keyword\n→ Fix: Add keywords that identify this topic (e.g., "volunteer", "donate", "contact")',
    noPrimaryCTA: 'Branch must have a primary CTA\n→ Fix: Select a primary CTA from the dropdown',
    invalidPrimaryCTA: (ctaId: string) => `Referenced CTA "${ctaId}" does not exist\n→ Fix: Select an existing CTA or create the CTA first`,
    invalidSecondaryCTA: (ctaId: string, index: number) =>
      `Secondary CTA ${index + 1} "${ctaId}" does not exist\n→ Fix: Remove this CTA or select an existing one`,
    tooManyCTAs: (count: number) =>
      `Branch has too many CTAs (${count} total). Runtime limits to 3 buttons - only first 3 will be shown\n→ Fix: Remove CTAs or prioritize the most important 3`,
    keywordsLookLikeQueries:
      'Keywords contain question words. Detection keywords should match anticipated Bedrock responses, not user queries\n→ Fix: Use topic words instead (e.g., "volunteer opportunities" not "how to volunteer")',
    questionWords: (words: string[]) => `Found question words: ${words.join(', ')}\n→ Fix: Remove question words and use declarative topic keywords`,
    keywordOverlap: (otherBranchId: string, overlap: string[]) =>
      `Keywords overlap significantly with branch "${otherBranchId}": ${overlap.slice(0, 3).join(', ')}${overlap.length > 3 ? '...' : ''}\n→ Fix: Use unique keywords or adjust priorities to control which branch triggers first`,
    prioritySuggestion: 'Broader topics should have higher priority (sorted first), specific programs should have lower priority\n→ Tip: Priority controls which branch triggers when keywords match multiple branches',
  },

  // Relationship Messages
  relationship: {
    circularDependency: (entities: string[]) => `Circular dependency detected: ${entities.join(' → ')}\n→ Fix: Remove one of the references to break the circular loop`,
    orphanedEntity: (entityType: string, entityId: string) =>
      `Orphaned ${entityType} "${entityId}" is not referenced by any other entity\n→ Suggestion: Either use this in a CTA/branch or delete it if unused`,
  },

  // Runtime Messages
  runtime: {
    formNeedsProgram:
      'Form should have a program assigned for proper filtering after completion\n→ Fix: Assign this form to a program to enable program-specific filtering',
    cardInventoryMismatch: (formProgram: string) =>
      `Form references program "${formProgram}" which doesn't exist in card_inventory.program_cards\n→ Fix: Create a program card for this program or change the form's program reference`,
    qualificationFirstNoRequirements:
      'Card inventory uses qualification_first strategy but has no requirements defined\n→ Fix: Add requirements to the card inventory or change strategy to "programs_first"',
  },

  // General Messages
  general: {
    required: (field: string) => `${field} is required\n→ Fix: Enter a value for this field`,
    tooLong: (field: string, max: number) => `${field} must be ${max} characters or less\n→ Fix: Shorten the text to fit the limit`,
    tooShort: (field: string, min: number) => `${field} must be at least ${min} characters\n→ Fix: Add more detail to meet the minimum length`,
    invalid: (field: string) => `${field} is invalid\n→ Fix: Check the format and correct any errors`,
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
    if (!keyword) return; // Skip null/undefined/empty keywords
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
  const set1 = new Set(keywords1.filter((k) => k).map((k) => k.toLowerCase()));
  const set2 = new Set(keywords2.filter((k) => k).map((k) => k.toLowerCase()));

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
