/**
 * EntityList Component
 * Recursive list renderer for tree structure of entities
 */

import React from 'react';
import { EntityNode } from './EntityNode';
import type { EntityListProps } from './types';

/**
 * EntityList Component
 *
 * Recursively renders a list of tree nodes with expand/collapse functionality.
 * Handles nested entities (e.g., Programs → Forms → CTAs → Branches).
 *
 * Features:
 * - Recursive rendering of nested children
 * - Proper depth tracking for indentation
 * - Expand/collapse state management
 * - Click-to-navigate functionality
 *
 * @example
 * ```tsx
 * <EntityList
 *   nodes={programNodes}
 *   depth={0}
 *   expandedIds={expandedSet}
 *   onToggle={handleToggle}
 *   onNavigate={handleNavigate}
 * />
 * ```
 */
export const EntityList: React.FC<EntityListProps> = ({
  nodes,
  depth = 0,
  expandedIds,
  onToggle,
  onNavigate,
}) => {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children.length > 0;

        return (
          <div key={node.id}>
            {/* Render the node */}
            <EntityNode
              node={node}
              depth={depth}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />

            {/* Recursively render children if expanded */}
            {hasChildren && isExpanded && (
              <div className="mt-2">
                <EntityList
                  nodes={node.children}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
