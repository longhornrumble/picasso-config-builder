/**
 * ConversationFlowDiagram Component
 * Main dashboard flow diagram with three sections: Programs Hierarchy, Action Chips, Content Showcase
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { EntityList } from './EntityList';
import type { TreeNode, ConversationFlowDiagramProps } from './types';
import {
  buildTreeStructure,
  buildActionChipNodes,
  buildShowcaseNodes,
} from './utils';

/**
 * ConversationFlowDiagram Component
 *
 * Visual representation of the configuration structure with three main sections:
 *
 * 1. **Programs Hierarchy**
 *    - Programs → Forms → CTAs → Branches
 *    - Tree view with expand/collapse
 *    - Initial state: Programs visible, forms collapsed
 *
 * 2. **Action Chips**
 *    - Flat list of all action chips
 *    - Shows routing configuration
 *    - Validation status indicators
 *
 * 3. **Content Showcase**
 *    - Flat list of showcase items
 *    - Shows referenced CTAs
 *    - Category and visibility information
 *
 * Features:
 * - Color-coded entities by type
 * - Validation status indicators (error, warning, success)
 * - Click-to-navigate to entity editors
 * - Entity count badges
 * - Responsive design with mobile support
 *
 * @example
 * ```tsx
 * <ConversationFlowDiagram />
 * ```
 */
export const ConversationFlowDiagram: React.FC<ConversationFlowDiagramProps> = ({
  className = '',
}) => {
  // Get data from store
  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);
  const actionChips = useConfigStore(
    (state) => state.config.baseConfig?.action_chips?.default_chips || {}
  );
  const showcaseItems = useConfigStore((state) => state.contentShowcase.content_showcase);
  const errors = useConfigStore((state) => state.validation.errors);
  const warnings = useConfigStore((state) => state.validation.warnings);

  // Expand/collapse state
  // Initial state: Only top-level programs are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    // Expand all programs by default
    Object.keys(programs).forEach((programId) => {
      initialExpanded.add(programId);
    });
    return initialExpanded;
  });

  /**
   * Build tree structures (memoized for performance)
   */
  const programTree = useMemo(
    () => buildTreeStructure(programs, forms, ctas, branches, errors, warnings),
    [programs, forms, ctas, branches, errors, warnings]
  );

  const actionChipNodes = useMemo(
    () => buildActionChipNodes(actionChips, errors, warnings),
    [actionChips, errors, warnings]
  );

  const showcaseNodes = useMemo(
    () => buildShowcaseNodes(showcaseItems, errors, warnings),
    [showcaseItems, errors, warnings]
  );

  /**
   * Toggle expand/collapse for a node
   */
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  /**
   * Handle navigation to entity
   */
  const handleNavigate = useCallback((node: TreeNode) => {
    // Navigation is handled by EntityNode component via useNavigate
    // This callback is for future extensibility (e.g., analytics tracking)
    console.log('Navigating to:', node.type, node.id);
  }, []);

  /**
   * Calculate total counts for each section
   */
  const counts = useMemo(() => {
    return {
      programs: Object.keys(programs).length,
      forms: Object.keys(forms).length,
      ctas: Object.keys(ctas).length,
      branches: Object.keys(branches).length,
      actionChips: Object.keys(actionChips).length,
      showcase: showcaseItems.length,
    };
  }, [programs, forms, ctas, branches, actionChips, showcaseItems]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Programs Hierarchy Section */}
      <Card className="card-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Programs Hierarchy</CardTitle>
              <CardDescription>
                Programs with nested forms, CTAs, and conversation branches
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {counts.programs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {counts.programs === 1 ? 'Program' : 'Programs'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {programTree.length > 0 ? (
            <EntityList
              nodes={programTree}
              depth={0}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No programs configured yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Create a program to get started with building your configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Chips Section */}
      <Card className="card-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Action Chips</CardTitle>
              <CardDescription>
                Quick action buttons with explicit routing configuration
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {counts.actionChips}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {counts.actionChips === 1 ? 'Chip' : 'Chips'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {actionChipNodes.length > 0 ? (
            <EntityList
              nodes={actionChipNodes}
              depth={0}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No action chips configured yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Navigate to Action Chips editor to add quick action buttons.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Showcase Section */}
      <Card className="card-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Showcase</CardTitle>
              <CardDescription>
                Featured programs, events, and campaigns with rich media
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {counts.showcase}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {counts.showcase === 1 ? 'Item' : 'Items'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showcaseNodes.length > 0 ? (
            <EntityList
              nodes={showcaseNodes}
              depth={0}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No showcase items configured yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Navigate to Content Showcase editor to create featured content cards.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
