/**
 * Form Validation
 * Validates conversational form definitions
 */

import type { ConversationalForm, Program, FormField } from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import { messages, createError, createWarning } from './validationMessages';

// ============================================================================
// SINGLE FORM VALIDATION
// ============================================================================

/**
 * Validate a single conversational form
 *
 * @param form - The form to validate
 * @param formId - The form identifier
 * @param allPrograms - All programs in the config (for reference validation)
 * @returns Validation result with errors and warnings
 */
export function validateForm(
  form: ConversationalForm,
  formId: string,
  allPrograms: Record<string, Program>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate program reference (required in v1.3+)
  validateProgramReference(form, formId, allPrograms, errors);

  // Validate fields
  validateFormFields(form, formId, errors, warnings);

  // Validate trigger phrases (warning if missing)
  validateTriggerPhrases(form, formId, warnings);

  // Quality checks
  validateFormQuality(form, formId, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'form',
    entityId: formId,
  };
}

// ============================================================================
// BULK FORM VALIDATION
// ============================================================================

/**
 * Validate all forms in the config
 *
 * @param forms - Record of all forms
 * @param programs - Record of all programs
 * @returns Validation result
 */
export function validateForms(
  forms: Record<string, ConversationalForm>,
  programs: Record<string, Program>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  Object.entries(forms).forEach(([formId, form]) => {
    const result = validateForm(form, formId, programs);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'form',
  };
}

// ============================================================================
// PROGRAM REFERENCE VALIDATION
// ============================================================================

/**
 * Validate that form has valid program reference
 */
function validateProgramReference(
  form: ConversationalForm,
  formId: string,
  allPrograms: Record<string, Program>,
  errors: ValidationError[]
): void {
  // Program is required in v1.3+
  if (!form.program || form.program.trim() === '') {
    errors.push(
      createError(messages.form.missingProgram, 'form', {
        field: 'program',
        entityId: formId,
        suggestedFix: 'Select a program from the dropdown or create a new program first',
      })
    );
    return;
  }

  // Check if program exists
  const program = allPrograms[form.program];
  if (!program) {
    errors.push(
      createError(messages.form.invalidProgram(form.program), 'form', {
        field: 'program',
        entityId: formId,
        suggestedFix: `Create a program with ID "${form.program}" or select a different program`,
      })
    );
  }
}

// ============================================================================
// FIELD VALIDATION
// ============================================================================

/**
 * Validate form fields
 */
function validateFormFields(
  form: ConversationalForm,
  formId: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Must have at least one field
  if (!form.fields || form.fields.length === 0) {
    errors.push(
      createError(messages.form.noFields, 'form', {
        field: 'fields',
        entityId: formId,
        suggestedFix: 'Add at least one field to collect user data',
      })
    );
    return;
  }

  // Check for duplicate field IDs
  validateUniqueFieldIds(form, formId, errors);

  // Validate individual fields
  form.fields.forEach((field, index) => {
    validateField(field, index, formId, errors, warnings);
  });

  // Warn if no required fields
  const hasRequiredField = form.fields.some((field) => field.required);
  if (!hasRequiredField) {
    warnings.push(
      createWarning(messages.form.noRequiredFields, 'form', {
        field: 'fields',
        entityId: formId,
        suggestedFix: 'Mark at least one field as required to ensure meaningful data collection',
      })
    );
  }
}

/**
 * Check for duplicate field IDs
 */
function validateUniqueFieldIds(
  form: ConversationalForm,
  formId: string,
  errors: ValidationError[]
): void {
  const fieldIds = new Set<string>();
  const duplicates = new Set<string>();

  form.fields.forEach((field, index) => {
    if (fieldIds.has(field.id)) {
      duplicates.add(field.id);
      errors.push(
        createError(messages.form.duplicateFieldId(field.id), 'form', {
          field: `fields[${index}].id`,
          entityId: formId,
          suggestedFix: 'Use a unique ID for each field',
        })
      );
    }
    fieldIds.add(field.id);
  });
}

/**
 * Validate a single field
 */
function validateField(
  field: FormField,
  index: number,
  formId: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Select fields must have options
  if (field.type === 'select' && (!field.options || field.options.length === 0)) {
    errors.push(
      createError(messages.form.selectNeedsOptions, 'form', {
        field: `fields[${index}].options`,
        entityId: formId,
        suggestedFix: 'Add at least one option for users to select from',
      })
    );
  }

  // Eligibility gates must have failure messages
  if (field.eligibility_gate && (!field.failure_message || field.failure_message.trim() === '')) {
    errors.push(
      createError(messages.form.eligibilityNeedsFailureMessage, 'form', {
        field: `fields[${index}].failure_message`,
        entityId: formId,
        suggestedFix: 'Provide a message to display when the user fails this eligibility check',
      })
    );
  }

  // Quality checks for field types
  if (field.type === 'email' && field.required) {
    // Email validation is typically handled by Zod schema, but we can suggest it
    warnings.push(
      createWarning(messages.form.missingEmailValidation, 'form', {
        field: `fields[${index}].type`,
        entityId: formId,
        level: 'info',
        suggestedFix: 'Ensure email format validation is enabled for this field',
      })
    );
  }

  if (field.type === 'phone' && field.required) {
    warnings.push(
      createWarning(messages.form.missingPhoneValidation, 'form', {
        field: `fields[${index}].type`,
        entityId: formId,
        level: 'info',
        suggestedFix: 'Consider adding phone format validation for better data quality',
      })
    );
  }
}

// ============================================================================
// TRIGGER PHRASE VALIDATION
// ============================================================================

/**
 * Validate trigger phrases (warning if missing)
 */
function validateTriggerPhrases(
  form: ConversationalForm,
  formId: string,
  warnings: ValidationWarning[]
): void {
  if (!form.trigger_phrases || form.trigger_phrases.length === 0) {
    warnings.push(
      createWarning(messages.form.noTriggerPhrases, 'form', {
        field: 'trigger_phrases',
        entityId: formId,
        suggestedFix: 'Add trigger phrases so users can activate this form directly through conversation',
      })
    );
  }
}

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

/**
 * Validate form quality (warnings, not errors)
 */
function validateFormQuality(
  form: ConversationalForm,
  formId: string,
  warnings: ValidationWarning[]
): void {
  // Warn if form has too many fields (>10)
  if (form.fields && form.fields.length > 10) {
    warnings.push(
      createWarning(messages.form.tooManyFields(form.fields.length), 'form', {
        field: 'fields',
        entityId: formId,
        suggestedFix:
          'Consider breaking this into multiple forms or removing non-essential fields to improve completion rates',
      })
    );
  }
}
