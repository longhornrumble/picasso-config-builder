/**
 * ConversationFlowDiagram Component
 * Main dashboard flow diagram with flat sections and Flow Statistics card
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { EntityList } from './EntityList';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  Users,
} from 'lucide-react';
import type { TreeNode, ConversationFlowDiagramProps } from './types';
import {
  buildProgramNodes,
  buildFormNodes,
  buildCTANodes,
  buildBranchNodes,
  buildActionChipNodes,
  calculateFlowStatistics,
} from './utils';

/**
 * ConversationFlowDiagram Component
 *
 * Visual representation of the configuration structure with five main sections:
 *
 * 1. **Programs** (at top - all other entities tie back to programs)
 * 2. **Forms**
 * 3. **CTAs**
 * 4. **Branches**
 * 5. **Action Chips**
 *
 * Features:
 * - Flow Statistics card showing metrics overview
 * - Flat lists (no hierarchical nesting)
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
  // Initial state: Only Programs expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['programs'])
  );

  /**
   * Build flat node lists (memoized for performance)
   */
  const programNodes = useMemo(
    () => buildProgramNodes(programs, errors, warnings),
    [programs, errors, warnings]
  );

  const formNodes = useMemo(
    () => buildFormNodes(forms, programs, errors, warnings),
    [forms, programs, errors, warnings]
  );

  const ctaNodes = useMemo(
    () => buildCTANodes(ctas, forms, errors, warnings),
    [ctas, forms, errors, warnings]
  );

  const branchNodes = useMemo(
    () => buildBranchNodes(branches, ctas, errors, warnings),
    [branches, ctas, errors, warnings]
  );

  const actionChipNodes = useMemo(
    () => buildActionChipNodes(actionChips, errors, warnings),
    [actionChips, errors, warnings]
  );

  // Note: showcaseNodes not used in current flat list implementation
  // Keeping build function in utils.ts for potential future use

  /**
   * Calculate flow statistics
   */
  const statistics = useMemo(
    () =>
      calculateFlowStatistics(
        programs,
        forms,
        ctas,
        branches,
        actionChips,
        showcaseItems,
        errors,
        warnings
      ),
    [programs, forms, ctas, branches, actionChips, showcaseItems, errors, warnings]
  );

  /**
   * Toggle section expand/collapse
   */
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  /**
   * Handle navigation to entity
   */
  const handleNavigate = useCallback((node: TreeNode) => {
    // Navigation is handled by EntityNode component via useNavigate
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

  // Section configuration
  const sections = [
    {
      id: 'programs',
      title: 'Programs',
      description: 'Program definitions with metadata and relationships',
      nodes: programNodes,
      count: counts.programs,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'forms',
      title: 'Forms',
      description: 'Conversational forms with field definitions',
      nodes: formNodes,
      count: counts.forms,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'ctas',
      title: 'CTAs',
      description: 'Call-to-action buttons with routing configuration',
      nodes: ctaNodes,
      count: counts.ctas,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'branches',
      title: 'Branches',
      description: 'Conversation flow with priority-based routing',
      nodes: branchNodes,
      count: counts.branches,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'actionChips',
      title: 'Action Chips',
      description: 'Quick action buttons with explicit routing',
      nodes: actionChipNodes,
      count: counts.actionChips,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Flow Statistics Card */}
      <Card className="card-container">
        <CardHeader>
          <CardTitle>Flow Statistics</CardTitle>
          <CardDescription>Overview of conversation flow entities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nodes */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.nodes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Nodes</div>
              </div>
            </div>

            {/* Connections */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.connections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
              </div>
            </div>

            {/* Errors */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.errors}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
              </div>
            </div>

            {/* Warnings */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {statistics.warnings}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</div>
              </div>
            </div>

            {/* Valid */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.valid}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Valid</div>
              </div>
            </div>

            {/* Orphaned */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <MinusCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.orphaned}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Orphaned</div>
              </div>
            </div>

            {/* Broken Refs */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.brokenRefs}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Broken Refs</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Sections */}
      {sections.map((section) => (
        <Card key={section.id} className="card-container">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle>{section.title}</CardTitle>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {expandedSections.has(section.id) ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${section.color}`}>{section.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {section.count === 1 ? section.title.slice(0, -1) : section.title}
                </div>
              </div>
            </div>
          </CardHeader>
          {expandedSections.has(section.id) && (
            <CardContent>
              {section.nodes.length > 0 ? (
                <EntityList
                  nodes={section.nodes}
                  depth={0}
                  expandedIds={new Set()}
                  onToggle={() => {}}
                  onNavigate={handleNavigate}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No {section.title.toLowerCase()} configured yet.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Navigate to the {section.title} editor to add {section.title.toLowerCase()}.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
