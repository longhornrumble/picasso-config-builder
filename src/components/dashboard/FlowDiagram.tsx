/**
 * FlowDiagram Component
 * Main container for the visual flow diagram showing config entity relationships
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Zap, Layout } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useConfigStore } from '@/store';
import { EntityList } from './EntityList';
import { buildTreeStructure, countValidationIssues } from './utils';
import type { EntityType } from './types';

/**
 * FlowDiagram Component
 *
 * Displays the configuration structure as an interactive tree diagram
 * organized into three main sections:
 * 1. Programs Hierarchy (programs � forms � CTAs � branches)
 * 2. Action Chips (flat list)
 * 3. Content Showcase (flat list)
 *
 * Features:
 * - Hierarchical tree visualization
 * - Expandable/collapsible nodes
 * - Validation status indicators
 * - Click to navigate to entity editor
 * - Automatically expands top-level entities
 */
export const FlowDiagram: React.FC = () => {
  const navigate = useNavigate();

  // Retrieve entities from Zustand store
  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);
  const actionChips = useConfigStore((state) => state.config.baseConfig?.action_chips?.default_chips || {});
  const showcaseItems = useConfigStore((state) => state.contentShowcase.content_showcase);

  // Retrieve validation state
  const validationErrors = useConfigStore((state) => state.validation.errors);
  const validationWarnings = useConfigStore((state) => state.validation.warnings);

  // Build tree structure
  const { programsTree, actionChipsTree, showcaseTree } = useMemo(
    () =>
      buildTreeStructure(
        programs,
        forms,
        ctas,
        branches,
        actionChips,
        showcaseItems,
        validationErrors,
        validationWarnings
      ),
    [programs, forms, ctas, branches, actionChips, showcaseItems, validationErrors, validationWarnings]
  );

  // Initialize expanded state with all programs (top-level) expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    // Auto-expand all programs
    programsTree.forEach((programNode) => {
      initialExpanded.add(programNode.id);
    });
    return initialExpanded;
  });

  // Toggle expand/collapse for a node
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Navigate to entity editor
  const handleNavigate = useCallback(
    (type: EntityType, id: string) => {
      const routes: Record<EntityType, string> = {
        program: `/programs?selected=${id}`,
        form: `/forms?selected=${id}`,
        cta: `/ctas?selected=${id}`,
        branch: `/branches?selected=${id}`,
        actionChip: `/action-chips?selected=${id}`,
        showcase: `/cards?selected=${id}`,
      };
      navigate(routes[type]);
    },
    [navigate]
  );

  // Calculate validation summaries
  const programsValidation = useMemo(() => countValidationIssues(programsTree), [programsTree]);
  const actionChipsValidation = useMemo(() => countValidationIssues(actionChipsTree), [actionChipsTree]);
  const showcaseValidation = useMemo(() => countValidationIssues(showcaseTree), [showcaseTree]);

  return (
    <div className="space-y-6">
      {/* Programs Hierarchy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Programs Hierarchy
          </CardTitle>
          <CardDescription>
            Programs, their forms, CTAs, and conversation branches
            {programsValidation.errors > 0 && (
              <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                {programsValidation.errors} error{programsValidation.errors !== 1 ? 's' : ''}
              </span>
            )}
            {programsValidation.warnings > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                {programsValidation.warnings} warning{programsValidation.warnings !== 1 ? 's' : ''}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programsTree.length > 0 ? (
            <EntityList
              entities={programsTree}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No programs configured</p>
              <p className="text-xs mt-1">Create a program to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Chips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Action Chips
          </CardTitle>
          <CardDescription>
            Quick action shortcuts with explicit routing
            {actionChipsValidation.errors > 0 && (
              <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                {actionChipsValidation.errors} error{actionChipsValidation.errors !== 1 ? 's' : ''}
              </span>
            )}
            {actionChipsValidation.warnings > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                {actionChipsValidation.warnings} warning{actionChipsValidation.warnings !== 1 ? 's' : ''}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionChipsTree.length > 0 ? (
            <EntityList
              entities={actionChipsTree}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No action chips configured</p>
              <p className="text-xs mt-1">Configure action chips in the Action Chips editor</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Showcase Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            Content Showcase
          </CardTitle>
          <CardDescription>
            Rich content cards displayed to users
            {showcaseValidation.errors > 0 && (
              <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                {showcaseValidation.errors} error{showcaseValidation.errors !== 1 ? 's' : ''}
              </span>
            )}
            {showcaseValidation.warnings > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                {showcaseValidation.warnings} warning{showcaseValidation.warnings !== 1 ? 's' : ''}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showcaseTree.length > 0 ? (
            <EntityList
              entities={showcaseTree}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No showcase items configured</p>
              <p className="text-xs mt-1">Create showcase items in the Content Showcase editor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

FlowDiagram.displayName = 'FlowDiagram';
