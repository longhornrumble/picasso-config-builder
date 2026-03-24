/**
 * TopicDefinitionsPage Component
 * Topic definitions editor page — manages V4.1 classifier topic taxonomy.
 *
 * Topic definitions drive the pipeline:
 *  classifier → topic match → CTA pool selection (by topic tags)
 *
 * This page is gated on tenant selection, matching the pattern used by
 * ProgramsPage, CTAsPage, BranchesPage, etc.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { TopicDefinitionsEditor } from '@/components/editors/TopicDefinitionsEditor';

/**
 * Topic Definitions Page
 *
 * Provides the CRUD interface for managing V4.1 topic definitions.
 * Topics teach the classifier to recognise user intent and select the right
 * CTAs from the pool based on matching tags.
 *
 * @example
 * ```tsx
 * <TopicDefinitionsPage />
 * ```
 */
export const TopicDefinitionsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);

  // Show a message when no tenant is loaded — matches the pattern in ProgramsPage
  if (!tenantId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Topic Definitions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Manage V4.1 classifier topics and CTA pool selection rules
          </p>
        </div>

        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              Please select a tenant from the header to view and edit topic definitions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tenant loaded — render the Topics editor
  return <TopicDefinitionsEditor />;
};
