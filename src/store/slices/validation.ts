/**
 * Validation Slice
 * Tracks validation errors and warnings across the configuration
 */

import type { SliceCreator, ValidationSlice, ValidationError } from '../types';

export const createValidationSlice: SliceCreator<ValidationSlice> = (set, get) => ({
  // State
  errors: {},
  warnings: {},
  isValid: true,
  lastValidated: null,

  // Actions
  setErrors: (entityId: string, errors: ValidationError[]) => {
    set((state) => {
      if (errors.length > 0) {
        state.validation.errors[entityId] = errors;
        state.validation.isValid = false;
      } else {
        delete state.validation.errors[entityId];
        // Recalculate isValid
        state.validation.isValid = Object.keys(state.validation.errors).length === 0;
      }
    });
  },

  setWarnings: (entityId: string, warnings: ValidationError[]) => {
    set((state) => {
      if (warnings.length > 0) {
        state.validation.warnings[entityId] = warnings;
      } else {
        delete state.validation.warnings[entityId];
      }
    });
  },

  clearErrors: (entityId: string) => {
    set((state) => {
      delete state.validation.errors[entityId];
      // Recalculate isValid
      state.validation.isValid = Object.keys(state.validation.errors).length === 0;
    });
  },

  clearWarnings: (entityId: string) => {
    set((state) => {
      delete state.validation.warnings[entityId];
    });
  },

  clearAll: () => {
    set((state) => {
      state.validation.errors = {};
      state.validation.warnings = {};
      state.validation.isValid = true;
      state.validation.lastValidated = null;
    });
  },

  validateAll: async () => {
    const state = get();
    const errors: Record<string, ValidationError[]> = {};
    const warnings: Record<string, ValidationError[]> = {};

    // Validate programs
    Object.entries(state.programs.programs).forEach(([programId, program]) => {
      const programErrors = validateProgram(program);
      if (programErrors.length > 0) {
        errors[`program-${programId}`] = programErrors;
      }
    });

    // Validate forms
    Object.entries(state.forms.forms).forEach(([formId, form]) => {
      const formErrors = validateForm(form, state);
      if (formErrors.errors.length > 0) {
        errors[`form-${formId}`] = formErrors.errors;
      }
      if (formErrors.warnings.length > 0) {
        warnings[`form-${formId}`] = formErrors.warnings;
      }
    });

    // Validate CTAs
    Object.entries(state.ctas.ctas).forEach(([ctaId, cta]) => {
      const ctaErrors = validateCTA(cta, state);
      if (ctaErrors.length > 0) {
        errors[`cta-${ctaId}`] = ctaErrors;
      }
    });

    // Validate branches
    Object.entries(state.branches.branches).forEach(([branchId, branch]) => {
      const branchErrors = validateBranch(branch, state);
      if (branchErrors.length > 0) {
        errors[`branch-${branchId}`] = branchErrors;
      }
    });

    // Update validation state
    set((state) => {
      state.validation.errors = errors;
      state.validation.warnings = warnings;
      state.validation.isValid = Object.keys(errors).length === 0;
      state.validation.lastValidated = Date.now();
    });

    // Show toast with results
    const errorCount = Object.keys(errors).length;
    const warningCount = Object.keys(warnings).length;

    if (errorCount > 0) {
      state.ui.addToast({
        type: 'error',
        message: `Validation failed: ${errorCount} error(s) found`,
      });
    } else if (warningCount > 0) {
      state.ui.addToast({
        type: 'warning',
        message: `Validation passed with ${warningCount} warning(s)`,
      });
    } else {
      state.ui.addToast({
        type: 'success',
        message: 'Validation passed successfully',
      });
    }
  },

  // Selectors
  getErrorsForEntity: (entityId: string) => {
    return get().validation.errors[entityId] || [];
  },

  getWarningsForEntity: (entityId: string) => {
    return get().validation.warnings[entityId] || [];
  },

  hasErrors: () => {
    return Object.keys(get().validation.errors).length > 0;
  },

  hasWarnings: () => {
    return Object.keys(get().validation.warnings).length > 0;
  },
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

import type { Program, ConversationalForm, CTADefinition, ConversationBranch } from '@/types/config';
import type { ConfigBuilderState } from '../types';

/**
 * Validate a program
 */
function validateProgram(program: Program): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!program.program_id || program.program_id.trim() === '') {
    errors.push({
      field: 'program_id',
      message: 'Program ID is required',
      severity: 'error',
    });
  }

  if (!program.program_name || program.program_name.trim() === '') {
    errors.push({
      field: 'program_name',
      message: 'Program name is required',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate a form
 */
function validateForm(
  form: ConversationalForm,
  state: ConfigBuilderState
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!form.form_id || form.form_id.trim() === '') {
    errors.push({
      field: 'form_id',
      message: 'Form ID is required',
      severity: 'error',
    });
  }

  if (!form.title || form.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Form title is required',
      severity: 'error',
    });
  }

  if (!form.program || form.program.trim() === '') {
    errors.push({
      field: 'program',
      message: 'Program reference is required',
      severity: 'error',
    });
  } else {
    // Check if program exists
    const program = state.programs.programs[form.program];
    if (!program) {
      errors.push({
        field: 'program',
        message: `Referenced program "${form.program}" does not exist`,
        severity: 'error',
      });
    }
  }

  // Fields validation
  if (!form.fields || form.fields.length === 0) {
    warnings.push({
      field: 'fields',
      message: 'Form has no fields defined',
      severity: 'warning',
    });
  } else {
    form.fields.forEach((field, index) => {
      if (!field.id || field.id.trim() === '') {
        errors.push({
          field: `fields[${index}].id`,
          message: `Field ${index + 1}: ID is required`,
          severity: 'error',
        });
      }

      if (!field.label || field.label.trim() === '') {
        errors.push({
          field: `fields[${index}].label`,
          message: `Field ${index + 1}: Label is required`,
          severity: 'error',
        });
      }

      if (!field.prompt || field.prompt.trim() === '') {
        errors.push({
          field: `fields[${index}].prompt`,
          message: `Field ${index + 1}: Prompt is required`,
          severity: 'error',
        });
      }

      // Validate select field options
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push({
          field: `fields[${index}].options`,
          message: `Field ${index + 1}: Select field must have options`,
          severity: 'error',
        });
      }
    });
  }

  // Trigger phrases validation
  if (!form.trigger_phrases || form.trigger_phrases.length === 0) {
    warnings.push({
      field: 'trigger_phrases',
      message: 'Form has no trigger phrases defined',
      severity: 'warning',
    });
  }

  return { errors, warnings };
}

