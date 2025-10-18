/**
 * Pre-Deployment Validation
 * Validates configuration before deployment to S3
 *
 * This module enforces stricter validation rules to ensure the configuration
 * will work correctly in production.
 *
 * Critical Validations (must pass to deploy):
 * - All CTA action types have required fields
 * - All form-to-program references are valid
 * - All CTA-to-form references are valid
 * - All branch-to-CTA references are valid
 * - No circular dependencies detected
 *
 * Warning Validations (can deploy with warnings):
 * - Branch keyword quality issues
 * - Branch priority ordering suggestions
 * - CTA button text quality suggestions
 * - Missing trigger phrases on forms
 * - More than 3 CTAs in branch
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  CardInventory,
} from '@/types/config';
import type { ValidationError, ValidationWarning } from './types';
import { validateConfig } from './index';

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

export interface DeploymentChecklist {
  canDeploy: boolean;
  criticalIssues: ValidationError[]; // Must be resolved before deployment
  warnings: ValidationWarning[]; // Non-blocking issues
  summary: {
    totalPrograms: number;
    totalForms: number;
    totalCTAs: number;
    totalBranches: number;
    formsWithPrograms: number;
    formsWithoutPrograms: number;
    ctasWithErrors: number;
    branchesWithErrors: number;
  };
  messages: string[];
}

/**
 * Generate deployment checklist
 *
 * This function validates the entire configuration and generates a
 * deployment-ready checklist with critical issues and warnings.
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @param cardInventory - Card inventory (optional)
 * @returns Deployment checklist
 */
export function generateDeploymentChecklist(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): DeploymentChecklist {
  // Run full validation
  const validationResult = validateConfig(programs, forms, ctas, branches, cardInventory);

  // Separate critical errors from warnings
  const criticalIssues = validationResult.errors.filter(isCriticalError);
  const canDeploy = criticalIssues.length === 0;

  // Calculate summary statistics
  const totalPrograms = Object.keys(programs).length;
  const totalForms = Object.keys(forms).length;
  const totalCTAs = Object.keys(ctas).length;
  const totalBranches = Object.keys(branches).length;

  const formsWithPrograms = Object.values(forms).filter(
    (form) => form.program && form.program.trim() !== ''
  ).length;
  const formsWithoutPrograms = totalForms - formsWithPrograms;

  const ctasWithErrors = new Set(
    validationResult.errors.filter((e) => e.entityType === 'cta').map((e) => e.entityId)
  ).size;

  const branchesWithErrors = new Set(
    validationResult.errors.filter((e) => e.entityType === 'branch').map((e) => e.entityId)
  ).size;

  // Generate human-readable messages
  const messages = generateDeploymentMessages(
    canDeploy,
    totalPrograms,
    totalForms,
    totalCTAs,
    totalBranches,
    formsWithPrograms,
    criticalIssues.length,
    validationResult.warnings.length
  );

  return {
    canDeploy,
    criticalIssues,
    warnings: validationResult.warnings,
    summary: {
      totalPrograms,
      totalForms,
      totalCTAs,
      totalBranches,
      formsWithPrograms,
      formsWithoutPrograms,
      ctasWithErrors,
      branchesWithErrors,
    },
    messages,
  };
}

/**
 * Determine if an error is critical (blocks deployment)
 */
function isCriticalError(error: ValidationError): boolean {
  // All errors from relationship validation are critical
  if (error.entityType === 'relationship') {
    return true;
  }

  // CTA action type requirement errors are critical
  if (error.entityType === 'cta' && error.field) {
    const criticalFields = ['formId', 'url', 'query', 'prompt'];
    if (criticalFields.includes(error.field)) {
      return true;
    }
  }

  // Form required field errors are critical
  if (error.entityType === 'form' && error.field) {
    const criticalFields = ['program', 'fields'];
    if (criticalFields.includes(error.field)) {
      return true;
    }
  }

  // Branch CTA reference errors are critical
  if (error.entityType === 'branch' && error.field) {
    const criticalFields = ['available_ctas.primary'];
    if (criticalFields.some((field) => error.field?.includes(field))) {
      return true;
    }
  }

  // Circular dependency errors are critical
  if (error.message.toLowerCase().includes('circular')) {
    return true;
  }

  // By default, treat all errors as critical
  return true;
}

