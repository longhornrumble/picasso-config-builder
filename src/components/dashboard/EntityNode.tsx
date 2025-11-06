/**
 * EntityNode Component
 * Individual node in the flow diagram with expand/collapse, navigation, and validation indicators
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Briefcase,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  Layout,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { EntityNodeProps } from './types';
import { getEntityMetadata, getValidationMetadata, getEntityNavigationUrl } from './utils';

/**
 * Icon mapping for entity types
 */
const ICON_MAP = {
  Briefcase,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  Layout,
} as const;

/**
 * Icon mapping for validation status
 */
const STATUS_ICON_MAP = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  none: MinusCircle,
} as const;

/**
 * EntityNode Component
 *
 * Displays an individual entity node with:
 * - Color-coded card based on entity type
 * - Expand/collapse for nodes with children
 * - Validation status indicator with count badges
 * - Click-to-navigate functionality
 * - Nested depth indication via left padding
 *
 * @example
 * ```tsx
 * <EntityNode
 *   node={programNode}
 *   depth={0}
 *   isExpanded={true}
 *   onToggle={(id) => toggleNode(id)}
 *   onNavigate={(node) => navigateToEntity(node)}
 * />
 * ```
 */
export const EntityNode = React.memo<EntityNodeProps>(
  ({ node, depth, isExpanded, onToggle, onNavigate }) => {
    const navigate = useNavigate();
    const metadata = getEntityMetadata(node.type);
    const validationMeta = getValidationMetadata(node.validationStatus);
    const hasChildren = node.children.length > 0;

    // Get icon components
    const EntityIcon = ICON_MAP[metadata.icon as keyof typeof ICON_MAP];
    const StatusIcon = STATUS_ICON_MAP[node.validationStatus];

    /**
     * Handle node click - navigate to entity editor
     */
    const handleClick = () => {
      const url = getEntityNavigationUrl(node);
      navigate(url);
      onNavigate(node);
    };

    /**
     * Handle expand/collapse toggle
     */
    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    };

    return (
      <div
        className={`
          flex items-start gap-3 p-3 rounded-lg border cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${metadata.color.bg} ${metadata.color.border}
        `}
        style={{ marginLeft: `${depth * 24}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className={`
              flex-shrink-0 mt-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
              transition-colors
            `}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && <div className="w-6" />}

        {/* Entity Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <EntityIcon className={`w-5 h-5 ${metadata.color.text}`} />
        </div>

        {/* Entity Content */}
        <div className="flex-1 min-w-0">
          {/* Label and Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium truncate ${metadata.color.text}`}>{node.label}</h4>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {metadata.label}
            </Badge>
            {hasChildren && (
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {node.children.length}
              </Badge>
            )}
          </div>

          {/* Description */}
          {node.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{node.description}</p>
          )}

          {/* Entity ID (subtle) */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">ID: {node.id}</p>
        </div>

        {/* Validation Status */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Status Icon */}
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md
              ${validationMeta.bgColor}
            `}
          >
            <StatusIcon className={`w-4 h-4 ${validationMeta.color}`} />
            <span className={`text-xs font-medium ${validationMeta.color}`}>
              {validationMeta.label}
            </span>
          </div>

          {/* Error/Warning Count Badges */}
          {node.errorCount > 0 && (
            <Badge variant="error" className="flex-shrink-0">
              {node.errorCount}
            </Badge>
          )}
          {node.warningCount > 0 && (
            <Badge
              variant="warning"
              className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800"
            >
              {node.warningCount}
            </Badge>
          )}
        </div>
      </div>
    );
  }
);

EntityNode.displayName = 'EntityNode';
