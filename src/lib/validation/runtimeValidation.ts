/**
 * Runtime Validation
 * Validates runtime behavior and configuration alignment
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
} from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import { messages, createWarning } from './validationMessages';

// ============================================================================
// RUNTIME BEHAVIOR VALIDATION
// ============================================================================

/**
 * Validate runtime behavior and configuration alignment
 *
 * Checks:
 * - Program-based filtering compatibility
 * - Max 3 CTAs per branch constraint
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @returns Validation result with warnings
 */
export function validateRuntimeBehavior(
  _programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  _ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>
): ValidationResult {
  const errors: ValidationError[] = []; // Runtime validation typically only produces warnings
  const warnings: ValidationWarning[] = [];

  // Validate program-based filtering
  validateProgramFiltering(forms, warnings);

  // Validate max 3 CTAs constraint
  validateMaxCTAsConstraint(branches, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'runtime',
  };
}

// ============================================================================
// PROGRAM-BASED FILTERING VALIDATION
// ============================================================================

/**
 * Validate that forms have programs for proper filtering after completion
 */
function validateProgramFiltering(
  forms: Record<string, ConversationalForm>,
  warnings: ValidationWarning[]
): void {
  Object.entries(forms).forEach(([formId, form]) => {
    if (!form.program || form.program.trim() === '') {
      warnings.push(
        createWarning(messages.runtime.formNeedsProgram, 'runtime', {
          field: 'program',
          entityId: `form-${formId}`,
          suggestedFix:
            'Assign a program to enable filtering of completed forms by program match',
        })
      );
    }
  });
}

// ============================================================================
// MAX CTAs CONSTRAINT VALIDATION
// ============================================================================

/**
 * Validate that branches respect the max 3 CTAs constraint
 */
function validateMaxCTAsConstraint(
  branches: Record<string, ConversationBranch>,
  warnings: ValidationWarning[]
): void {
  Object.entries(branches).forEach(([branchId, branch]) => {
    const totalCTAs = 1 + (branch.available_ctas.secondary?.length || 0);

    if (totalCTAs > 3) {
      warnings.push(
        createWarning(messages.branch.tooManyCTAs(totalCTAs), 'runtime', {
          field: 'available_ctas',
          entityId: `branch-${branchId}`,
          suggestedFix:
            'Runtime limits display to 3 buttons (1 primary + 2 secondary). Additional CTAs will not be shown to users.',
        })
      );
    }
  });
}

// ============================================================================
// ADDITIONAL RUNTIME CHECKS
// ============================================================================

/**
 * Validate form post-submission actions for runtime compatibility
 */
export function validatePostSubmissionActions(
  forms: Record<string, ConversationalForm>,
  warnings: ValidationWarning[]
): void {
  Object.entries(forms).forEach(([formId, form]) => {
    if (!form.post_submission?.actions) return;

    // Warn if more than 3 post-submission actions
    if (form.post_submission.actions.length > 3) {
      warnings.push(
        createWarning(
          `Form has ${form.post_submission.actions.length} post-submission actions. Only first 3 will be shown.`,
          'runtime',
          {
            field: 'post_submission.actions',
            entityId: `form-${formId}`,
            suggestedFix: 'Limit to 3 most important actions for better user experience',
          }
        )
      );
    }

    // Check that start_form actions reference valid forms
    form.post_submission.actions.forEach((action, index) => {
      if (action.action === 'start_form' && action.formId) {
        const referencedForm = forms[action.formId];
        if (!referencedForm) {
          warnings.push(
            createWarning(
              `Post-submission action ${index + 1} references non-existent form "${action.formId}"`,
              'runtime',
              {
                field: `post_submission.actions[${index}].formId`,
                entityId: `form-${formId}`,
                suggestedFix: `Create form "${action.formId}" or remove this post-submission action`,
              }
            )
          );
        }
      }
    });
  });
}
