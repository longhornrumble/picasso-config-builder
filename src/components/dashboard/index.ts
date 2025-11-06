/**
 * Dashboard Components Barrel Export
 * Centralized export point for all dashboard flow diagram components
 */

export { ConversationFlowDiagram } from './ConversationFlowDiagram';
export { EntityNode } from './EntityNode';
export { EntityList } from './EntityList';

export type {
  EntityType,
  ValidationStatus,
  TreeNode,
  EntityNodeProps,
  EntityListProps,
  ConversationFlowDiagramProps,
  EntityTypeMetadata,
  ValidationStatusMetadata,
  FlowStatistics,
} from './types';

export {
  buildTreeStructure,
  buildProgramNodes,
  buildFormNodes,
  buildCTANodes,
  buildBranchNodes,
  buildActionChipNodes,
  buildShowcaseNodes,
  calculateValidationStatus,
  calculateFlowStatistics,
  getEntityNavigationUrl,
  getEntityMetadata,
  getValidationMetadata,
  ENTITY_TYPE_METADATA,
  VALIDATION_STATUS_METADATA,
} from './utils';
