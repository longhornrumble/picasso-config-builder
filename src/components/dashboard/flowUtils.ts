/**
 * Flow Diagram Utilities
 * Graph building and layout logic for conversation flow visualization
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

/**
 * Node data structure for conversation flow entities
 */
export interface FlowNodeData {
  label: string;
  entityData: any;
  hasErrors: boolean;
  isOrphaned: boolean;
  validationStatus: 'error' | 'warning' | 'success' | 'none';
  entityType: 'actionChip' | 'branch' | 'cta' | 'form';
  // Additional metadata
  metadata?: {
    targetBranch?: string;
    keywordCount?: number;
    ctaCount?: number;
    fieldCount?: number;
    actionType?: string;
    targetId?: string;
  };
  // Broken references for this node
  brokenReferences?: BrokenReference[];
}

/**
 * Broken reference information
 */
export interface BrokenReference {
  nodeId: string;
  issue: string;
  referenceType: 'target_branch' | 'formId' | 'available_ctas' | 'on_completion_branch' | 'program';
  referencedId: string; // The missing entity ID
  severity: 'error' | 'warning';
}

/**
 * Build conversation flow graph from config entities
 *
 * Creates nodes and edges representing the conversation journey:
 * Action Chips → Branches → CTAs → Forms/Actions
 *
 * @param actionChips - Record of action chip definitions
 * @param branches - Record of branch definitions
 * @param ctas - Record of CTA definitions
 * @param forms - Record of form definitions
 * @param validationErrors - Record of validation errors by entity ID
 * @param validationWarnings - Record of validation warnings by entity ID
 * @returns Object containing nodes and edges arrays
 */
export function buildConversationFlow(
  actionChips: Record<string, any>,
  branches: Record<string, any>,
  ctas: Record<string, any>,
  forms: Record<string, any>,
  validationErrors: Record<string, any[]>,
  validationWarnings: Record<string, any[]>
): { nodes: Node<FlowNodeData>[], edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  // Helper to get validation status for an entity
  const getValidationStatus = (entityId: string): 'error' | 'warning' | 'success' | 'none' => {
    const hasError = validationErrors[entityId] && validationErrors[entityId].length > 0;
    const hasWarning = validationWarnings[entityId] && validationWarnings[entityId].length > 0;

    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    if (Object.keys(actionChips).length > 0 || Object.keys(branches).length > 0) {
      return 'success';
    }
    return 'none';
  };

  // 1. Create Action Chip nodes
  Object.entries(actionChips).forEach(([chipId, chip]: [string, any]) => {
    const nodeId = `actionchip-${chipId}`;
    nodeIds.add(nodeId);

    nodes.push({
      id: nodeId,
      type: 'actionChip',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        label: chip.label || chip.text || chipId,
        entityData: chip,
        hasErrors: getValidationStatus(chipId) === 'error',
        isOrphaned: false, // Will be calculated later
        validationStatus: getValidationStatus(chipId),
        entityType: 'actionChip',
        metadata: {
          targetBranch: chip.target_branch,
        },
      },
    });
  });

  // 2. Create Branch nodes
  Object.entries(branches).forEach(([branchId, branch]: [string, any]) => {
    const nodeId = `branch-${branchId}`;
    nodeIds.add(nodeId);

    const primaryCtas = branch.available_ctas?.primary || [];
    const secondaryCtas = branch.available_ctas?.secondary || [];
    const ctaCount = primaryCtas.length + secondaryCtas.length;
    const keywordCount = branch.keywords?.length || 0;

    nodes.push({
      id: nodeId,
      type: 'branch',
      position: { x: 0, y: 0 },
      data: {
        label: branch.name || branchId,
        entityData: branch,
        hasErrors: getValidationStatus(branchId) === 'error',
        isOrphaned: false,
        validationStatus: getValidationStatus(branchId),
        entityType: 'branch',
        metadata: {
          keywordCount,
          ctaCount,
        },
      },
    });
  });

  // 3. Create CTA nodes
  Object.entries(ctas).forEach(([ctaId, cta]: [string, any]) => {
    const nodeId = `cta-${ctaId}`;
    nodeIds.add(nodeId);

    nodes.push({
      id: nodeId,
      type: 'cta',
      position: { x: 0, y: 0 },
      data: {
        label: cta.label || cta.button_text || ctaId,
        entityData: cta,
        hasErrors: getValidationStatus(ctaId) === 'error',
        isOrphaned: false,
        validationStatus: getValidationStatus(ctaId),
        entityType: 'cta',
        metadata: {
          actionType: cta.action,
          targetId: cta.formId || cta.target_branch || cta.url,
        },
      },
    });
  });

  // 4. Create Form nodes
  Object.entries(forms).forEach(([formId, form]: [string, any]) => {
    const nodeId = `form-${formId}`;
    nodeIds.add(nodeId);

    const fieldCount = form.fields?.length || 0;

    nodes.push({
      id: nodeId,
      type: 'form',
      position: { x: 0, y: 0 },
      data: {
        label: form.form_name || formId,
        entityData: form,
        hasErrors: getValidationStatus(formId) === 'error',
        isOrphaned: false,
        validationStatus: getValidationStatus(formId),
        entityType: 'form',
        metadata: {
          fieldCount,
          targetBranch: form.on_completion_branch,
        },
      },
    });
  });

  // 5. Create edges
  // 5a. Action Chip → Branch
  Object.entries(actionChips).forEach(([chipId, chip]: [string, any]) => {
    if (chip.target_branch) {
      const sourceId = `actionchip-${chipId}`;
      const targetId = `branch-${chip.target_branch}`;

      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          label: 'target_branch',
        });
      }
    }
  });

  // 5b. Branch → CTA (primary and secondary)
  Object.entries(branches).forEach(([branchId, branch]: [string, any]) => {
    const sourceId = `branch-${branchId}`;

    // Primary CTAs - Ensure it's an array
    const primaryCtas = Array.isArray(branch.available_ctas?.primary)
      ? branch.available_ctas.primary
      : branch.available_ctas?.primary
      ? [branch.available_ctas.primary]
      : [];
    primaryCtas.forEach((ctaId: string) => {
      const targetId = `cta-${ctaId}`;
      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}__primary`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          label: 'primary CTA',
        });
      }
    });

    // Secondary CTAs - Ensure it's an array
    const secondaryCtas = Array.isArray(branch.available_ctas?.secondary)
      ? branch.available_ctas.secondary
      : branch.available_ctas?.secondary
      ? [branch.available_ctas.secondary]
      : [];
    secondaryCtas.forEach((ctaId: string) => {
      const targetId = `cta-${ctaId}`;
      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}__secondary`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          label: 'secondary CTA',
        });
      }
    });
  });

  // 5c. CTA → Form (if action='start_form')
  Object.entries(ctas).forEach(([ctaId, cta]: [string, any]) => {
    if (cta.action === 'start_form' && cta.formId) {
      const sourceId = `cta-${ctaId}`;
      const targetId = `form-${cta.formId}`;

      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: true,
          label: 'start_form',
        });
      }
    }
  });

  // 5d. CTA → Branch (if target_branch exists)
  Object.entries(ctas).forEach(([ctaId, cta]: [string, any]) => {
    if (cta.target_branch) {
      const sourceId = `cta-${ctaId}`;
      const targetId = `branch-${cta.target_branch}`;

      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}__target_branch`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          label: 'target_branch',
        });
      }
    }
  });

  // 5e. Form → Branch (on_completion_branch)
  Object.entries(forms).forEach(([formId, form]: [string, any]) => {
    if (form.on_completion_branch) {
      const sourceId = `form-${formId}`;
      const targetId = `branch-${form.on_completion_branch}`;

      if (nodeIds.has(targetId)) {
        edges.push({
          id: `${sourceId}__${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          label: 'on_completion',
        });
      }
    }
  });

  return { nodes, edges };
}

