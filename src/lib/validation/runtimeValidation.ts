/**
 * Runtime Validation
 * Validates runtime behavior and configuration alignment
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  CardInventory,
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
 * - Card inventory alignment with programs
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @param cardInventory - Card inventory (optional)
 * @returns Validation result with warnings
 */
export function validateRuntimeBehavior(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  _ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): ValidationResult {
  const errors: ValidationError[] = []; // Runtime validation typically only produces warnings
  const warnings: ValidationWarning[] = [];

  // Validate program-based filtering
  validateProgramFiltering(forms, warnings);

  // Validate max 3 CTAs constraint
  validateMaxCTAsConstraint(branches, warnings);

  // Validate card inventory alignment
  if (cardInventory) {
    validateCardInventoryAlignment(forms, programs, cardInventory, warnings);
  }

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
// CARD INVENTORY ALIGNMENT VALIDATION
// ============================================================================

/**
 * Validate card inventory alignment with programs and forms
 */
function validateCardInventoryAlignment(
  forms: Record<string, ConversationalForm>,
  _programs: Record<string, Program>,
  cardInventory: CardInventory,
  warnings: ValidationWarning[]
): void {
  // Check if card inventory program cards match form programs
  const cardProgramIds = new Set(cardInventory.program_cards?.map((card) => card.name) || []);
  const formProgramIds = new Set(
    Object.values(forms)
      .map((form) => form.program)
      .filter(Boolean)
  );

  // Warn if forms reference programs not in card inventory
  formProgramIds.forEach((formProgram) => {
    if (!cardProgramIds.has(formProgram)) {
      warnings.push(
        createWarning(messages.runtime.cardInventoryMismatch(formProgram), 'runtime', {
          field: 'program_cards',
          suggestedFix: `Add a program card for "${formProgram}" in the card inventory, or update forms to use existing program cards`,
          level: 'info',
        })
      );
    }
  });

  // Check qualification_first strategy requirements
  if (cardInventory.strategy === 'qualification_first') {
    if (!cardInventory.requirements || cardInventory.requirements.length === 0) {
      warnings.push(
        createWarning(messages.runtime.qualificationFirstNoRequirements, 'runtime', {
          field: 'requirements',
          suggestedFix:
            'Add requirements to card inventory or change strategy to "exploration_first"',
        })
      );
    }
  }
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
