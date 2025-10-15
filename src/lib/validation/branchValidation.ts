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
  getQuestionWords,
  getKeywordOverlap,
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
 * @param allBranches - All branches in the config (for overlap detection)
 * @returns Validation result with errors and warnings
 */
export function validateBranch(
  branch: ConversationBranch,
  branchId: string,
  allCTAs: Record<string, CTADefinition>,
  allBranches: Record<string, ConversationBranch>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate detection keywords
  validateKeywords(branch, branchId, allBranches, errors, warnings);

  // Validate CTA references
  validateCTAReferences(branch, branchId, allCTAs, errors, warnings);

  // Quality checks
  validateBranchQuality(branch, branchId, warnings);

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
    const result = validateBranch(branch, branchId, ctas, branches);
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
// KEYWORD VALIDATION
// ============================================================================

/**
 * Validate detection keywords
 */
function validateKeywords(
  branch: ConversationBranch,
  branchId: string,
  allBranches: Record<string, ConversationBranch>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Must have at least one keyword
  if (!branch.detection_keywords || branch.detection_keywords.length === 0) {
    errors.push(
      createError(messages.branch.noKeywords, 'branch', {
        field: 'detection_keywords',
        entityId: branchId,
        suggestedFix:
          'Add keywords that match anticipated Bedrock responses for this conversation topic',
      })
    );
    return;
  }

  // Check for question words (warning)
  const questionWords = getQuestionWords(branch.detection_keywords);
  if (questionWords.length > 0) {
    warnings.push(
      createWarning(messages.branch.keywordsLookLikeQueries, 'branch', {
        field: 'detection_keywords',
        entityId: branchId,
        suggestedFix: messages.branch.questionWords(questionWords),
      })
    );
  }

  // Check for keyword overlap with other branches
  Object.entries(allBranches).forEach(([otherBranchId, otherBranch]) => {
    if (otherBranchId === branchId) return; // Skip self

    const overlap = getKeywordOverlap(branch.detection_keywords, otherBranch.detection_keywords);

    // Warn if significant overlap (>30% of keywords or >2 keywords)
    const overlapRatio = overlap.length / Math.min(branch.detection_keywords.length, otherBranch.detection_keywords.length);

    if (overlap.length > 2 || overlapRatio > 0.3) {
      warnings.push(
        createWarning(messages.branch.keywordOverlap(otherBranchId, overlap), 'branch', {
          field: 'detection_keywords',
          entityId: branchId,
          suggestedFix:
            'Use more specific keywords to reduce ambiguity in branch detection',
        })
      );
    }
  });
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

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

/**
 * Validate branch quality (warnings, not errors)
 */
function validateBranchQuality(
  _branch: ConversationBranch,
  branchId: string,
  warnings: ValidationWarning[]
): void {
  // Add priority suggestion hint
  warnings.push(
    createWarning(messages.branch.prioritySuggestion, 'branch', {
      field: 'detection_keywords',
      entityId: branchId,
      level: 'info',
      suggestedFix:
        'Order branches so that broader topics (e.g., "housing", "healthcare") appear first, and specific programs appear later',
    })
  );
}