/**
 * Apply dagre hierarchical layout algorithm
 *
 * Automatically positions nodes in a top-to-bottom flow using dagre
 *
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges connecting nodes
 * @returns Object containing layouted nodes and edges
 */
export function getLayoutedElements(
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): { nodes: Node<FlowNodeData>[], edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: 'TB', // Top to bottom
    align: 'UL', // Upper left alignment
    nodesep: 200, // Horizontal spacing between nodes (increased for readability)
    ranksep: 250, // Vertical spacing between ranks (increased for readability)
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    // Node dimensions (increased for better readability)
    const width = 300; // Increased from 220
    const height = node.type === 'branch' ? 180 : 120; // Increased from 140/100

    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Detect orphaned nodes (nodes with no incoming edges)
 *
 * Entry points (action chips) are excluded from orphan detection
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Set of orphaned node IDs
 */
export function detectOrphanedNodes(
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): Set<string> {
  const orphans = new Set<string>();
  const nodesWithIncoming = new Set<string>();

  // Track nodes with incoming edges
  edges.forEach((edge) => {
    nodesWithIncoming.add(edge.target);
  });

  // Identify orphans (exclude action chips as they are entry points)
  nodes.forEach((node) => {
    if (node.type !== 'actionChip' && !nodesWithIncoming.has(node.id)) {
      orphans.add(node.id);
    }
  });

  return orphans;
}

/**
 * Detect broken references in the flow
 *
 * Enhanced detection that checks for:
 * - Action chips with target_branch that doesn't exist
 * - CTAs with formId that doesn't exist
 * - CTAs with target_branch that doesn't exist
 * - Branches with available_ctas referencing non-existent CTAs
 * - Forms with program that doesn't exist
 * - Forms with on_completion_branch that doesn't exist
 * - Edges pointing to non-existent nodes
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @param config - Configuration objects for validation
 * @returns Array of broken reference information
 */
export function detectBrokenReferences(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  config?: {
    actionChips: Record<string, any>;
    branches: Record<string, any>;
    ctas: Record<string, any>;
    forms: Record<string, any>;
    programs: Record<string, any>;
  }
): BrokenReference[] {
  const brokenRefs: BrokenReference[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Check edges for broken node references
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      brokenRefs.push({
        nodeId: edge.source,
        issue: `Source node not found: ${edge.source}`,
        referenceType: 'target_branch',
        referencedId: edge.source,
        severity: 'error',
      });
    }
    if (!nodeIds.has(edge.target)) {
      brokenRefs.push({
        nodeId: edge.source,
        issue: `Target node not found: ${edge.target}`,
        referenceType: 'target_branch',
        referencedId: edge.target,
        severity: 'error',
      });
    }
  });

  // If config is not provided, only check edges
  if (!config) {
    return brokenRefs;
  }

  const { actionChips, branches, ctas, forms, programs } = config;

  // Check action chips
  Object.entries(actionChips).forEach(([chipId, chip]: [string, any]) => {
    if (chip.target_branch && !branches[chip.target_branch]) {
      brokenRefs.push({
        nodeId: `actionchip-${chipId}`,
        issue: `Action chip references non-existent branch: ${chip.target_branch}`,
        referenceType: 'target_branch',
        referencedId: chip.target_branch,
        severity: 'error',
      });
    }
  });

  // Check branches
  Object.entries(branches).forEach(([branchId, branch]: [string, any]) => {
    // Ensure primary and secondary are arrays
    const primaryCTAs = Array.isArray(branch.available_ctas?.primary)
      ? branch.available_ctas.primary
      : branch.available_ctas?.primary
      ? [branch.available_ctas.primary]
      : [];
    const secondaryCTAs = Array.isArray(branch.available_ctas?.secondary)
      ? branch.available_ctas.secondary
      : branch.available_ctas?.secondary
      ? [branch.available_ctas.secondary]
      : [];
    const allCTAs = [...primaryCTAs, ...secondaryCTAs];

    allCTAs.forEach((ctaId: string) => {
      if (!ctas[ctaId]) {
        brokenRefs.push({
          nodeId: `branch-${branchId}`,
          issue: `Branch references non-existent CTA: ${ctaId}`,
          referenceType: 'available_ctas',
          referencedId: ctaId,
          severity: 'error',
        });
      }
    });
  });

  // Check CTAs
  Object.entries(ctas).forEach(([ctaId, cta]: [string, any]) => {
    // Check formId reference
    if (cta.action === 'start_form' && cta.formId && !forms[cta.formId]) {
      brokenRefs.push({
        nodeId: `cta-${ctaId}`,
        issue: `CTA references non-existent form: ${cta.formId}`,
        referenceType: 'formId',
        referencedId: cta.formId,
        severity: 'error',
      });
    }

    // Check target_branch reference
    if (cta.target_branch && !branches[cta.target_branch]) {
      brokenRefs.push({
        nodeId: `cta-${ctaId}`,
        issue: `CTA references non-existent branch: ${cta.target_branch}`,
        referenceType: 'target_branch',
        referencedId: cta.target_branch,
        severity: 'error',
      });
    }
  });

  // Check forms
  Object.entries(forms).forEach(([formId, form]: [string, any]) => {
    // Check program reference
    if (form.program && !programs[form.program]) {
      brokenRefs.push({
        nodeId: `form-${formId}`,
        issue: `Form references non-existent program: ${form.program}`,
        referenceType: 'program',
        referencedId: form.program,
        severity: 'warning', // Warning since program is not critical for flow
      });
    }

    // Check on_completion_branch reference
    if (form.on_completion_branch && !branches[form.on_completion_branch]) {
      brokenRefs.push({
        nodeId: `form-${formId}`,
        issue: `Form references non-existent completion branch: ${form.on_completion_branch}`,
        referenceType: 'on_completion_branch',
        referencedId: form.on_completion_branch,
        severity: 'error',
      });
    }
  });

  return brokenRefs;
}

