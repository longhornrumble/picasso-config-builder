/**
 * ValidationItem Component
 * Displays a single validation error or warning with click-to-navigate
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ValidationError, ValidationWarning } from '@/lib/validation/types';

export interface ValidationItemProps {
  issue: ValidationError | ValidationWarning;
  entityId: string;
  entityType: 'program' | 'form' | 'cta' | 'branch';
  onClick?: () => void;
}

/**
 * Single validation issue item with navigation
 *
 * @example
 * ```tsx
 * <ValidationItem
 *   issue={error}
 *   entityId="volunteer_app"
 *   entityType="form"
 * />
 * ```
 */
export const ValidationItem: React.FC<ValidationItemProps> = ({
  issue,
  entityId,
  entityType,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to entity editor
      const routes: Record<typeof entityType, string> = {
        program: '/programs',
        form: '/forms',
        cta: '/ctas',
        branch: '/branches',
      };

      navigate(`${routes[entityType]}?id=${entityId}`);
    }
  };

  const getIcon = () => {
    switch (issue.level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTextColor = () => {
    switch (issue.level) {
      case 'error':
        return 'text-red-700 dark:text-red-400';
      case 'warning':
        return 'text-amber-700 dark:text-amber-400';
      case 'info':
        return 'text-blue-700 dark:text-blue-400';
    }
  };

  const getBgColor = () => {
    switch (issue.level) {
      case 'error':
        return 'hover:bg-red-50 dark:hover:bg-red-950/20';
      case 'warning':
        return 'hover:bg-amber-50 dark:hover:bg-amber-950/20';
      case 'info':
        return 'hover:bg-blue-50 dark:hover:bg-blue-950/20';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left p-3 rounded-md transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
        getBgColor()
      )}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Entity ID */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {entityId}
          </div>

          {/* Message */}
          <div className={cn('text-sm mt-0.5', getTextColor())}>
            {issue.message}
          </div>

          {/* Suggested Fix */}
          {issue.suggestedFix && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              → Fix: {issue.suggestedFix}
            </div>
          )}

          {/* Field */}
          {issue.field && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Field: {issue.field}
            </div>
          )}
        </div>

        {/* Navigate Arrow */}
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};
