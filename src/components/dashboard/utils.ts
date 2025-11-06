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
  BranchMetadata,
  CTAMetadata,
  FormMetadata,
  ProgramMetadata,
  ActionChipMetadata,
  ShowcaseMetadata,
  StatusIcon,
  OrphanedEntity,
  BrokenRefEntity,
  EntityWithIssues,
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
// RICH METADATA EXTRACTION
// ============================================================================

/**
 * Get action type for a CTA
 */
function getCTAActionType(cta: CTADefinition): 'form_trigger' | 'bedrock_query' | 'external_link' {
  if (cta.action === 'start_form' || cta.formId) {
    return 'form_trigger';
  } else if (cta.action === 'external_link' || cta.url) {
    return 'external_link';
  } else {
    return 'bedrock_query';
  }
}

/**
 * Extract rich metadata for branch nodes
 */
export function getBranchMetadata(
  branch: ConversationBranch,
  ctas: Record<string, CTADefinition>
): BranchMetadata {
  // Branches don't have keywords - using 0 as default
  const keywordCount = 0;
  const primaryCTAId = branch.available_ctas.primary;
  const secondaryCTAIds = branch.available_ctas.secondary || [];

  const primaryCTA = primaryCTAId && ctas[primaryCTAId]
    ? {
        id: primaryCTAId,
        actionType: getCTAActionType(ctas[primaryCTAId]),
        label: ctas[primaryCTAId].label || ctas[primaryCTAId].text || primaryCTAId,
      }
    : undefined;

  const secondaryCTAs = secondaryCTAIds
    .filter((id) => ctas[id])
    .map((id) => ({
      id,
      actionType: getCTAActionType(ctas[id]),
      label: ctas[id].label || ctas[id].text || id,
    }));

  return {
    keywordCount,
    ctaCount: (primaryCTA ? 1 : 0) + secondaryCTAs.length,
    primaryCTA,
    secondaryCTAs,
  };
}

/**
 * Extract rich metadata for CTA nodes
 */
export function getCTAMetadata(
  cta: CTADefinition,
  forms: Record<string, ConversationalForm>
): CTAMetadata {
  const actionType = getCTAActionType(cta);

  let actionTypeLabel = '';
  let target = '';
  let targetLabel = '';
  let additionalInfo = '';

  switch (actionType) {
    case 'form_trigger':
      actionTypeLabel = 'Form Trigger';
      if (cta.formId) {
        target = cta.formId;
        targetLabel = forms[cta.formId]?.title || cta.formId;
      }
      break;
    case 'bedrock_query':
      actionTypeLabel = 'Bedrock Query';
      if (cta.query) {
        additionalInfo = cta.query.substring(0, 50) + (cta.query.length > 50 ? '...' : '');
      }
      break;
    case 'external_link':
      actionTypeLabel = 'External Link';
      if (cta.url) {
        target = cta.url;
        targetLabel = cta.url;
      }
      break;
  }

  return {
    actionType,
    actionTypeLabel,
    target,
    targetLabel,
    additionalInfo,
  };
}

/**
 * Extract rich metadata for form nodes
 */
export function getFormMetadata(
  form: ConversationalForm,
  programs: Record<string, Program>
): FormMetadata {
  const fieldCount = form.fields?.length || 0;
  const hasCompositeFields = form.fields?.some((f) =>
    ['address', 'full_name', 'phone_and_email'].includes(f.type)
  ) || false;

  const programId = form.program;
  const programName = programId && programs[programId]
    ? programs[programId].program_name
    : undefined;

  return {
    fieldCount,
    programId,
    programName,
    hasCompositeFields,
  };
}

/**
 * Extract rich metadata for program nodes
 */
export function getProgramMetadata(
  program: Program,
  forms: Record<string, ConversationalForm>
): ProgramMetadata {
  const formIds = Object.entries(forms)
    .filter(([_, form]) => form.program === program.program_id)
    .map(([formId]) => formId);

  return {
    description: program.description,
    formCount: formIds.length,
    formIds,
  };
}

/**
 * Extract rich metadata for action chip nodes
 */
export function getActionChipMetadata(chip: ActionChip): ActionChipMetadata {
  const routingType = chip.target_branch ? 'explicit_route' : 'smart_routing';
  const routingTarget = chip.target_branch || undefined;

  return {
    routingType,
    routingTarget,
  };
}