/**
 * Generate deployment messages
 */
function generateDeploymentMessages(
  canDeploy: boolean,
  totalPrograms: number,
  totalForms: number,
  totalCTAs: number,
  totalBranches: number,
  formsWithPrograms: number,
  totalErrors: number,
  totalWarnings: number
): string[] {
  const messages: string[] = [];

  // Header
  if (canDeploy) {
    messages.push('✅ Configuration is ready for deployment');
  } else {
    messages.push('❌ Configuration has critical issues that must be resolved');
  }

  messages.push('');

  // Entity summary
  messages.push('Configuration Summary:');
  messages.push(`  • ${totalPrograms} Program${totalPrograms !== 1 ? 's' : ''} defined`);
  messages.push(
    `  • ${totalForms} Form${totalForms !== 1 ? 's' : ''} created (${formsWithPrograms} with program assignments)`
  );
  messages.push(`  • ${totalCTAs} CTA${totalCTAs !== 1 ? 's' : ''} defined`);
  messages.push(`  • ${totalBranches} Branch${totalBranches !== 1 ? 'es' : ''} configured`);

  messages.push('');

  // Validation summary
  if (totalErrors > 0) {
    messages.push(`❌ ${totalErrors} Critical Error${totalErrors !== 1 ? 's' : ''}`);
  }

  if (totalWarnings > 0) {
    messages.push(`⚠️  ${totalWarnings} Warning${totalWarnings !== 1 ? 's' : ''} (non-blocking)`);
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    messages.push('✅ No errors or warnings found');
  }

  messages.push('');

  // Deployment recommendation
  if (canDeploy) {
    if (totalWarnings > 0) {
      messages.push('You can deploy with warnings, but we recommend reviewing them first.');
    } else {
      messages.push('Configuration is valid and ready for deployment.');
    }
  } else {
    messages.push('Please resolve critical errors before deployment.');
  }

  return messages;
}

// ============================================================================
// DEPLOYMENT READINESS CHECKS
// ============================================================================

/**
 * Quick check if configuration is ready for deployment
 */
export function isDeploymentReady(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): boolean {
  const checklist = generateDeploymentChecklist(programs, forms, ctas, branches, cardInventory);
  return checklist.canDeploy;
}

/**
 * Get critical errors that block deployment
 */
export function getCriticalErrors(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): ValidationError[] {
  const checklist = generateDeploymentChecklist(programs, forms, ctas, branches, cardInventory);
  return checklist.criticalIssues;
}

/**
 * Get deployment warnings (non-blocking)
 */
export function getDeploymentWarnings(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  cardInventory?: CardInventory | null
): ValidationWarning[] {
  const checklist = generateDeploymentChecklist(programs, forms, ctas, branches, cardInventory);
  return checklist.warnings;
}

/**
 * Format deployment checklist as human-readable text
 */
export function formatDeploymentChecklist(checklist: DeploymentChecklist): string {
  const lines: string[] = [];

  // Messages
  lines.push(...checklist.messages);

  // Critical errors
  if (checklist.criticalIssues.length > 0) {
    lines.push('');
    lines.push('Critical Errors:');
    checklist.criticalIssues.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error.message}`);
      if (error.suggestedFix) {
        lines.push(`     Fix: ${error.suggestedFix}`);
      }
    });
  }

  // Warnings (show first 5)
  if (checklist.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    checklist.warnings.slice(0, 5).forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning.message}`);
    });

    if (checklist.warnings.length > 5) {
      lines.push(`  ... and ${checklist.warnings.length - 5} more warning(s)`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// DEPLOYMENT VALIDATION FROM STORE
// ============================================================================

/**
 * Validate configuration from store state before deployment
 */
export function validateDeploymentFromStore(state: {
  programs: { programs: Record<string, Program> };
  forms: { forms: Record<string, ConversationalForm> };
  ctas: { ctas: Record<string, CTADefinition> };
  branches: { branches: Record<string, ConversationBranch> };
  cardInventory: { cardInventory: CardInventory | null };
}): DeploymentChecklist {
  return generateDeploymentChecklist(
    state.programs.programs,
    state.forms.forms,
    state.ctas.ctas,
    state.branches.branches,
    state.cardInventory.cardInventory
  );
}
