/**
 * Dashboard Flow Diagram Utilities
 * Tree building and entity manipulation utilities for the flow diagram
 */

import {
  Briefcase,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  Layout,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type {
  TreeNode,
  EntityType,
  ValidationStatus,
  EntityTypeConfig,
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  ShowcaseItem,
} from './types';
import type { ValidationError } from '@/store/types';

// ============================================================================
// ENTITY TYPE CONFIGURATION
// ============================================================================

/**
 * Configuration map for entity types with their display properties
 */
export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeConfig> = {
  program: {
    label: 'Program',
    icon: Briefcase,
    color: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
    route: '/programs',
  },
  form: {
    label: 'Form',
    icon: FileText,
    color: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
    route: '/forms',
  },
  cta: {
    label: 'CTA',
    icon: MousePointerClick,
    color: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300',
    route: '/ctas',
  },
  branch: {
    label: 'Branch',
    icon: GitBranch,
    color: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300',
    route: '/branches',
  },
  actionChip: {
    label: 'Action Chip',
    icon: Zap,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-300',
    route: '/action-chips',
  },
  showcase: {
    label: 'Showcase',
    icon: Layout,
    color: 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-300',
    route: '/cards',
  },
};

/**
 * Get the icon component for a given entity type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEntityIcon(entityType: EntityType): any {
  return ENTITY_TYPE_CONFIG[entityType].icon;
}

/**
 * Get the color classes for a given entity type
 */
export function getEntityColor(entityType: EntityType): string {
  return ENTITY_TYPE_CONFIG[entityType].color;
}

/**
 * Get the navigation route for a given entity type
 */
export function getEntityRoute(entityType: EntityType): string {
  return ENTITY_TYPE_CONFIG[entityType].route;
}

// ============================================================================
// VALIDATION STATUS UTILITIES
// ============================================================================

/**
 * Get the icon for a validation status
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValidationIcon(status: ValidationStatus): any {
  switch (status) {
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'success':
      return CheckCircle;
    case 'none':
    default:
      return CheckCircle;
  }
}

/**
 * Get the color class for a validation status
 */
export function getValidationColor(status: ValidationStatus): string {
  switch (status) {
    case 'error':
      return 'text-red-600 dark:text-red-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'none':
    default:
      return 'text-gray-400 dark:text-gray-600';
  }
}

/**
 * Calculate validation status for an entity based on errors and warnings
 */
export function getValidationStatus(
  _entityType: EntityType,
  entityId: string,
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): { status: ValidationStatus; errorCount: number; warningCount: number } {
  const entityErrors = errors[entityId] || [];
  const entityWarnings = warnings[entityId] || [];

  const errorCount = entityErrors.length;
  const warningCount = entityWarnings.length;

  let status: ValidationStatus = 'success';
  if (errorCount > 0) {
    status = 'error';
  } else if (warningCount > 0) {
    status = 'warning';
  } else if (Object.keys(errors).length === 0 && Object.keys(warnings).length === 0) {
    // No validation has been run yet
    status = 'none';
  }

  return { status, errorCount, warningCount };
}

// ============================================================================
// TREE BUILDING UTILITIES
// ============================================================================

/**
 * Build a hierarchical tree structure from flat entity lists
 *
 * Tree structure:
 * - Programs (top-level)
 *   - Forms (grouped by program_id)
 *     - CTAs (grouped by formId)
 *       - Branches (if CTA is in branch.available_ctas)
 * - Action Chips (flat list)
 * - Showcase Items (flat list)
 */
export function buildTreeStructure(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>,
  actionChips: Record<string, unknown>,
  showcaseItems: ShowcaseItem[],
  errors: Record<string, ValidationError[]>,
  warnings: Record<string, ValidationError[]>
): {
  programsTree: TreeNode[];
  actionChipsTree: TreeNode[];
  showcaseTree: TreeNode[];
} {
  // Build CTA to Branches mapping
  const ctaToBranches = new Map<string, string[]>();
  Object.entries(branches).forEach(([branchId, branch]) => {
    // Add primary CTA
    if (branch.available_ctas.primary) {
      if (!ctaToBranches.has(branch.available_ctas.primary)) {
        ctaToBranches.set(branch.available_ctas.primary, []);
      }
      ctaToBranches.get(branch.available_ctas.primary)!.push(branchId);
    }

    // Add secondary CTAs
    branch.available_ctas.secondary.forEach((ctaId) => {
      if (!ctaToBranches.has(ctaId)) {
        ctaToBranches.set(ctaId, []);
      }
      ctaToBranches.get(ctaId)!.push(branchId);
    });
  });

  // Build Form to CTAs mapping
  const formToCtas = new Map<string, string[]>();
  Object.entries(ctas).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_form' && cta.formId) {
      if (!formToCtas.has(cta.formId)) {
        formToCtas.set(cta.formId, []);
      }
      formToCtas.get(cta.formId)!.push(ctaId);
    }
  });

  // Build Program to Forms mapping
  const programToForms = new Map<string, string[]>();
  Object.entries(forms).forEach(([formId, form]) => {
    if (form.program) {
      if (!programToForms.has(form.program)) {
        programToForms.set(form.program, []);
      }
      programToForms.get(form.program)!.push(formId);
    }
  });

  // Build Branch nodes
  const buildBranchNode = (branchId: string): TreeNode => {
    const branch = branches[branchId];
    const validation = getValidationStatus('branch', branchId, errors, warnings);

    return {
      id: branchId,
      type: 'branch',
      name: `Branch: ${branchId}`,
      data: branch,
      children: [],
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  };

  // Build CTA nodes with their branches
  const buildCtaNode = (ctaId: string): TreeNode => {
    const cta = ctas[ctaId];
    const validation = getValidationStatus('cta', ctaId, errors, warnings);

    // Get branches that use this CTA
    const branchIds = ctaToBranches.get(ctaId) || [];
    const branchNodes = branchIds.map(buildBranchNode);

    return {
      id: ctaId,
      type: 'cta',
      name: cta.label || ctaId,
      data: cta,
      children: branchNodes,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  };

  // Build Form nodes with their CTAs
  const buildFormNode = (formId: string): TreeNode => {
    const form = forms[formId];
    const validation = getValidationStatus('form', formId, errors, warnings);

    // Get CTAs that reference this form
    const ctaIds = formToCtas.get(formId) || [];
    const ctaNodes = ctaIds.map(buildCtaNode);

    return {
      id: formId,
      type: 'form',
      name: form.title || formId,
      data: form,
      children: ctaNodes,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  };

  // Build Program nodes with their forms
  const buildProgramNode = (programId: string): TreeNode => {
    const program = programs[programId];
    const validation = getValidationStatus('program', programId, errors, warnings);

    // Get forms for this program
    const formIds = programToForms.get(programId) || [];
    const formNodes = formIds.map(buildFormNode);

    return {
      id: programId,
      type: 'program',
      name: program.program_name || programId,
      data: program,
      children: formNodes,
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  };

  // Build Programs tree
  const programsTree = Object.keys(programs).map(buildProgramNode);

  // Build Action Chips tree (flat list)
  const actionChipsTree: TreeNode[] = Object.entries(actionChips).map(([chipId, chipData]) => {
    const validation = getValidationStatus('actionChip', chipId, errors, warnings);

    return {
      id: chipId,
      type: 'actionChip' as EntityType,
      name: chipId,
      data: chipData,
      children: [],
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  });

  // Build Showcase tree (flat list)
  const showcaseTree: TreeNode[] = showcaseItems.map((item) => {
    const validation = getValidationStatus('showcase', item.id, errors, warnings);

    return {
      id: item.id,
      type: 'showcase' as EntityType,
      name: item.name || item.id,
      data: item,
      children: [],
      validationStatus: validation.status,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
    };
  });

  return {
    programsTree,
    actionChipsTree,
    showcaseTree,
  };
}

/**
 * Count total entities in a tree
 */
export function countTreeNodes(nodes: TreeNode[]): number {
  let count = nodes.length;
  nodes.forEach((node) => {
    count += countTreeNodes(node.children);
  });
  return count;
}

/**
 * Collect all entity IDs at a specific depth
 */
export function collectNodeIdsAtDepth(nodes: TreeNode[], targetDepth: number, currentDepth = 0): string[] {
  if (currentDepth === targetDepth) {
    return nodes.map((node) => node.id);
  }

  const ids: string[] = [];
  nodes.forEach((node) => {
    ids.push(...collectNodeIdsAtDepth(node.children, targetDepth, currentDepth + 1));
  });
  return ids;
}

/**
 * Find a node by ID in a tree
 */
export function findNodeById(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const found = findNodeById(node.children, id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Get all ancestor IDs for a node (useful for auto-expanding parent nodes)
 */
export function getAncestorIds(nodes: TreeNode[], targetId: string, ancestors: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return ancestors;
    }
    const found = getAncestorIds(node.children, targetId, [...ancestors, node.id]);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Count validation issues in a tree (recursive)
 */
export function countValidationIssues(nodes: TreeNode[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;

  nodes.forEach((node) => {
    errors += node.errorCount;
    warnings += node.warningCount;

    const childIssues = countValidationIssues(node.children);
    errors += childIssues.errors;
    warnings += childIssues.warnings;
  });

  return { errors, warnings };
}
