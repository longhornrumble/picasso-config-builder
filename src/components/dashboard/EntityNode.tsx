/**
 * EntityNode Component
 * Renders a single entity node in the flow diagram tree
 */

import React, { memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { EntityNodeProps } from './types';
import {
  getEntityIcon,
  getEntityColor,
  getValidationIcon,
  getValidationColor,
  ENTITY_TYPE_CONFIG,
} from './utils';

/**
 * EntityNode Component
 *
 * Displays a single entity node with:
 * - Entity type icon and color
 * - Entity name
 * - Validation status indicator with count badges
 * - Expand/collapse chevron (if has children)
 * - Click handler for navigation
 *
 * Uses React.memo for performance optimization
 */
export const EntityNode = memo<EntityNodeProps>(
  ({ node, depth, isExpanded, onToggleExpand, onNavigate }) => {
    const hasChildren = node.children.length > 0;
    const Icon = getEntityIcon(node.type);
    const colorClasses = getEntityColor(node.type);
    const ValidationIcon = getValidationIcon(node.validationStatus);
    const validationColorClass = getValidationColor(node.validationStatus);
    const config = ENTITY_TYPE_CONFIG[node.type];

    // Calculate left margin based on depth (24px per level)
    const marginLeft = depth * 24;

    // Handle expand/collapse toggle
    const handleToggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggleExpand(node.id);
      }
    };

    // Handle navigation click
    const handleNavigate = () => {
      onNavigate(node.type, node.id);
    };

    return (
      <Card
        className={cn(
          'mb-2 p-3 cursor-pointer transition-all duration-200 hover:shadow-md',
          colorClasses,
          'border-l-4'
        )}
        style={{ marginLeft: `${marginLeft}px` }}
        onClick={handleNavigate}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Chevron */}
          <button
            onClick={handleToggleExpand}
            className={cn(
              'flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              !hasChildren && 'invisible'
            )}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Entity Icon */}
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>

          {/* Entity Name and Type */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{node.name}</div>
            <div className="text-xs opacity-75">{config.label}</div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Error Count Badge */}
            {node.errorCount > 0 && (
              <div className="flex items-center gap-1">
                <ValidationIcon className={cn('w-4 h-4', validationColorClass)} />
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  )}
                >
                  {node.errorCount}
                </span>
              </div>
            )}

            {/* Warning Count Badge */}
            {node.warningCount > 0 && node.errorCount === 0 && (
              <div className="flex items-center gap-1">
                <ValidationIcon className={cn('w-4 h-4', validationColorClass)} />
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  )}
                >
                  {node.warningCount}
                </span>
              </div>
            )}

            {/* Success Indicator (no errors or warnings) */}
            {node.errorCount === 0 && node.warningCount === 0 && node.validationStatus === 'success' && (
              <ValidationIcon className={cn('w-4 h-4', validationColorClass)} />
            )}

            {/* None/Not Validated Indicator */}
            {node.validationStatus === 'none' && (
              <ValidationIcon className={cn('w-4 h-4', validationColorClass)} />
            )}
          </div>

          {/* Children Count Badge */}
          {hasChildren && (
            <div
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {node.children.length}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

EntityNode.displayName = 'EntityNode';