/**
 * Extract rich metadata for showcase nodes
 */
export function getShowcaseMetadata(
  item: ShowcaseItem,
  _ctas: Record<string, CTADefinition>
): ShowcaseMetadata {
  // ShowcaseItem uses 'type' instead of 'category'
  const categoryTags = item.type ? [item.type] : [];
  const ctaIds: string[] = [];

  if (item.action?.cta_id) {
    ctaIds.push(item.action.cta_id);
  }

  return {
    categoryTags,
    ctaCount: ctaIds.length,
    ctaIds,
  };
}

/**
 * Get status icons for an entity
 */
export function getEntityStatusIcons(
  entityId: string,
  _entityType: EntityType,
  validationStatus: ValidationStatus,
  errorCount: number,
  warningCount: number,
  isOrphaned: boolean,
  hasBrokenRefs: boolean,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): StatusIcon[] {
  const icons: StatusIcon[] = [];

  // Error icon
  if (errorCount > 0) {
    const errorMessages = errors[entityId] || [];
    const tooltip = `${errorCount} error${errorCount > 1 ? 's' : ''}:\n${errorMessages
      .slice(0, 3)
      .map((e) => `• ${e.message}`)
      .join('\n')}${errorMessages.length > 3 ? `\n...and ${errorMessages.length - 3} more` : ''}`;

    icons.push({
      type: 'error',
      icon: '❌',
      tooltip,
      color: 'text-red-600 dark:text-red-400',
    });
  }

  // Warning icon
  if (warningCount > 0) {
    const warningMessages = warnings[entityId] || [];
    const tooltip = `${warningCount} warning${warningCount > 1 ? 's' : ''}:\n${warningMessages
      .slice(0, 3)
      .map((w) => `• ${w.message}`)
      .join('\n')}${warningMessages.length > 3 ? `\n...and ${warningMessages.length - 3} more` : ''}`;

    icons.push({
      type: 'warning',
      icon: '⚠️',
      tooltip,
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }

  // Orphaned icon
  if (isOrphaned) {
    icons.push({
      type: 'orphaned',
      icon: '🔗💔',
      tooltip: 'Not connected to any parent entity',
      color: 'text-purple-600 dark:text-purple-400',
    });
  }

  // Broken refs icon
  if (hasBrokenRefs) {
    icons.push({
      type: 'broken_ref',
      icon: '🔗❌',
      tooltip: 'References non-existent entities',
      color: 'text-red-600 dark:text-red-400',
    });
  }

  // Not validated icon
  if (validationStatus === 'none' && errorCount === 0 && warningCount === 0) {
    icons.push({
      type: 'not_validated',
      icon: '❓',
      tooltip: 'Entity has not been validated yet',
      color: 'text-gray-600 dark:text-gray-400',
    });
  }

  return icons;
}

// ============================================================================
// TREE BUILDING
// ============================================================================

/**
 * Build flat list of program nodes
 * Note: Requires forms to be passed for rich metadata
 */
export function buildProgramNodes(
  programs: Record<string, Program>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>,
  forms?: Record<string, ConversationalForm>
): TreeNode[] {
  return Object.entries(programs).map(([programId, program]) => {
    const validation = calculateValidationStatus(programId, errors, warnings);

    // Get rich metadata
    const richMetadata = forms ? getProgramMetadata(program, forms) : undefined;

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        programId,
        'program',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        false, // Programs are never orphaned
        false, // Programs don't have broken refs
        errors,
        warnings
      ),
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

    // Check if orphaned or has broken refs
    const isOrphaned = !form.program;
    const hasBrokenRefs = form.program !== undefined && !programs[form.program];

    // Get rich metadata
    const richMetadata = getFormMetadata(form, programs);

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        formId,
        'form',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        isOrphaned,
        hasBrokenRefs,
        errors,
        warnings
      ),
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

    // Check if orphaned or has broken refs
    const isOrphaned = !cta.formId;
    const hasBrokenRefs = cta.formId !== undefined && !forms[cta.formId];

    // Get rich metadata
    const richMetadata = getCTAMetadata(cta, forms);

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        ctaId,
        'cta',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        isOrphaned,
        hasBrokenRefs,
        errors,
        warnings
      ),
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

    // Check if orphaned or has broken refs
    const isOrphaned = !branch.available_ctas.primary && branch.available_ctas.secondary.length === 0;
    const hasBrokenRefs =
      (branch.available_ctas.primary !== undefined && !ctas[branch.available_ctas.primary]) ||
      branch.available_ctas.secondary.some((ctaId) => !ctas[ctaId]);

    // Get rich metadata
    const richMetadata = getBranchMetadata(branch, ctas);

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        branchId,
        'branch',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        isOrphaned,
        hasBrokenRefs,
        errors,
        warnings
      ),
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
 * Note: Requires branches to be passed for broken ref checking
 */
export function buildActionChipNodes(
  actionChips: Record<string, ActionChip>,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>,
  branches?: Record<string, ConversationBranch>
): TreeNode[] {
  return Object.entries(actionChips).map(([chipId, chip]) => {
    const validation = calculateValidationStatus(chipId, errors, warnings);

    // Check if orphaned or has broken refs
    const isOrphaned = !chip.target_branch;
    const hasBrokenRefs = !!(chip.target_branch && branches && !branches[chip.target_branch]);

    // Get rich metadata
    const richMetadata = getActionChipMetadata(chip);

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        chipId,
        'actionChip',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        isOrphaned,
        hasBrokenRefs || false,
        errors,
        warnings
      ),
    };
  });
}

