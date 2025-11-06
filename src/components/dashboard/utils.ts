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
  FlowStatistics,
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
 * Build flat list of program nodes
 */
export function buildProgramNodes(
  programs: Record<string, Program>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return Object.entries(programs).map(([programId, program]) => {
    const validation = calculateValidationStatus(programId, errors, warnings);

    return {
      id: programId,
      type: 'program',
      label: program.program_name,
      description: program.description,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { program },
    };
  });
}

/**
 * Build flat list of form nodes
 */
export function buildFormNodes(
  forms: Record<string, ConversationalForm>,
  programs: Record<string, Program>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return Object.entries(forms).map(([formId, form]) => {
    const validation = calculateValidationStatus(formId, errors, warnings);

    // Get program name for display
    const programName = form.program && programs[form.program]
      ? programs[form.program].program_name
      : 'No program';

    return {
      id: formId,
      type: 'form',
      label: form.title,
      description: `${form.description || ''} → ${programName}`,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { form },
    };
  });
}

/**
 * Build flat list of CTA nodes
 */
export function buildCTANodes(
  ctas: Record<string, CTADefinition>,
  forms: Record<string, ConversationalForm>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return Object.entries(ctas).map(([ctaId, cta]) => {
    const validation = calculateValidationStatus(ctaId, errors, warnings);

    // Get form reference for display
    const formRef = cta.formId && forms[cta.formId]
      ? `→ ${forms[cta.formId].title}`
      : '';

    return {
      id: ctaId,
      type: 'cta',
      label: cta.label || cta.text || ctaId,
      description: `Action: ${cta.action}${formRef ? ' ' + formRef : ''}`,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { cta },
    };
  });
}

/**
 * Build flat list of branch nodes
 */
export function buildBranchNodes(
  branches: Record<string, ConversationBranch>,
  ctas: Record<string, CTADefinition>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  return Object.entries(branches).map(([branchId, branch]) => {
    const validation = calculateValidationStatus(branchId, errors, warnings);

    const primaryCTA = branch.available_ctas.primary && ctas[branch.available_ctas.primary]
      ? ctas[branch.available_ctas.primary].label || branch.available_ctas.primary
      : 'None';

    return {
      id: branchId,
      type: 'branch',
      label: branchId,
      description: `Primary: ${primaryCTA}, Secondary: ${branch.available_ctas.secondary.length}`,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      children: [],
      metadata: { branch },
    };
  });
}

/**
 * Build hierarchical tree structure from config entities
 * @deprecated Use individual buildXNodes functions for flat lists
 */
export function buildTreeStructure(
  programs: Record<string, Program>,
  _forms: Record<string, ConversationalForm>,
  _ctas: Record<string, CTADefinition>,
  _branches: Record<string, ConversationBranch>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): TreeNode[] {
  // For backwards compatibility, return flat program list
  return buildProgramNodes(programs, errors, warnings);
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

// ============================================================================
// FLOW STATISTICS CALCULATION
// ============================================================================

/**
 * Calculate flow statistics for dashboard overview
 */
export function calculateFlowStatistics(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[],
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): FlowStatistics {
  // Count total nodes
  const totalNodes =
    Object.keys(programs).length +
    Object.keys(forms).length +
    Object.keys(ctas).length +
    Object.keys(branches).length +
    Object.keys(actionChips).length +
    showcaseItems.length;

  // Count connections
  const connections = countConnections(programs, forms, ctas, branches, actionChips, showcaseItems);

  // Count validation statuses
  const allEntityIds = [
    ...Object.keys(programs),
    ...Object.keys(forms),
    ...Object.keys(ctas),
    ...Object.keys(branches),
    ...Object.keys(actionChips),
    ...showcaseItems.map((item) => item.id),
  ];

  let errorCount = 0;
  let warningCount = 0;
  let validCount = 0;

  allEntityIds.forEach((entityId) => {
    const hasErrors = errors[entityId] && errors[entityId].length > 0;
    const hasWarnings = warnings[entityId] && warnings[entityId].length > 0;

    if (hasErrors) {
      errorCount++;
    } else if (hasWarnings) {
      warningCount++;
    } else if (entityId in errors || entityId in warnings) {
      // Entity was validated but has no errors/warnings
      validCount++;
    }
  });

  // Count orphaned entities
  const orphaned = findOrphanedEntities(programs, forms, ctas, branches, actionChips, showcaseItems);

  // Count broken references
  const brokenRefs = findBrokenReferences(programs, forms, ctas, branches, actionChips, showcaseItems);

  return {
    nodes: totalNodes,
    connections,
    errors: errorCount,
    warnings: warningCount,
    valid: validCount,
    orphaned,
    brokenRefs,
  };
}

/**
 * Count all connections/relationships between entities
 */
function countConnections(
  _programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[]
): number {
  let count = 0;

  // Forms → Programs
  Object.values(forms).forEach((form) => {
    if (form.program) count++;
  });

  // CTAs → Forms
  Object.values(ctas).forEach((cta) => {
    if (cta.formId) count++;
  });

  // Branches → CTAs (primary + secondary)
  Object.values(branches).forEach((branch) => {
    if (branch.available_ctas.primary) count++;
    count += branch.available_ctas.secondary.length;
  });

  // Action Chips → Branches
  Object.values(actionChips).forEach((chip) => {
    if (chip.target_branch) count++;
  });

  // Showcase Items → CTAs (via action.cta_id)
  showcaseItems.forEach((item) => {
    if (item.action?.cta_id) count++;
  });

  return count;
}

/**
 * Find orphaned entities (entities not connected to any parent)
 */
function findOrphanedEntities(
  _programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[]
): number {
  let orphanCount = 0;

  // Forms without program
  Object.values(forms).forEach((form) => {
    if (!form.program) orphanCount++;
  });

  // CTAs without form
  Object.values(ctas).forEach((cta) => {
    if (!cta.formId) orphanCount++;
  });

  // Branches with no CTAs
  Object.values(branches).forEach((branch) => {
    if (!branch.available_ctas.primary && branch.available_ctas.secondary.length === 0) {
      orphanCount++;
    }
  });

  // Action chips without routing
  Object.values(actionChips).forEach((chip) => {
    if (!chip.target_branch) orphanCount++;
  });

  // Showcase items without action
  showcaseItems.forEach((item) => {
    if (!item.action) orphanCount++;
  });

  return orphanCount;
}

/**
 * Find broken references (references to non-existent entities)
 */
function findBrokenReferences(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[]
): number {
  let brokenCount = 0;

  // Forms referencing non-existent programs
  Object.values(forms).forEach((form) => {
    if (form.program && !programs[form.program]) brokenCount++;
  });

  // CTAs referencing non-existent forms
  Object.values(ctas).forEach((cta) => {
    if (cta.formId && !forms[cta.formId]) brokenCount++;
  });

  // Branches referencing non-existent CTAs
  Object.values(branches).forEach((branch) => {
    if (branch.available_ctas.primary && !ctas[branch.available_ctas.primary]) {
      brokenCount++;
    }
    branch.available_ctas.secondary.forEach((ctaId) => {
      if (!ctas[ctaId]) brokenCount++;
    });
  });

  // Action chips referencing non-existent branches
  Object.values(actionChips).forEach((chip) => {
    if (chip.target_branch && !branches[chip.target_branch]) brokenCount++;
  });

  // Showcase items referencing non-existent CTAs
  showcaseItems.forEach((item) => {
    if (item.action?.cta_id && !ctas[item.action.cta_id]) {
      brokenCount++;
    }
  });

  return brokenCount;
}
