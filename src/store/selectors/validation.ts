/**
 * Validation Selectors
 * Cross-slice selectors for validation state queries
 */

import type { ConfigBuilderState, ValidationError } from '../types';

/**
 * Get all validation errors across the entire config
 */
export function getAllErrors(state: ConfigBuilderState): Array<{
  entityId: string;
  errors: ValidationError[];
}> {
  return Object.entries(state.validation.errors).map(([entityId, errors]) => ({
    entityId,
    errors,
  }));
}

/**
 * Get all validation warnings across the entire config
 */
export function getAllWarnings(state: ConfigBuilderState): Array<{
  entityId: string;
  warnings: ValidationError[];
}> {
  return Object.entries(state.validation.warnings).map(([entityId, warnings]) => ({
    entityId,
    warnings,
  }));
}

/**
 * Get total error count
 */
export function getErrorCount(state: ConfigBuilderState): number {
  return Object.values(state.validation.errors).reduce(
    (total, errors) => total + errors.length,
    0
  );
}

/**
 * Get total warning count
 */
export function getWarningCount(state: ConfigBuilderState): number {
  return Object.values(state.validation.warnings).reduce(
    (total, warnings) => total + warnings.length,
    0
  );
}

/**
 * Check if a specific entity has errors
 */
export function hasEntityErrors(state: ConfigBuilderState, entityId: string): boolean {
  return state.validation.getErrorsForEntity(entityId).length > 0;
}

/**
 * Check if a specific entity has warnings
 */
export function hasEntityWarnings(state: ConfigBuilderState, entityId: string): boolean {
  return state.validation.getWarningsForEntity(entityId).length > 0;
}

/**
 * Get errors grouped by entity type
 */
export function getErrorsByEntityType(state: ConfigBuilderState): {
  programs: Array<{ id: string; errors: ValidationError[] }>;
  forms: Array<{ id: string; errors: ValidationError[] }>;
  ctas: Array<{ id: string; errors: ValidationError[] }>;
  branches: Array<{ id: string; errors: ValidationError[] }>;
} {
  const result = {
    programs: [] as Array<{ id: string; errors: ValidationError[] }>,
    forms: [] as Array<{ id: string; errors: ValidationError[] }>,
    ctas: [] as Array<{ id: string; errors: ValidationError[] }>,
    branches: [] as Array<{ id: string; errors: ValidationError[] }>,
  };

  Object.entries(state.validation.errors).forEach(([entityId, errors]) => {
    if (entityId.startsWith('program-')) {
      result.programs.push({ id: entityId.replace('program-', ''), errors });
    } else if (entityId.startsWith('form-')) {
      result.forms.push({ id: entityId.replace('form-', ''), errors });
    } else if (entityId.startsWith('cta-')) {
      result.ctas.push({ id: entityId.replace('cta-', ''), errors });
    } else if (entityId.startsWith('branch-')) {
      result.branches.push({ id: entityId.replace('branch-', ''), errors });
    }
  });

  return result;
}

/**
 * Get validation summary for dashboard display
 */
export function getValidationSummary(state: ConfigBuilderState): {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  lastValidated: number | null;
  criticalIssues: Array<{
    entityId: string;
    entityType: string;
    message: string;
  }>;
} {
  const errorCount = getErrorCount(state);
  const warningCount = getWarningCount(state);

  // Extract critical issues (errors with 'required' or 'missing' in message)
  const criticalIssues: Array<{
    entityId: string;
    entityType: string;
    message: string;
  }> = [];

  Object.entries(state.validation.errors).forEach(([entityId, errors]) => {
    errors.forEach((error) => {
      const message = error.message.toLowerCase();
      if (message.includes('required') || message.includes('missing') || message.includes('not exist')) {
        const entityType = entityId.split('-')[0];
        criticalIssues.push({
          entityId,
          entityType,
          message: error.message,
        });
      }
    });
  });

  return {
    isValid: state.validation.isValid,
    errorCount,
    warningCount,
    lastValidated: state.validation.lastValidated,
    criticalIssues,
  };
}

/**
 * Check if config is deployable
 * Config is deployable if it has no errors and is valid
 */
export function isConfigDeployable(state: ConfigBuilderState): boolean {
  return state.validation.isValid && getErrorCount(state) === 0;
}

/**
 * Get blocker messages preventing deployment
 */
export function getDeploymentBlockers(state: ConfigBuilderState): string[] {
  const blockers: string[] = [];

  if (!state.config.tenantId) {
    blockers.push('No tenant loaded');
  }

  const errorCount = getErrorCount(state);
  if (errorCount > 0) {
    blockers.push(`${errorCount} validation error(s) must be fixed`);
  }

  // Check for orphaned entities
  const { orphanedEntities } = state.validation.errors['_orphaned'] ? { orphanedEntities: 1 } : { orphanedEntities: 0 };
  if (orphanedEntities > 0) {
    blockers.push(`${orphanedEntities} orphaned entit${orphanedEntities === 1 ? 'y' : 'ies'} detected`);
  }

  return blockers;
}
