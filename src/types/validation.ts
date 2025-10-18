/**
 * Validation Types for Picasso Config Builder
 *
 * These types define the structure of validation results, errors, warnings,
 * and dependency tracking throughout the application.
 */

// ============================================================================
// ENTITY TYPES
// ============================================================================

export type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'card' | 'config';

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationError {
  type: string;
  message: string;
  severity: 'error';
  entityType: EntityType;
  entityId: string;
  field?: string;
  suggestion?: string;
  context?: Record<string, unknown>;
}

export interface ValidationWarning {
  type: string;
  message: string;
  severity: 'warning';
  entityType: EntityType;
  entityId: string;
  field?: string;
  suggestion?: string;
  context?: Record<string, unknown>;
}

export type ValidationIssue = ValidationError | ValidationWarning;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// FIELD VALIDATION
// ============================================================================

export interface FieldValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

/**
 * Simple field-level validation errors
 * Maps field names to error messages
 */
export type ValidationErrors = Record<string, string | undefined>;

// ============================================================================
// DEPENDENCY TRACKING
// ============================================================================

export interface DependencyReference {
  type: EntityType;
  id: string;
  label: string;
}

export interface Dependencies {
  usedBy: DependencyReference[]; // Entities that depend on this entity
  uses: DependencyReference[]; // Entities this entity depends on
}

export interface DependencyGraph {
  programs: Record<string, Dependencies>;
  forms: Record<string, Dependencies>;
  ctas: Record<string, Dependencies>;
  branches: Record<string, Dependencies>;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export type ValidationRuleType =
  | 'required_field'
  | 'invalid_format'
  | 'invalid_reference'
  | 'missing_dependency'
  | 'circular_dependency'
  | 'duplicate_id'
  | 'invalid_action_config'
  | 'invalid_field_config'
  | 'max_length_exceeded'
  | 'invalid_type'
  | 'constraint_violation'
  | 'best_practice';

export interface ValidationRule {
  type: ValidationRuleType;
  severity: ValidationSeverity;
  entityType: EntityType;
  check: (entity: unknown, context?: unknown) => boolean;
  getMessage: (entity: unknown, context?: unknown) => string;
  getSuggestion?: (entity: unknown, context?: unknown) => string;
}

// ============================================================================
// VALIDATION CONTEXT
// ============================================================================

/**
 * Context passed to validators containing all config data
 * for cross-entity validation and dependency checking
 */
export interface ValidationContext {
  programs: Record<string, unknown>;
  forms: Record<string, unknown>;
  ctas: Record<string, unknown>;
  branches: Record<string, unknown>;
  cardInventory?: unknown;
}

// ============================================================================
// VALIDATION SUMMARY
// ============================================================================

export interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  errorsByEntity: Record<EntityType, number>;
  warningsByEntity: Record<EntityType, number>;
  isDeployable: boolean; // False if any blocking errors exist
  criticalIssues: ValidationIssue[]; // High-priority errors
}
