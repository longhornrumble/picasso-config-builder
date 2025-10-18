/**
 * CardInventoryEditor Component (DEPRECATED)
 *
 * @deprecated This component has been replaced by ContentShowcaseEditor.
 * Use ContentShowcaseEditor from ShowcaseEditor directory instead.
 *
 * This file is kept for backward compatibility but the UI sections have been removed.
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui';
import { Layers, AlertTriangle } from 'lucide-react';

export const CardInventoryEditor: React.FC = () => {

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Card Inventory (Deprecated)
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This editor has been replaced with Content Showcase
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Deprecation Warning */}
          <Alert variant="warning">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>This editor has been deprecated.</strong> Card Inventory has been replaced with Content Showcase.
              Please use the new Content Showcase editor from the Cards page.
            </AlertDescription>
          </Alert>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The Card Inventory system has been simplified into Content Showcase, which uses a simpler
              ad inventory model for managing programs, events, initiatives, and campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
