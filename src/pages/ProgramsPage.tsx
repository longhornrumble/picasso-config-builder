/**
 * ProgramsPage Component
 * Programs editor page - manages program definitions
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { ProgramsEditor } from '@/components/editors/ProgramsEditor';

/**
 * Programs Page
 *
 * Provides interface for managing program definitions.
 * Programs are organizational units that forms can be assigned to.
 *
 * @example
 * ```tsx
 * <ProgramsPage />
 * ```
 */
export const ProgramsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);

  // Show message if no tenant is selected
  if (!tenantId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Programs</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Manage program definitions and eligibility criteria
          </p>
        </div>

        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              Please select a tenant from the header to view and edit programs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the Programs Editor
  return <ProgramsEditor />;
};
