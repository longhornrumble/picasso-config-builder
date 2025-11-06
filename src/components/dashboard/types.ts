/**
 * Dashboard Flow Diagram Types
 * Type definitions for visual flow diagram components
 */

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Entity types in the config hierarchy
 */
export type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'actionChip' | 'showcase';

/**
 * Validation status for entities
 */
export type ValidationStatus = 'error' | 'warning' | 'success' | 'none';

// ============================================================================
// TREE NODE STRUCTURE
// ============================================================================

/**
 * Tree node representing an entity in the flow diagram
 */
export interface TreeNode {
  id: string;
  type: EntityType;
  label: string;
  description?: string;
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
  children: TreeNode[];
  metadata?: Record<string, any>;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for EntityNode component
 */
export interface EntityNodeProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  onNavigate: (node: TreeNode) => void;
}

/**
 * Props for EntityList component
 */
export interface EntityListProps {
  nodes: TreeNode[];
  depth?: number;
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  onNavigate: (node: TreeNode) => void;
}

/**
 * Props for ConversationFlowDiagram component
 */
export interface ConversationFlowDiagramProps {
  className?: string;
}

// ============================================================================
// ENTITY METADATA
// ============================================================================

/**
 * Entity type metadata for styling and icons
 */
export interface EntityTypeMetadata {
  color: {
    bg: string;
    border: string;
    text: string;
  };
  icon: string; // Lucide icon name
  label: string;
  pluralLabel: string;
  route: string;
}

/**
 * Validation status metadata for styling
 */
export interface ValidationStatusMetadata {
  color: string;
  bgColor: string;
  label: string;
}

// ============================================================================
// FLOW STATISTICS
// ============================================================================

/**
 * Flow statistics metrics for dashboard overview
 */
export interface FlowStatistics {
  nodes: number;
  connections: number;
  errors: number;
  warnings: number;
  valid: number;
  orphaned: number;
  brokenRefs: number;
}
