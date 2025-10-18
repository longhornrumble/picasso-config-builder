/**
 * DeploymentSummary Component
 * Shows summary of configuration changes before deployment
 */

import React from 'react';
import { ListChecks, FileText, MousePointerClick, GitBranch, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, Badge } from '@/components/ui';
import type { ValidationError } from '@/store/types';

export interface DeploymentSummaryProps {
  tenantId: string;
  programsCount: number;
  formsCount: number;
  ctasCount: number;
  branchesCount: number;
  showcaseCount?: number;
  warnings?: ValidationError[];
  hasChanges?: boolean;
  className?: string;
}

/**
 * Deployment Summary
 *
 * Features:
 * - Entity counts display
 * - Warnings display
 * - Change indicator
 * - Visual entity icons
 *
 * @example
 * ```tsx
 * <DeploymentSummary
 *   tenantId="ABC123"
 *   programsCount={3}
 *   formsCount={5}
 *   ctasCount={10}
 *   branchesCount={7}
 *   showcaseCount={2}
 *   warnings={[]}
 *   hasChanges={true}
 * />
 * ```
 */
export const DeploymentSummary: React.FC<DeploymentSummaryProps> = ({
  tenantId,
  programsCount,
  formsCount,
  ctasCount,
  branchesCount,
  showcaseCount = 0,
  warnings = [],
  hasChanges = false,
  className = '',
}) => {
  const totalEntities = programsCount + formsCount + ctasCount + branchesCount + showcaseCount;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tenant Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Deploying to Tenant
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-base px-3 py-1">
            {tenantId}
          </Badge>
          {hasChanges && (
            <Badge variant="warning" className="text-xs">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Configuration Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Programs */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">Programs</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {programsCount}
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">Forms</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formsCount}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <MousePointerClick className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">CTAs</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {ctasCount}
              </div>
            </div>
          </div>

          {/* Branches */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <GitBranch className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">Branches</div>
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {branchesCount}
              </div>
            </div>
          </div>

          {/* Showcase Items (if any) */}
          {showcaseCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-800 col-span-2">
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600 dark:text-gray-400">Showcase Items</div>
                <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {showcaseCount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Configuration Items
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalEntities}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            Warnings ({warnings.length})
          </h3>
          <Alert variant="warning" className="max-h-40 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-700 dark:text-amber-400">•</span>
                  <span className="flex-1 text-amber-800 dark:text-amber-300">
                    {warning.message}
                    {warning.field && (
                      <span className="ml-1 font-medium">({warning.field})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      )}

      {/* Success Message */}
      {warnings.length === 0 && (
        <Alert variant="success" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Configuration is valid and ready for deployment
          </span>
        </Alert>
      )}

      {/* Deployment Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This will update the tenant configuration in S3. The changes will be immediately
          available to the Picasso widget. Make sure to test the configuration in a staging
          environment before deploying to production.
        </p>
      </div>
    </div>
  );
};
