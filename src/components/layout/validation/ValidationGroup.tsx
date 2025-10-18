/**
 * ValidationGroup Component
 * Groups validation issues by entity type with collapsible header
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ValidationItem } from './ValidationItem';
import type { ValidationError, ValidationWarning } from '@/lib/validation/types';
import type { EntityType } from '@/lib/validation/types';

export interface ValidationGroupProps {
  title: string;
  entityType: EntityType;
  issues: Array<{
    entityId: string;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }>;
  defaultExpanded?: boolean;
}

/**
 * Collapsible group of validation issues by entity type
 *
 * @example
 * ```tsx
 * <ValidationGroup
 *   title="Forms"
 *   entityType="form"
 *   issues={formIssues}
 *   defaultExpanded
 * />
 * ```
 */
export const ValidationGroup: React.FC<ValidationGroupProps> = ({
  title,
  entityType,
  issues,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate counts
  const totalErrors = issues.reduce((sum, item) => sum + item.errors.length, 0);
  const totalWarnings = issues.reduce((sum, item) => sum + item.warnings.length, 0);
  const totalIssues = totalErrors + totalWarnings;

  if (totalIssues === 0) {
    return null;
  }

  // Map entity types to valid navigation types
  const getNavigationType = (): 'program' | 'form' | 'cta' | 'branch' => {
    switch (entityType) {
      case 'program':
        return 'program';
      case 'form':
        return 'form';
      case 'cta':
        return 'cta';
      case 'branch':
        return 'branch';
      default:
        return 'form'; // fallback
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}

          {/* Title */}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>

          {/* Counts */}
          <div className="flex items-center gap-2">
            {totalErrors > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-100">
                {totalErrors} {totalErrors === 1 ? 'error' : 'errors'}
              </span>
            )}
            {totalWarnings > 0 && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900 dark:text-amber-100">
                {totalWarnings} {totalWarnings === 1 ? 'warning' : 'warnings'}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {issues.map((item) => (
            <div key={item.entityId} className="space-y-2">
              {/* Errors */}
              {item.errors.map((error, idx) => (
                <ValidationItem
                  key={`error-${idx}`}
                  issue={error}
                  entityId={item.entityId}
                  entityType={getNavigationType()}
                />
              ))}

              {/* Warnings */}
              {item.warnings.map((warning, idx) => (
                <ValidationItem
                  key={`warning-${idx}`}
                  issue={warning}
                  entityId={item.entityId}
                  entityType={getNavigationType()}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
