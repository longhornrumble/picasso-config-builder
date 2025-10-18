/**
 * BranchesPage Component
 * Conversation branches editor page with full CRUD functionality
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { BranchesEditor } from '@/components/editors/BranchesEditor';

/**
 * Branches Page
 *
 * Displays the BranchesEditor component for managing conversation routing
 *
 * @example
 * ```tsx
 * <BranchesPage />
 * ```
 */
export const BranchesPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);

  return (
    <div className="space-y-6">
      {/* No Tenant Selected */}
      {!tenantId ? (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-300">
              Please select a tenant from the header to view and edit branches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <BranchesEditor />
      )}
    </div>
  );
};
