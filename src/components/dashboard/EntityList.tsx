/**
 * EntityList Component
 * Recursively renders a list of entity nodes with their children
 */

import React from 'react';
import { EntityNode } from './EntityNode';
import type { EntityListProps } from './types';

/**
 * EntityList Component
 *
 * Renders a list of tree nodes at the same depth level,
 * managing the recursive rendering of nested children.
 *
 * Features:
 * - Renders each entity node
 * - Recursively renders expanded children
 * - Handles empty state
 * - Passes expand/navigate callbacks down the tree
 */
export const EntityList: React.FC<EntityListProps> = ({
  entities,
  depth,
  expandedIds,
  onToggleExpand,
  onNavigate,
}) => {
  // Handle empty state
  if (entities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No entities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entities.map((node) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children.length > 0;

        return (
          <div key={node.id}>
            {/* Render the node */}
            <EntityNode
              node={node}
              depth={depth}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onNavigate={onNavigate}
            />

            {/* Recursively render children if expanded */}
            {hasChildren && isExpanded && (
              <EntityList
                entities={node.children}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onNavigate={onNavigate}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

EntityList.displayName = 'EntityList';