/**
 * Build flat list of showcase item nodes
 * Note: Requires CTAs to be passed for rich metadata and broken ref checking
 */
export function buildShowcaseNodes(
  showcaseItems: ShowcaseItem[],
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>,
  ctas?: Record<string, CTADefinition>
): TreeNode[] {
  return showcaseItems.map((item) => {
    const validation = calculateValidationStatus(item.id, errors, warnings);

    // Check if orphaned or has broken refs
    const isOrphaned = !item.action;
    const hasBrokenRefs = item.action?.cta_id !== undefined && ctas && !ctas[item.action.cta_id];

    // Get rich metadata
    const richMetadata = ctas ? getShowcaseMetadata(item, ctas) : undefined;

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
      richMetadata,
      statusIcons: getEntityStatusIcons(
        item.id,
        'showcase',
        validation.status,
        validation.errorCount,
        validation.warningCount,
        isOrphaned,
        hasBrokenRefs || false,
        errors,
        warnings
      ),
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
  const orphanedResult = findOrphanedEntities(programs, forms, ctas, branches, actionChips, showcaseItems);

  // Count broken references
  const brokenRefsResult = findBrokenReferences(programs, forms, ctas, branches, actionChips, showcaseItems);

  // Build error and warning entity lists
  const errorEntities: EntityWithIssues[] = [];
  const warningEntities: EntityWithIssues[] = [];

  allEntityIds.forEach((entityId) => {
    const entityErrors = errors[entityId] || [];
    const entityWarnings = warnings[entityId] || [];

    if (entityErrors.length > 0) {
      // Find entity label
      let label = entityId;
      let type: EntityType = 'program';

      if (programs[entityId]) {
        label = programs[entityId].program_name;
        type = 'program';
      } else if (forms[entityId]) {
        label = forms[entityId].title;
        type = 'form';
      } else if (ctas[entityId]) {
        label = ctas[entityId].label || ctas[entityId].text || entityId;
        type = 'cta';
      } else if (branches[entityId]) {
        label = entityId;
        type = 'branch';
      } else if (actionChips[entityId]) {
        label = actionChips[entityId].label;
        type = 'actionChip';
      } else {
        const showcase = showcaseItems.find((item) => item.id === entityId);
        if (showcase) {
          label = showcase.name;
          type = 'showcase';
        }
      }

      errorEntities.push({
        id: entityId,
        type,
        label,
        issueCount: entityErrors.length,
        issues: entityErrors.slice(0, 3).map((e) => e.message),
      });
    }

    if (entityWarnings.length > 0) {
      // Find entity label
      let label = entityId;
      let type: EntityType = 'program';

      if (programs[entityId]) {
        label = programs[entityId].program_name;
        type = 'program';
      } else if (forms[entityId]) {
        label = forms[entityId].title;
        type = 'form';
      } else if (ctas[entityId]) {
        label = ctas[entityId].label || ctas[entityId].text || entityId;
        type = 'cta';
      } else if (branches[entityId]) {
        label = entityId;
        type = 'branch';
      } else if (actionChips[entityId]) {
        label = actionChips[entityId].label;
        type = 'actionChip';
      } else {
        const showcase = showcaseItems.find((item) => item.id === entityId);
        if (showcase) {
          label = showcase.name;
          type = 'showcase';
        }
      }

      warningEntities.push({
        id: entityId,
        type,
        label,
        issueCount: entityWarnings.length,
        issues: entityWarnings.slice(0, 3).map((w) => w.message),
      });
    }
  });

  return {
    nodes: totalNodes,
    connections,
    errors: errorCount,
    warnings: warningCount,
    valid: validCount,
    orphaned: orphanedResult.count,
    brokenRefs: brokenRefsResult.count,
    orphanedEntities: orphanedResult.entities,
    brokenRefEntities: brokenRefsResult.entities,
    errorEntities,
    warningEntities,
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
 * Returns both count and detailed entity list
 */
export function findOrphanedEntities(
  _programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[]
): { count: number; entities: OrphanedEntity[] } {
  const entities: OrphanedEntity[] = [];

  // Forms without program
  Object.entries(forms).forEach(([formId, form]) => {
    if (!form.program) {
      entities.push({
        id: formId,
        type: 'form',
        label: form.title,
      });
    }
  });

  // CTAs without form
  Object.entries(ctas).forEach(([ctaId, cta]) => {
    if (!cta.formId) {
      entities.push({
        id: ctaId,
        type: 'cta',
        label: cta.label || cta.text || ctaId,
      });
    }
  });

  // Branches with no CTAs
  Object.entries(branches).forEach(([branchId, branch]) => {
    if (!branch.available_ctas.primary && branch.available_ctas.secondary.length === 0) {
      entities.push({
        id: branchId,
        type: 'branch',
        label: branchId,
      });
    }
  });

  // Action chips without routing
  Object.entries(actionChips).forEach(([chipId, chip]) => {
    if (!chip.target_branch) {
      entities.push({
        id: chipId,
        type: 'actionChip',
        label: chip.label,
      });
    }
  });

  // Showcase items without action
  showcaseItems.forEach((item) => {
    if (!item.action) {
      entities.push({
        id: item.id,
        type: 'showcase',
        label: item.name,
      });
    }
  });

  return { count: entities.length, entities };
}

/**
 * Find broken references (references to non-existent entities)
 * Returns both count and detailed entity list
 */
export function findBrokenReferences(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, ActionChip>,
  showcaseItems: ShowcaseItem[]
): { count: number; entities: BrokenRefEntity[] } {
  const entities: BrokenRefEntity[] = [];

  // Forms referencing non-existent programs
  Object.entries(forms).forEach(([formId, form]) => {
    if (form.program && !programs[form.program]) {
      entities.push({
        id: formId,
        type: 'form',
        label: form.title,
        brokenRefs: [form.program],
      });
    }
  });

  // CTAs referencing non-existent forms
  Object.entries(ctas).forEach(([ctaId, cta]) => {
    if (cta.formId && !forms[cta.formId]) {
      entities.push({
        id: ctaId,
        type: 'cta',
        label: cta.label || cta.text || ctaId,
        brokenRefs: [cta.formId],
      });
    }
  });

  // Branches referencing non-existent CTAs
  Object.entries(branches).forEach(([branchId, branch]) => {
    const brokenRefs: string[] = [];
    if (branch.available_ctas.primary && !ctas[branch.available_ctas.primary]) {
      brokenRefs.push(branch.available_ctas.primary);
    }
    branch.available_ctas.secondary.forEach((ctaId) => {
      if (!ctas[ctaId]) {
        brokenRefs.push(ctaId);
      }
    });
    if (brokenRefs.length > 0) {
      entities.push({
        id: branchId,
        type: 'branch',
        label: branchId,
        brokenRefs,
      });
    }
  });

  // Action chips referencing non-existent branches
  Object.entries(actionChips).forEach(([chipId, chip]) => {
    if (chip.target_branch && !branches[chip.target_branch]) {
      entities.push({
        id: chipId,
        type: 'actionChip',
        label: chip.label,
        brokenRefs: [chip.target_branch],
      });
    }
  });

  // Showcase items referencing non-existent CTAs
  showcaseItems.forEach((item) => {
    if (item.action?.cta_id && !ctas[item.action.cta_id]) {
      entities.push({
        id: item.id,
        type: 'showcase',
        label: item.name,
        brokenRefs: [item.action.cta_id],
      });
    }
  });

  return { count: entities.length, entities };
}
