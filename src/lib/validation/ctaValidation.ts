/**
 * CTA Validation
 * Validates call-to-action definitions
 */

import type { CTADefinition, ConversationalForm } from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import {
  messages,
  createError,
  createWarning,
  isGenericLabel,
  isHttpsUrl,
} from './validationMessages';

// ============================================================================
// SINGLE CTA VALIDATION
// ============================================================================

/**
 * Validate a single CTA definition
 *
 * @param cta - The CTA to validate
 * @param ctaId - The CTA identifier
 * @param allForms - All forms in the config (for reference validation)
 * @returns Validation result with errors and warnings
 */
export function validateCTA(
  cta: CTADefinition,
  ctaId: string,
  allForms: Record<string, ConversationalForm>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate action-specific required fields
  validateActionRequirements(cta, ctaId, allForms, errors, warnings);

  // Quality checks (warnings)
  validateCTAQuality(cta, ctaId, allForms, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'cta',
    entityId: ctaId,
  };
}

// ============================================================================
// BULK CTA VALIDATION
// ============================================================================

/**
 * Validate all CTAs in the config
 *
 * @param ctas - Record of all CTAs
 * @param forms - Record of all forms
 * @returns Validation result
 */
export function validateCTAs(
  ctas: Record<string, CTADefinition>,
  forms: Record<string, ConversationalForm>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  Object.entries(ctas).forEach(([ctaId, cta]) => {
    const result = validateCTA(cta, ctaId, forms);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'cta',
  };
}

// ============================================================================
// ACTION REQUIREMENT VALIDATION
// ============================================================================

/**
 * Validate that CTAs have required fields based on action type
 */
function validateActionRequirements(
  cta: CTADefinition,
  ctaId: string,
  allForms: Record<string, ConversationalForm>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  switch (cta.action) {
    case 'start_form':
      validateStartFormAction(cta, ctaId, allForms, errors, warnings);
      break;

    case 'external_link':
      validateExternalLinkAction(cta, ctaId, errors);
      break;

    case 'send_query':
      validateSendQueryAction(cta, ctaId, errors);
      break;

    case 'show_info':
      validateShowInfoAction(cta, ctaId, errors, warnings);
      break;
  }
}

/**
 * Validate start_form action requirements
 */
function validateStartFormAction(
  cta: CTADefinition,
  ctaId: string,
  allForms: Record<string, ConversationalForm>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Must have formId
  if (!cta.formId || cta.formId.trim() === '') {
    errors.push(
      createError(messages.cta.missingFormId, 'cta', {
        field: 'formId',
        entityId: ctaId,
        suggestedFix: 'Select a form from the dropdown or create a new form first',
      })
    );
    return;
  }

  // Check if form exists
  const form = allForms[cta.formId];
  if (!form) {
    errors.push(
      createError(messages.cta.invalidFormId(cta.formId), 'cta', {
        field: 'formId',
        entityId: ctaId,
        suggestedFix: `Create a form with ID "${cta.formId}" or select a different form`,
      })
    );
    return;
  }

  // Warn if form doesn't have program assigned
  if (!form.program || form.program.trim() === '') {
    warnings.push(
      createWarning(messages.cta.formWithoutProgram(cta.formId), 'cta', {
        field: 'formId',
        entityId: ctaId,
        suggestedFix: `Edit form "${cta.formId}" and assign a program`,
      })
    );
  }
}

/**
 * Validate external_link action requirements
 */
function validateExternalLinkAction(
  cta: CTADefinition,
  ctaId: string,
  errors: ValidationError[]
): void {
  // Must have url
  if (!cta.url || cta.url.trim() === '') {
    errors.push(
      createError(messages.cta.missingUrl, 'cta', {
        field: 'url',
        entityId: ctaId,
        suggestedFix: 'Enter a complete URL including https://',
      })
    );
    return;
  }

  // URL should use HTTPS
  if (!isHttpsUrl(cta.url)) {
    errors.push(
      createError(messages.cta.invalidUrl, 'cta', {
        field: 'url',
        entityId: ctaId,
        suggestedFix: 'Use https:// instead of http:// for security',
      })
    );
  }
}

/**
 * Validate send_query action requirements
 */
function validateSendQueryAction(
  cta: CTADefinition,
  ctaId: string,
  errors: ValidationError[]
): void {
  if (!cta.query || cta.query.trim() === '') {
    errors.push(
      createError(messages.cta.missingQuery, 'cta', {
        field: 'query',
        entityId: ctaId,
        suggestedFix: 'Enter the query text that will be sent to Bedrock',
      })
    );
  }
}

/**
 * Validate show_info action requirements
 */
function validateShowInfoAction(
  cta: CTADefinition,
  ctaId: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!cta.prompt || cta.prompt.trim() === '') {
    errors.push(
      createError(messages.cta.missingPrompt, 'cta', {
        field: 'prompt',
        entityId: ctaId,
        suggestedFix: 'Enter a specific question or request for Bedrock to answer',
      })
    );
    return;
  }

  // Warn if prompt is vague
  const vaguePatterns = [
    /^(more|info|tell me more|learn more)$/i,
    /^what is this\??$/i,
    /^help$/i,
  ];

  if (vaguePatterns.some((pattern) => pattern.test(cta.prompt!.trim()))) {
    warnings.push(
      createWarning(messages.cta.vaguePrompt, 'cta', {
        field: 'prompt',
        entityId: ctaId,
        suggestedFix:
          'Use specific prompts like "What are the eligibility requirements for this program?" instead of generic phrases',
      })
    );
  }
}

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

/**
 * Validate CTA quality (warnings, not errors)
 */
function validateCTAQuality(
  cta: CTADefinition,
  ctaId: string,
  _allForms: Record<string, ConversationalForm>,
  _errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check button text quality
  if (isGenericLabel(cta.label)) {
    warnings.push(
      createWarning(messages.cta.genericLabel, 'cta', {
        field: 'label',
        entityId: ctaId,
        suggestedFix: messages.cta.genericLabelExamples,
      })
    );
  }
}
