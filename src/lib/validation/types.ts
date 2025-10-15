/**
 * Validation Types
 * Type definitions for the validation engine
 */

// ============================================================================
// VALIDATION LEVELS
// ============================================================================

export type ValidationLevel = 'error' | 'warning' | 'info';

export type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'relationship' | 'runtime' | 'config';

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

export interface ValidationIssue {
  level: ValidationLevel;
  message: string;
  field?: string; // Specific field with issue
  entityType: EntityType;
  entityId?: string;
  suggestedFix?: string; // Helpful fix suggestion
}

export interface ValidationError extends ValidationIssue {
  level: 'error';
}

export interface ValidationWarning extends ValidationIssue {
  level: 'warning' | 'info';
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean; // false if any errors
  errors: ValidationError[]; // blocking issues
  warnings: ValidationWarning[]; // non-blocking issues
  entity?: string; // entity type being validated
  entityId?: string; // specific entity ID
}

// ============================================================================
// ENTITY VALIDATION RESULTS
// ============================================================================

export interface EntityValidationResult {
  entityId: string;
  entityType: EntityType;
  result: ValidationResult;
}

// ============================================================================
// CONFIG VALIDATION RESULT
// ============================================================================

export interface ConfigValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  entityResults: EntityValidationResult[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    entitiesWithErrors: number;
    entitiesWithWarnings: number;
  };
}
