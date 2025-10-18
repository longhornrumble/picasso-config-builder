/**
 * ValidationEmptyState Component
 * Shows when no validation issues exist
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Empty state for validation panel when no issues exist
 *
 * @example
 * ```tsx
 * <ValidationEmptyState />
 * ```
 */
export const ValidationEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        All Clear!
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        No validation errors or warnings found. Your configuration looks good!
      </p>
    </div>
  );
};
