/**
 * Validation Engine
 * Main entry point for comprehensive configuration validation
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  CardInventory,
} from '@/types/config';
import type {
  ValidationError,
  ValidationWarning,
  ConfigValidationResult,
  EntityValidationResult,
} from './types';

// Import validation functions
import { validateCTA, validateCTAs } from './ctaValidation';
import { validateForm, validateForms } from './formValidation';
import { validateBranch, validateBranches } from './branchValidation';
import { validateRelationships } from './relationshipValidation';
import {
  validateRuntimeBehavior,
  validatePostSubmissionActions,
} from './runtimeValidation';

// Re-export types and utilities
export * from './types';
export * from './validationMessages';
export { validateCTA, validateCTAs } from './ctaValidation';
export { validateForm, validateForms } from './formValidation';
export { validateBranch, validateBranches } from './branchValidation';
export { validateRelationships } from './relationshipValidation';
export { validateRuntimeBehavior } from './runtimeValidation';

// ============================================================================
// CONFIG VALIDATION (From Store State)
// ============================================================================

/**
 * Validate configuration from store state
 *
 * This is the main validation function that validates the entire configuration
 * from the Zustand store state.
 *
 * @param state - The store state containing all entities
 * @returns Comprehensive validation result
 */
export function validateConfigFromStore(state: {
  programs: { programs: Record<string, Program> };
  forms: { forms: Record<string, ConversationalForm> };
  ctas: { ctas: Record<string, CTADefinition> };
  branches: { branches: Record<string, ConversationBranch> };
  cardInventory: { cardInventory: CardInventory | null };
}): ConfigValidationResult {
  return validateConfig(
    state.programs.programs,
    state.forms.forms,
    state.ctas.ctas,
    state.branches.branches,
    state.cardInventory.cardInventory
  );
}

// ============================================================================
// FULL CONFIG VALIDATION
// ============================================================================

/**
 * Validate entire configuration
 *
 * Runs all validation checks:
 * 1. Individual entity validation (Programs, Forms, CTAs, Branches)
 * 2. Relationship validation (cross-entity references)
 * 3. Runtime behavior validation
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @param cardInventory - Card inventory (optional)
 * @returns Comprehensive validation result
 */
export function validateConfig(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): ConfigValidationResult {
  const entityResults: EntityValidationResult[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  // Validate individual entities
  // Forms
  const formsResult = validateForms(forms, programs);
  allErrors.push(...formsResult.errors);
  allWarnings.push(...formsResult.warnings);
  Object.keys(forms).forEach((formId) => {
    const result = validateForm(forms[formId], formId, programs);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      entityResults.push({
        entityId: formId,
        entityType: 'form',
        result,
      });
    }
  });

  // CTAs
  const ctasResult = validateCTAs(ctas, forms);
  allErrors.push(...ctasResult.errors);
  allWarnings.push(...ctasResult.warnings);
  Object.keys(ctas).forEach((ctaId) => {
    const result = validateCTA(ctas[ctaId], ctaId, forms);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      entityResults.push({
        entityId: ctaId,
        entityType: 'cta',
        result,
      });
    }
  });

  // Branches
  const branchesResult = validateBranches(branches, ctas);
  allErrors.push(...branchesResult.errors);
  allWarnings.push(...branchesResult.warnings);
  Object.keys(branches).forEach((branchId) => {
    const result = validateBranch(branches[branchId], branchId, ctas, branches);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      entityResults.push({
        entityId: branchId,
        entityType: 'branch',
        result,
      });
    }
  });

  // Validate relationships
  const relationshipsResult = validateRelationships(programs, forms, ctas, branches);
  allErrors.push(...relationshipsResult.errors);
  allWarnings.push(...relationshipsResult.warnings);

  // Validate runtime behavior
  const runtimeResult = validateRuntimeBehavior(programs, forms, ctas, branches, cardInventory);
  allErrors.push(...runtimeResult.errors);
  allWarnings.push(...runtimeResult.warnings);

  // Additional runtime checks
  const postSubmissionWarnings: ValidationWarning[] = [];
  validatePostSubmissionActions(forms, postSubmissionWarnings);
  allWarnings.push(...postSubmissionWarnings);

  // Calculate summary
  const entitiesWithErrors = new Set(
    allErrors.map((e) => e.entityId).filter(Boolean)
  ).size;
  const entitiesWithWarnings = new Set(
    allWarnings.map((w) => w.entityId).filter(Boolean)
  ).size;

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    entityResults,
    summary: {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      entitiesWithErrors,
      entitiesWithWarnings,
    },
  };
}

