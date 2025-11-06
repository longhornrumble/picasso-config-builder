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
  richMetadata?: BranchMetadata | CTAMetadata | FormMetadata | ProgramMetadata | ActionChipMetadata | ShowcaseMetadata;
  statusIcons?: StatusIcon[];
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
  orphanedEntities?: OrphanedEntity[];
  brokenRefEntities?: BrokenRefEntity[];
  errorEntities?: EntityWithIssues[];
  warningEntities?: EntityWithIssues[];
}

// ============================================================================
// ENTITY METADATA
// ============================================================================

/**
 * Rich metadata for branch nodes
 */
export interface BranchMetadata {
  keywordCount: number;
  ctaCount: number;
  primaryCTA?: {
    id: string;
    actionType: 'form_trigger' | 'bedrock_query' | 'external_link';
    label: string;
  };
  secondaryCTAs: Array<{
    id: string;
    actionType: 'form_trigger' | 'bedrock_query' | 'external_link';
    label: string;
  }>;
}

/**
 * Rich metadata for CTA nodes
 */
export interface CTAMetadata {
  actionType: 'form_trigger' | 'bedrock_query' | 'external_link';
  actionTypeLabel: string;
  target?: string;
  targetLabel?: string;
  additionalInfo?: string;
}

/**
 * Rich metadata for form nodes
 */
export interface FormMetadata {
  fieldCount: number;
  programId?: string;
  programName?: string;
  hasCompositeFields: boolean;
}

/**
 * Rich metadata for program nodes
 */
export interface ProgramMetadata {
  description?: string;
  formCount: number;
  formIds: string[];
}

/**
 * Rich metadata for action chip nodes
 */
export interface ActionChipMetadata {
  routingType: 'explicit_route' | 'smart_routing';
  routingTarget?: string;
}

/**
 * Rich metadata for showcase nodes
 */
export interface ShowcaseMetadata {
  categoryTags: string[];
  ctaCount: number;
  ctaIds: string[];
}

// ============================================================================
// STATUS ICONS
// ============================================================================

/**
 * Status icon types
 */
export type StatusIconType = 'error' | 'warning' | 'orphaned' | 'broken_ref' | 'not_validated';

/**
 * Status icon with tooltip
 */
export interface StatusIcon {
  type: StatusIconType;
  icon: string; // Emoji or icon identifier
  tooltip: string;
  color: string;
}

// ============================================================================
// ENTITY LISTS FOR TOOLTIPS
// ============================================================================

/**
 * Orphaned entity reference
 */
export interface OrphanedEntity {
  id: string;
  type: EntityType;
  label: string;
}

/**
 * Entity with broken references
 */
export interface BrokenRefEntity {
  id: string;
  type: EntityType;
  label: string;
  brokenRefs: string[];
}

/**
 * Entity with errors or warnings
 */
export interface EntityWithIssues {
  id: string;
  type: EntityType;
  label: string;
  issueCount: number;
  issues: string[];
}
