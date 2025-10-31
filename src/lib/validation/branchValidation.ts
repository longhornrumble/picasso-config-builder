/**
 * Branch Validation
 * Validates conversation branch definitions
 */

import type { ConversationBranch, CTADefinition } from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import {
  messages,
  createError,
  createWarning,
} from './validationMessages';

// ============================================================================
// SINGLE BRANCH VALIDATION
// ============================================================================

/**
 * Validate a single conversation branch
 *
 * @param branch - The branch to validate
 * @param branchId - The branch identifier
 * @param allCTAs - All CTAs in the config (for reference validation)
 * @returns Validation result with errors and warnings
 */
export function validateBranch(
  branch: ConversationBranch,
  branchId: string,
  allCTAs: Record<string, CTADefinition>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate CTA references
  validateCTAReferences(branch, branchId, allCTAs, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'branch',
    entityId: branchId,
  };
}

// ============================================================================
// BULK BRANCH VALIDATION
// ============================================================================

/**
 * Validate all branches in the config
 *
 * @param branches - Record of all branches
 * @param ctas - Record of all CTAs
 * @returns Validation result
 */
export function validateBranches(
  branches: Record<string, ConversationBranch>,
  ctas: Record<string, CTADefinition>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  Object.entries(branches).forEach(([branchId, branch]) => {
    const result = validateBranch(branch, branchId, ctas);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'branch',
  };
}

// ============================================================================
// CTA REFERENCE VALIDATION
// ============================================================================

/**
 * Validate CTA references
 */
function validateCTAReferences(
  branch: ConversationBranch,
  branchId: string,
  allCTAs: Record<string, CTADefinition>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Must have primary CTA
  if (!branch.available_ctas.primary || branch.available_ctas.primary.trim() === '') {
    errors.push(
      createError(messages.branch.noPrimaryCTA, 'branch', {
        field: 'available_ctas.primary',
        entityId: branchId,
        suggestedFix: 'Select a primary CTA from the dropdown or create a new CTA first',
      })
    );
  } else {
    // Check if primary CTA exists
    const primaryCTA = allCTAs[branch.available_ctas.primary];
    if (!primaryCTA) {
      errors.push(
        createError(messages.branch.invalidPrimaryCTA(branch.available_ctas.primary), 'branch', {
          field: 'available_ctas.primary',
          entityId: branchId,
          suggestedFix: `Create a CTA with ID "${branch.available_ctas.primary}" or select a different CTA`,
        })
      );
    }
  }

  // Validate secondary CTAs
  if (branch.available_ctas.secondary) {
    branch.available_ctas.secondary.forEach((ctaId, index) => {
      const cta = allCTAs[ctaId];
      if (!cta) {
        errors.push(
          createError(messages.branch.invalidSecondaryCTA(ctaId, index), 'branch', {
            field: `available_ctas.secondary[${index}]`,
            entityId: branchId,
            suggestedFix: `Create a CTA with ID "${ctaId}" or remove this secondary CTA`,
          })
        );
      }
    });
  }

  // Warn if more than 3 total CTAs (1 primary + 2 secondary)
  const totalCTAs = 1 + (branch.available_ctas.secondary?.length || 0);
  if (totalCTAs > 3) {
    warnings.push(
      createWarning(messages.branch.tooManyCTAs(totalCTAs), 'branch', {
        field: 'available_ctas.secondary',
        entityId: branchId,
        suggestedFix: 'Remove secondary CTAs to keep total at 3 or fewer for better user experience',
      })
    );
  }
}
