/**
 * Flow Diagram Dashboard Type Definitions
 *
 * This file contains all TypeScript type definitions for the Flow Diagram Dashboard feature,
 * which visualizes the tenant configuration as a hierarchical tree structure with validation status.
 *
 * The dashboard displays programs, forms, CTAs, branches, action chips, and showcase items
 * in an expandable tree format with real-time validation feedback.
 */

import type { ComponentType } from 'react';
import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  ActionChip,
  ShowcaseItem,
} from '@/types/config';

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

/**
 * Represents the type of entity in the tenant configuration.
 * Used for routing, styling, and filtering in the dashboard.
 */
export type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'actionChip' | 'showcase';

/**
 * Validation status for an entity or tree node.
 * Determines the visual indicator displayed in the dashboard.
 *
 * - 'error': Entity has validation errors (blocking deployment)
 * - 'warning': Entity has validation warnings (non-blocking)
 * - 'success': Entity passed all validations
 * - 'none': Entity has not been validated yet
 */
export type ValidationStatus = 'error' | 'warning' | 'success' | 'none';

// ============================================================================
// TREE NODE STRUCTURE
// ============================================================================

/**
 * Tree node representing an entity in the flow diagram.
 *
 * The tree structure visualizes the relationships between entities:
 * - Programs contain Forms
 * - Forms are triggered by CTAs
 * - Branches contain CTAs and reference Forms
 * - Action Chips can route to Branches
 *
 * Each node maintains its own validation state and can have nested children.
 *
 * @property id - Unique identifier for the entity (e.g., program_id, form_id, cta_id)
 * @property type - Type of entity this node represents
 * @property name - Display name shown in the tree (user-friendly label)
 * @property data - Original entity data from the tenant config
 * @property children - Nested entities (e.g., forms under a program)
 * @property validationStatus - Current validation state of this entity
 * @property errorCount - Number of validation errors for this entity
 * @property warningCount - Number of validation warnings for this entity
 * @property metadata - Optional additional information (e.g., usage count, last modified)
 */
export interface TreeNode {
  /** Unique identifier for the entity */
  id: string;

  /** Type of entity this node represents */
  type: EntityType;

  /** Display name shown in the tree UI */
  name: string;

  /**
   * Original entity data from the tenant configuration.
   * Type varies based on the entity type:
   * - program: Program
   * - form: ConversationalForm
   * - cta: CTADefinition
   * - branch: ConversationBranch
   * - actionChip: ActionChip
   * - showcase: ShowcaseItem
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;

  /** Nested child entities (e.g., forms within a program) */
  children: TreeNode[];

  /** Current validation status for this entity */
  validationStatus: ValidationStatus;

  /** Total number of validation errors */
  errorCount: number;

  /** Total number of validation warnings */
  warningCount: number;

  /**
   * Optional metadata for additional context.
   * Examples: usage count, dependency count, last modified timestamp, etc.
   */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Props for the EntityNode component.
 *
 * EntityNode renders a single node in the tree, including:
 * - Entity icon and name
 * - Validation status indicator
 * - Expand/collapse toggle
 * - Click handler for navigation
 *
 * @property node - The tree node data to render
 * @property depth - Indentation level (0 = root, 1 = first child, etc.)
 * @property isExpanded - Whether this node's children are visible
 * @property onToggleExpand - Callback when expand/collapse is clicked
 * @property onNavigate - Callback when the node is clicked for navigation
 */
export interface EntityNodeProps {
  /** The tree node to render */
  node: TreeNode;

  /** Indentation depth level (starts at 0 for root nodes) */
  depth: number;

  /** Whether this node is currently expanded to show children */
  isExpanded: boolean;

  /** Callback invoked when user clicks the expand/collapse toggle */
  onToggleExpand: (id: string) => void;

  /** Callback invoked when user clicks the node to navigate to the editor */
  onNavigate: (type: EntityType, id: string) => void;
}

/**
 * Props for the EntityList component.
 *
 * EntityList renders a list of tree nodes at the same depth level,
 * managing the recursive rendering of nested children.
 *
 * @property entities - Array of tree nodes to render at this level
 * @property depth - Current indentation depth for these nodes
 * @property expandedIds - Set of node IDs that are currently expanded
 * @property onToggleExpand - Callback when any node's expand/collapse is toggled
 * @property onNavigate - Callback when any node is clicked for navigation
 */
export interface EntityListProps {
  /** Array of tree nodes to render */
  entities: TreeNode[];

  /** Current indentation depth level */
  depth: number;

  /** Set of node IDs that are currently expanded */
  expandedIds: Set<string>;

  /** Callback invoked when expand/collapse is toggled for any node */
  onToggleExpand: (id: string) => void;

