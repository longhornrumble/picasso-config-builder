/**
 * ActionChipsPage Component
 * Action Chips editor page with full CRUD functionality
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { ActionChipsEditor } from '@/components/editors/ActionChipsEditor';

/**
 * Action Chips Page
 *
 * Full-featured Action Chips editor with create, read, update, and delete operations
 *
 * @example
 * ```tsx
 * <ActionChipsPage />
 * ```
 */
export const ActionChipsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);

  return (
    <div className="space-y-6">
      {/* No Tenant Selected */}
      {!tenantId ? (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-300">
              Please select a tenant from the header to view and edit Action Chips.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ActionChipsEditor />
      )}
    </div>
  );
};