/**
 * Validate a CTA
 */
function validateCTA(cta: CTADefinition, state: ConfigBuilderState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!cta.label || cta.label.trim() === '') {
    errors.push({
      field: 'label',
      message: 'CTA label is required',
      severity: 'error',
    });
  }

  // Action-specific validation
  switch (cta.action) {
    case 'start_form':
      if (!cta.formId) {
        errors.push({
          field: 'formId',
          message: 'Form ID is required for start_form action',
          severity: 'error',
        });
      } else {
        const form = state.forms.forms[cta.formId];
        if (!form) {
          errors.push({
            field: 'formId',
            message: `Referenced form "${cta.formId}" does not exist`,
            severity: 'error',
          });
        }
      }
      break;

    case 'external_link':
      if (!cta.url) {
        errors.push({
          field: 'url',
          message: 'URL is required for external_link action',
          severity: 'error',
        });
      } else {
        try {
          new URL(cta.url);
        } catch {
          errors.push({
            field: 'url',
            message: 'Invalid URL format',
            severity: 'error',
          });
        }
      }
      break;

    case 'send_query':
      if (!cta.query) {
        errors.push({
          field: 'query',
          message: 'Query is required for send_query action',
          severity: 'error',
        });
      }
      break;

    case 'show_info':
      if (!cta.prompt) {
        errors.push({
          field: 'prompt',
          message: 'Prompt is required for show_info action',
          severity: 'error',
        });
      }
      break;
  }

  return errors;
}

/**
 * Validate a branch
 */
function validateBranch(branch: ConversationBranch, state: ConfigBuilderState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!branch.detection_keywords || branch.detection_keywords.length === 0) {
    errors.push({
      field: 'detection_keywords',
      message: 'Branch must have at least one detection keyword',
      severity: 'error',
    });
  }

  if (!branch.available_ctas.primary) {
    errors.push({
      field: 'available_ctas.primary',
      message: 'Branch must have a primary CTA',
      severity: 'error',
    });
  } else {
    const cta = state.ctas.ctas[branch.available_ctas.primary];
    if (!cta) {
      errors.push({
        field: 'available_ctas.primary',
        message: `Referenced CTA "${branch.available_ctas.primary}" does not exist`,
        severity: 'error',
      });
    }
  }

  // Validate secondary CTAs
  branch.available_ctas.secondary.forEach((ctaId, index) => {
    const cta = state.ctas.ctas[ctaId];
    if (!cta) {
      errors.push({
        field: `available_ctas.secondary[${index}]`,
        message: `Referenced CTA "${ctaId}" does not exist`,
        severity: 'error',
      });
    }
  });

  return errors;
}
