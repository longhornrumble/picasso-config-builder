/**
 * DashboardPage Component
 * Configuration Flow Diagram - Visual representation of config structure
 */

import React from 'react';
import { Workflow } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { ConversationFlowDiagram } from '@/components/dashboard';

/**
 * Dashboard Page
 *
 * Provides a visual flow diagram of the configuration structure,
 * showing relationships between programs, forms, CTAs, branches,
 * action chips, and showcase items.
 *
 * Features:
 * - Configuration overview with entity counts
 * - Visual flow diagram (Phase 2)
 * - Interactive node navigation (Phase 3)
 * - Export capabilities (Phase 4)
 *
 * @example
 * ```tsx
 * <DashboardPage />
 * ```
 */
export const DashboardPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);
  const actionChips = useConfigStore((state) => state.config.baseConfig?.action_chips?.default_chips || {});
  const showcaseItems = useConfigStore((state) => state.contentShowcase.content_showcase);

  // Calculate entity counts
  const entityCounts = {
    programs: Object.keys(programs).length,
    forms: Object.keys(forms).length,
    ctas: Object.keys(ctas).length,
    branches: Object.keys(branches).length,
    actionChips: Object.keys(actionChips).length,
    showcase: showcaseItems.length,
  };

  const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);

  // Show empty state if no tenant is selected
  if (!tenantId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configuration Flow Diagram
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Visual representation of configuration structure and relationships
          </p>
        </div>

        {/* Empty State */}
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Workflow className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-200">
                Please select a tenant from the header to view the configuration flow diagram.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while config is being loaded
  const isLoading = useConfigStore((state) => state.ui.loading.config);
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configuration Flow Diagram
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Tenant: {tenantId}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if configuration is empty
  if (totalEntities === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configuration Flow Diagram
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Tenant: {tenantId}
          </p>
        </div>

        {/* Empty Configuration State */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                  No configuration data found
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  This tenant has no programs, forms, CTAs, branches, action chips, or showcase items configured yet.
                  Navigate to the respective sections to create configuration entities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100">
          Configuration Flow Diagram
        </h1>
        <p className="text-responsive-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Tenant: <span className="font-medium text-gray-900 dark:text-gray-100">{tenantId}</span>
        </p>
      </div>

      {/* Entity Count Summary */}
      <Card className="card-container">
        <CardHeader>
          <CardTitle>Configuration Overview</CardTitle>
          <CardDescription>
            Summary of all configuration entities for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid-responsive-2-4">
            {/* Programs */}
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {entityCounts.programs}
              </div>
              <div className="text-responsive-sm text-blue-700 dark:text-blue-300 mt-1">
                Programs
              </div>
            </div>

            {/* Forms */}
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {entityCounts.forms}
              </div>
              <div className="text-responsive-sm text-green-700 dark:text-green-300 mt-1">
                Forms
              </div>
            </div>

            {/* CTAs */}
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                {entityCounts.ctas}
              </div>
              <div className="text-responsive-sm text-purple-700 dark:text-purple-300 mt-1">
                CTAs
              </div>
            </div>

            {/* Branches */}
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                {entityCounts.branches}
              </div>
              <div className="text-responsive-sm text-orange-700 dark:text-orange-300 mt-1">
                Branches
              </div>
            </div>

            {/* Action Chips */}
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {entityCounts.actionChips}
              </div>
              <div className="text-responsive-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Action Chips
              </div>
            </div>

            {/* Showcase */}
            <div className="text-center p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800">
              <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400">
                {entityCounts.showcase}
              </div>
              <div className="text-responsive-sm text-pink-700 dark:text-pink-300 mt-1">
                Showcase Items
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Flow Diagram */}
      <ConversationFlowDiagram />
    </div>
  );
};
