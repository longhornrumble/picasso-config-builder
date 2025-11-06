/**
 * Dashboard Flow Diagram Utilities
 * Helper functions for building tree structure and calculating validation status
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  ShowcaseItem,
  ActionChip,
} from '@/types/config';
import type { ValidationError } from '@/store/types';
import type {
  TreeNode,
  EntityType,
  ValidationStatus,
  EntityTypeMetadata,
  ValidationStatusMetadata,
} from './types';

// ============================================================================
// ENTITY TYPE METADATA
// ============================================================================

/**
 * Metadata for each entity type (colors, icons, labels, routes)
 */
export const ENTITY_TYPE_METADATA: Record<EntityType, EntityTypeMetadata> = {
  program: {
    color: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
    },
    icon: 'Briefcase',
    label: 'Program',
    pluralLabel: 'Programs',
    route: '/programs',
  },
  form: {
    color: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
    },
    icon: 'FileText',
    label: 'Form',
    pluralLabel: 'Forms',
    route: '/forms',
  },
  cta: {
    color: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
    },
    icon: 'MousePointerClick',
    label: 'CTA',
    pluralLabel: 'CTAs',
    route: '/ctas',
  },
  branch: {
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-900 dark:text-orange-100',
    },
    icon: 'GitBranch',
    label: 'Branch',
    pluralLabel: 'Branches',
    route: '/branches',
  },
  actionChip: {
    color: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-900 dark:text-cyan-100',
    },
    icon: 'Zap',
    label: 'Action Chip',
    pluralLabel: 'Action Chips',
    route: '/action-chips',
  },
  showcase: {
    color: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-200 dark:border-pink-800',
      text: 'text-pink-900 dark:text-pink-100',
    },
    icon: 'Layout',
    label: 'Showcase Item',
    pluralLabel: 'Showcase Items',
    route: '/showcase',
  },
};

/**
 * Metadata for validation status (colors, labels)
 */
export const VALIDATION_STATUS_METADATA: Record<ValidationStatus, ValidationStatusMetadata> = {
  error: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Error',
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Warning',
  },
  success: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Valid',
  },
  none: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    label: 'Not Validated',
  },
};

// ============================================================================
// VALIDATION STATUS CALCULATION
// ============================================================================

/**
 * Calculate validation status for an entity
 */
export function calculateValidationStatus(
  entityId: string,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): { status: ValidationStatus; errorCount: number; warningCount: number } {
  const entityErrors = errors[entityId] || [];
  const entityWarnings = warnings[entityId] || [];
  const errorCount = entityErrors.length;
  const warningCount = entityWarnings.length;

  let status: ValidationStatus = 'none';
  if (errorCount > 0) {
    status = 'error';
  } else if (warningCount > 0) {
    status = 'warning';
  } else if (entityId in errors || entityId in warnings) {
    // Entity was validated but has no errors/warnings
    status = 'success';
  }

  return { status, errorCount, warningCount };
}

// ============================================================================
// TREE BUILDING
// ============================================================================

/**
 * Build hierarchical tree structure from config entities
 */
export function buildTreeStructure(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  const tree: TreeNode[] = [];

  // Build programs with nested forms → CTAs → branches
  Object.entries(programs).forEach(([programId, program]) => {
    const programValidation = calculateValidationStatus(programId, errors, warnings);

    // Find forms for this program
    const programForms = Object.entries(forms)
      .filter(([_, form]) => form.program === programId)
      .map(([formId, form]) => {
        const formValidation = calculateValidationStatus(formId, errors, warnings);

        // Find CTAs that reference this form
        const formCTAs = Object.entries(ctas)
          .filter(([_, cta]) => cta.formId === formId)
          .map(([ctaId, cta]) => {
            const ctaValidation = calculateValidationStatus(ctaId, errors, warnings);

            // Find branches that reference this CTA
            const ctaBranches = Object.entries(branches)
              .filter(([_, branch]) => {
                return (
                  branch.available_ctas.primary === ctaId ||
                  branch.available_ctas.secondary.includes(ctaId)
                );
              })
              .map(([branchId, branch]) => {
                const branchValidation = calculateValidationStatus(branchId, errors, warnings);

                return {
                  id: branchId,
                  type: 'branch' as EntityType,
                  label: branchId,
                  description: `Primary: ${branch.available_ctas.primary}, Secondary: ${branch.available_ctas.secondary.length}`,
                  validationStatus: branchValidation.status,
                  errorCount: branchValidation.errorCount,
                  warningCount: branchValidation.warningCount,
                  children: [],
                  metadata: { branch },
                };
              });

            return {
              id: ctaId,
              type: 'cta' as EntityType,
              label: cta.label || cta.text || ctaId,
              description: `Action: ${cta.action}`,
              validationStatus: ctaValidation.status,
              errorCount: ctaValidation.errorCount,
              warningCount: ctaValidation.warningCount,
              children: ctaBranches,
              metadata: { cta },
            };
          });

        return {
          id: formId,
          type: 'form' as EntityType,
          label: form.title,
          description: form.description,
          validationStatus: formValidation.status,
          errorCount: formValidation.errorCount,
          warningCount: formValidation.warningCount,
          children: formCTAs,
          metadata: { form },
        };
      });

    tree.push({
      id: programId,
      type: 'program',
      label: program.program_name,
      description: program.description,
      validationStatus: programValidation.status,
      errorCount: programValidation.errorCount,
      warningCount: programValidation.warningCount,
      children: programForms,
      metadata: { program },
    });
  });

  return tree;
}

/**
 * Build flat list of action chip nodes
 */
export function buildActionChipNodes(
  actionChips: Record<string, ActionChip>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return Object.entries(actionChips).map(([chipId, chip]) => {
    const validation = calculateValidationStatus(chipId, errors, warnings);

    return {
      id: chipId,
      type: 'actionChip',
      label: chip.label,
      description: `Action: ${chip.action || 'send_query'}${chip.target_branch ? ` → ${chip.target_branch}` : ''}`,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { chip },
    };
  });
}

/**
 * Build flat list of showcase item nodes
 */
export function buildShowcaseNodes(
  showcaseItems: ShowcaseItem[],
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return showcaseItems.map((item) => {
    const validation = calculateValidationStatus(item.id, errors, warnings);

    return {
      id: item.id,
      type: 'showcase',
      label: item.name,
      description: item.tagline,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { item },
    };
  });
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Build navigation URL for entity
 */
export function getEntityNavigationUrl(node: TreeNode): string {
  const metadata = ENTITY_TYPE_METADATA[node.type];
  return `${metadata.route}?selected=${encodeURIComponent(node.id)}`;
}

/**
 * Get entity metadata by type
 */
export function getEntityMetadata(type: EntityType): EntityTypeMetadata {
  return ENTITY_TYPE_METADATA[type];
}

/**
 * Get validation status metadata
 */
export function getValidationMetadata(status: ValidationStatus): ValidationStatusMetadata {
  return VALIDATION_STATUS_METADATA[status];
}