// ============================================================================
// PRE-DEPLOYMENT VALIDATION
// ============================================================================

/**
 * Validate configuration before deployment
 *
 * This is a stricter validation that focuses on critical errors that would
 * prevent the configuration from working correctly in production.
 *
 * Only errors block deployment. Warnings are shown but don't prevent deployment.
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @param cardInventory - Card inventory (optional)
 * @returns Validation result (valid = can deploy)
 */
export function validatePreDeployment(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): ConfigValidationResult {
  // Use the same validation as full config
  const result = validateConfig(programs, forms, ctas, branches, cardInventory);

  // Pre-deployment focuses on errors only
  // Warnings are informational and don't block deployment

  return result;
}

/**
 * Validate configuration from store state before deployment
 */
export function validatePreDeploymentFromStore(state: {
  programs: { programs: Record<string, Program> };
  forms: { forms: Record<string, ConversationalForm> };
  ctas: { ctas: Record<string, CTADefinition> };
  branches: { branches: Record<string, ConversationBranch> };
  cardInventory: { cardInventory: CardInventory | null };
}): ConfigValidationResult {
  return validatePreDeployment(
    state.programs.programs,
    state.forms.forms,
    state.ctas.ctas,
    state.branches.branches,
    state.cardInventory.cardInventory
  );
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Get validation summary as human-readable string
 */
export function getValidationSummary(result: ConfigValidationResult): string {
  const { summary } = result;

  if (summary.totalErrors === 0 && summary.totalWarnings === 0) {
    return '✅ Configuration is valid with no errors or warnings';
  }

  const parts: string[] = [];

  if (summary.totalErrors > 0) {
    parts.push(
      `❌ ${summary.totalErrors} error${summary.totalErrors > 1 ? 's' : ''} found in ${summary.entitiesWithErrors} ${summary.entitiesWithErrors === 1 ? 'entity' : 'entities'}`
    );
  }

  if (summary.totalWarnings > 0) {
    parts.push(
      `⚠️ ${summary.totalWarnings} warning${summary.totalWarnings > 1 ? 's' : ''} found in ${summary.entitiesWithWarnings} ${summary.entitiesWithWarnings === 1 ? 'entity' : 'entities'}`
    );
  }

  return parts.join(', ');
}

/**
 * Get validation issues grouped by entity
 */
export function getIssuesByEntity(
  result: ConfigValidationResult
): Map<string, { errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const issuesByEntity = new Map<
    string,
    { errors: ValidationError[]; warnings: ValidationWarning[] }
  >();

  // Group errors by entity
  result.errors.forEach((error) => {
    const entityKey = error.entityId || 'global';
    if (!issuesByEntity.has(entityKey)) {
      issuesByEntity.set(entityKey, { errors: [], warnings: [] });
    }
    issuesByEntity.get(entityKey)!.errors.push(error);
  });

  // Group warnings by entity
  result.warnings.forEach((warning) => {
    const entityKey = warning.entityId || 'global';
    if (!issuesByEntity.has(entityKey)) {
      issuesByEntity.set(entityKey, { errors: [], warnings: [] });
    }
    issuesByEntity.get(entityKey)!.warnings.push(warning);
  });

  return issuesByEntity;
}

/**
 * Check if a specific entity has errors
 */
export function entityHasErrors(
  result: ConfigValidationResult,
  entityId: string
): boolean {
  return result.errors.some((error) => error.entityId === entityId);
}

/**
 * Get errors for a specific entity
 */
export function getErrorsForEntity(
  result: ConfigValidationResult,
  entityId: string
): ValidationError[] {
  return result.errors.filter((error) => error.entityId === entityId);
}

/**
 * Get warnings for a specific entity
 */
export function getWarningsForEntity(
  result: ConfigValidationResult,
  entityId: string
): ValidationWarning[] {
  return result.warnings.filter((warning) => warning.entityId === entityId);
}