  /** Callback invoked when any node is clicked for navigation */
  onNavigate: (type: EntityType, id: string) => void;
}

/**
 * Props for the FlowDiagram component.
 *
 * Currently empty but defined for future extensibility.
 * Future props might include:
 * - Filter options (show only errors, specific entity types)
 * - Sort options (alphabetical, by validation status)
 * - Compact/expanded view modes
 * - Search functionality
 */
export interface FlowDiagramProps {
  // Reserved for future use
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Configuration for a section in the flow diagram.
 *
 * The dashboard is divided into logical sections (Programs, Branches, etc.),
 * each with its own title, icon, and tree nodes.
 *
 * @property title - Section heading displayed in the UI
 * @property icon - Lucide React icon component for visual identification
 * @property nodes - Tree nodes belonging to this section
 * @property initiallyExpanded - Whether this section should be expanded on load
 */
export interface FlowDiagramSection {
  /** Section heading (e.g., "Programs", "Conversation Branches") */
  title: string;

  /** Lucide React icon component to display next to the title */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ComponentType<any>;

  /** Tree nodes belonging to this section */
  nodes: TreeNode[];

  /** Whether this section should be expanded when dashboard first loads */
  initiallyExpanded: boolean;
}

/**
 * Configuration for entity type display and behavior.
 *
 * Defines how each entity type should be rendered and where it should navigate.
 * Used for consistent styling and routing across the dashboard.
 *
 * @property label - Human-readable label (singular form)
 * @property icon - Lucide React icon component for this entity type
 * @property color - Tailwind CSS classes for background, border, and text colors
 * @property route - Navigation route pattern (e.g., '/programs', '/forms')
 */
export interface EntityTypeConfig {
  /** Human-readable label for this entity type (singular) */
  label: string;

  /** Lucide React icon component representing this entity type */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ComponentType<any>;

  /**
   * Tailwind CSS classes for entity styling.
   * Should include bg-, border-, and text- classes for consistent theming.
   * Example: 'bg-green-50 border-green-200 text-green-800'
   */
  color: string;

  /**
   * Navigation route template for this entity type.
   * The specific entity ID will be appended or used as a query parameter.
   * Example: '/programs' or '/forms'
   */
  route: string;
}

// ============================================================================
// RE-EXPORTED CONFIG TYPES
// ============================================================================

/**
 * Re-export core entity types for convenient imports.
 * These types are imported from @/types/config and re-exported here
 * so consumers of dashboard types don't need multiple imports.
 */

export type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  ActionChip,
  ShowcaseItem,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a TreeNode contains a Program entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is a Program
 */
export function isProgram(node: TreeNode): node is TreeNode & { data: Program } {
  return node.type === 'program';
}

/**
 * Type guard to check if a TreeNode contains a ConversationalForm entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is a ConversationalForm
 */
export function isForm(node: TreeNode): node is TreeNode & { data: ConversationalForm } {
  return node.type === 'form';
}

/**
 * Type guard to check if a TreeNode contains a CTADefinition entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is a CTADefinition
 */
export function isCTA(node: TreeNode): node is TreeNode & { data: CTADefinition } {
  return node.type === 'cta';
}

/**
 * Type guard to check if a TreeNode contains a ConversationBranch entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is a ConversationBranch
 */
export function isBranch(node: TreeNode): node is TreeNode & { data: ConversationBranch } {
  return node.type === 'branch';
}

/**
 * Type guard to check if a TreeNode contains an ActionChip entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is an ActionChip
 */
export function isActionChip(node: TreeNode): node is TreeNode & { data: ActionChip } {
  return node.type === 'actionChip';
}

/**
 * Type guard to check if a TreeNode contains a ShowcaseItem entity.
 *
 * @param node - TreeNode to check
 * @returns True if the node's data is a ShowcaseItem
 */
export function isShowcase(node: TreeNode): node is TreeNode & { data: ShowcaseItem } {
  return node.type === 'showcase';
}

// ============================================================================
// UTILITY TYPES FOR IMPLEMENTATION
// ============================================================================

/**
 * Map of entity type to its configuration.
 * Used for O(1) lookup of styling and routing information.
 */
export type EntityTypeConfigMap = Record<EntityType, EntityTypeConfig>;

/**
 * Readonly version of TreeNode for immutable tree structures.
 * Useful for preventing accidental mutations in tree traversal algorithms.
 */
export type ReadonlyTreeNode = Readonly<Omit<TreeNode, 'children'>> & {
  readonly children: readonly ReadonlyTreeNode[];
};

/**
 * Partial TreeNode for building trees incrementally.
 * Used in tree construction utilities where validation data may not be available yet.
 */
export type PartialTreeNode = Omit<TreeNode, 'validationStatus' | 'errorCount' | 'warningCount'> & {
  validationStatus?: ValidationStatus;
  errorCount?: number;
  warningCount?: number;
};
