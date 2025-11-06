/**
 * Dashboard Components Barrel Export
 * Exports all dashboard-related components, types, and utilities
 */

// Main component
export { FlowDiagram } from './FlowDiagram';

// Sub-components
export { EntityNode } from './EntityNode';
export { EntityList } from './EntityList';

// Types
export type {
  EntityType,
  ValidationStatus,
  TreeNode,
  EntityNodeProps,
  EntityListProps,
  FlowDiagramProps,
  FlowDiagramSection,
  EntityTypeConfig,
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
  ActionChip,
  ShowcaseItem,
} from './types';

// Type guards
export {
  isProgram,
  isForm,
  isCTA,
  isBranch,
  isActionChip,
  isShowcase,
} from './types';

// Utilities
export {
  buildTreeStructure,
  getEntityIcon,
  getEntityColor,
  getEntityRoute,
  getValidationIcon,
  getValidationColor,
  getValidationStatus,
  countTreeNodes,
  collectNodeIdsAtDepth,
  findNodeById,
  getAncestorIds,
  countValidationIssues,
  ENTITY_TYPE_CONFIG,
} from './utils';