/**
 * Update nodes with orphan status
 *
 * @param nodes - Array of nodes
 * @param orphanIds - Set of orphaned node IDs
 * @returns Updated nodes array
 */
export function markOrphanedNodes(
  nodes: Node<FlowNodeData>[],
  orphanIds: Set<string>
): Node<FlowNodeData>[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isOrphaned: orphanIds.has(node.id),
    },
  }));
}

/**
 * Update nodes with broken reference information
 *
 * @param nodes - Array of nodes
 * @param brokenRefs - Array of broken references
 * @returns Updated nodes array with broken references attached
 */
export function markBrokenReferences(
  nodes: Node<FlowNodeData>[],
  brokenRefs: BrokenReference[]
): Node<FlowNodeData>[] {
  // Group broken references by node ID
  const refsByNode = brokenRefs.reduce((acc, ref) => {
    if (!acc[ref.nodeId]) {
      acc[ref.nodeId] = [];
    }
    acc[ref.nodeId].push(ref);
    return acc;
  }, {} as Record<string, BrokenReference[]>);

  // Add broken references to node data
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      brokenReferences: refsByNode[node.id] || [],
      hasErrors: node.data.hasErrors || (refsByNode[node.id] || []).some((r) => r.severity === 'error'),
    },
  }));
}
