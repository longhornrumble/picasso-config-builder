/**
 * Relationship Validation
 * Validates cross-entity relationships and dependencies
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
} from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import { messages, createError, createWarning } from './validationMessages';

// ============================================================================
// RELATIONSHIP VALIDATION
// ============================================================================

/**
 * Validate relationships between entities
 *
 * Checks:
 * - Form → Program references
 * - CTA → Form references
 * - Branch → CTA references
 * - Circular dependencies
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @returns Validation result
 */
export function validateRelationships(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate form → program references
  validateFormProgramReferences(forms, programs, errors);

  // Validate CTA → form references
  validateCTAFormReferences(ctas, forms, errors);

  // Validate branch → CTA references
  validateBranchCTAReferences(branches, ctas, errors);

  // Detect circular dependencies
  detectCircularDependencies(forms, ctas, branches, warnings);

  // Check for orphaned entities
  checkOrphanedEntities(programs, forms, ctas, branches, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'relationship',
  };
}

// ============================================================================
// FORM → PROGRAM VALIDATION
// ============================================================================

/**
 * Validate that all forms reference existing programs
 */
function validateFormProgramReferences(
  forms: Record<string, ConversationalForm>,
  programs: Record<string, Program>,
  errors: ValidationError[]
): void {
  Object.entries(forms).forEach(([formId, form]) => {
    if (!form.program || form.program.trim() === '') {
      errors.push(
        createError(messages.form.missingProgram, 'relationship', {
          field: 'program',
          entityId: `form-${formId}`,
          suggestedFix: `Edit form "${formId}" and assign a program`,
        })
      );
      return;
    }

    // Check by key or by program_id field (in case key doesn't match program_id)
    const programExists = programs[form.program] ||
      Object.values(programs).some((p) => p.program_id === form.program);
    if (!programExists) {
      errors.push(
        createError(messages.form.invalidProgram(form.program), 'relationship', {
          field: 'program',
          entityId: `form-${formId}`,
          suggestedFix: `Create program "${form.program}" or edit form "${formId}" to reference an existing program`,
        })
      );
    }
  });
}

// ============================================================================
// CTA → FORM VALIDATION
// ============================================================================

/**
 * Validate that form CTAs reference existing forms
 */
function validateCTAFormReferences(
  ctas: Record<string, CTADefinition>,
  forms: Record<string, ConversationalForm>,
  errors: ValidationError[]
): void {
  Object.entries(ctas).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_form') {
      if (!cta.formId || cta.formId.trim() === '') {
        errors.push(
          createError(messages.cta.missingFormId, 'relationship', {
            field: 'formId',
            entityId: `cta-${ctaId}`,
            suggestedFix: `Edit CTA "${ctaId}" and select a form`,
          })
        );
        return;
      }

      if (!forms[cta.formId]) {
        errors.push(
          createError(messages.cta.invalidFormId(cta.formId), 'relationship', {
            field: 'formId',
            entityId: `cta-${ctaId}`,
            suggestedFix: `Create form "${cta.formId}" or edit CTA "${ctaId}" to reference an existing form`,
          })
        );
      }
    }
  });
}

// ============================================================================
// BRANCH → CTA VALIDATION
// ============================================================================

/**
 * Validate that branches reference existing CTAs
 */
function validateBranchCTAReferences(
  branches: Record<string, ConversationBranch>,
  ctas: Record<string, CTADefinition>,
  errors: ValidationError[]
): void {
  Object.entries(branches).forEach(([branchId, branch]) => {
    // Check primary CTA
    if (!branch.available_ctas.primary || branch.available_ctas.primary.trim() === '') {
      errors.push(
        createError(messages.branch.noPrimaryCTA, 'relationship', {
          field: 'available_ctas.primary',
          entityId: `branch-${branchId}`,
          suggestedFix: `Edit branch "${branchId}" and select a primary CTA`,
        })
      );
    } else if (!ctas[branch.available_ctas.primary]) {
      errors.push(
        createError(messages.branch.invalidPrimaryCTA(branch.available_ctas.primary), 'relationship', {
          field: 'available_ctas.primary',
          entityId: `branch-${branchId}`,
          suggestedFix: `Create CTA "${branch.available_ctas.primary}" or edit branch "${branchId}" to reference an existing CTA`,
        })
      );
    }

    // Check secondary CTAs
    branch.available_ctas.secondary?.forEach((ctaId, index) => {
      if (!ctas[ctaId]) {
        errors.push(
          createError(messages.branch.invalidSecondaryCTA(ctaId, index), 'relationship', {
            field: `available_ctas.secondary[${index}]`,
            entityId: `branch-${branchId}`,
            suggestedFix: `Create CTA "${ctaId}" or edit branch "${branchId}" to remove this secondary CTA`,
          })
        );
      }
    });
  });
}

// ============================================================================
// CIRCULAR DEPENDENCY DETECTION
// ============================================================================

/**
 * Detect circular dependencies
 *
 * Circular dependencies can occur when:
 * - Form trigger phrases match form confirmation messages
 * - Branch keywords trigger infinite loops
 */
function detectCircularDependencies(
  _forms: Record<string, ConversationalForm>,
  _ctas: Record<string, CTADefinition>,
  _branches: Record<string, ConversationBranch>,
  _warnings: ValidationWarning[]
): void {
  // Trigger phrases removed - forms now use explicit CTA routing
  // No validation needed for trigger phrase overlaps
}

// ============================================================================
// ORPHANED ENTITY DETECTION
// ============================================================================

/**
 * Check for orphaned entities (not referenced by any other entity)
 */
function checkOrphanedEntities(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  warnings: ValidationWarning[]
): void {
  // Check for orphaned programs (not used by any form)
  const usedProgramIds = new Set<string>();
  Object.values(forms).forEach((form) => {
    if (form.program) usedProgramIds.add(form.program);
  });

  Object.entries(programs).forEach(([programId]) => {
    if (!usedProgramIds.has(programId)) {
      warnings.push(
        createWarning(
          messages.relationship.orphanedEntity('Program', programId),
          'relationship',
          {
            entityId: `program-${programId}`,
            level: 'info',
            suggestedFix: 'Assign this program to a form or remove it if no longer needed',
          }
        )
      );
    }
  });

  // Check for orphaned CTAs (not used by any branch)
  const usedCTAIds = new Set<string>();
  Object.values(branches).forEach((branch) => {
    if (branch.available_ctas.primary) usedCTAIds.add(branch.available_ctas.primary);
    branch.available_ctas.secondary?.forEach((ctaId) => usedCTAIds.add(ctaId));
  });

  Object.entries(ctas).forEach(([ctaId]) => {
    if (!usedCTAIds.has(ctaId)) {
      warnings.push(
        createWarning(messages.relationship.orphanedEntity('CTA', ctaId), 'relationship', {
          entityId: `cta-${ctaId}`,
          level: 'info',
          suggestedFix: 'Add this CTA to a branch or remove it if no longer needed',
        })
      );
    }
  });
}
