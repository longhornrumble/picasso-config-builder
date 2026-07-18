/**
 * ValidationItem Component
 * Displays a single validation error or warning with click-to-navigate,
 * plus inline one-click fixes for repairable issues.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, ChevronRight, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useConfigStore } from '@/store';
import { Select } from '@/components/ui/Select';
import type { ValidationError, ValidationWarning } from '@/lib/validation/types';

export interface ValidationItemProps {
  issue: ValidationError | ValidationWarning;
  entityId: string;
  entityType: 'program' | 'form' | 'cta' | 'branch';
  onClick?: () => void;
}

/**
 * Relationship-validation entity ids carry a type prefix
 * (e.g. "form-donation_inquiry") — strip it to get the dictionary key.
 */
const bareEntityId = (entityId: string): string =>
  entityId.replace(/^(program|form|cta|branch)-/, '');

/**
 * Single validation issue item with navigation and inline fixes
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

  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const updateForm = useConfigStore((state) => state.forms.updateForm);
  const addToast = useConfigStore((state) => state.ui.addToast);

  const targetId = bareEntityId(entityId);

  // Inline fix: a form missing its program gets a program picker right in the
  // panel — picking one applies the fix and re-validates immediately.
  const isFixableProgramIssue =
    entityType === 'form' &&
    issue.field === 'program' &&
    targetId in forms &&
    !forms[targetId]?.program &&
    Object.keys(programs).length > 0;

  const handleAssignProgram = (programId: string) => {
    updateForm(targetId, { program: programId });
    addToast({
      type: 'success',
      message: `Assigned "${targetId}" to program "${programs[programId]?.program_name || programId}"`,
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Map entity type to route
    const routes: Record<typeof entityType, string> = {
      program: '/programs',
      form: '/forms',
      cta: '/ctas',
      branch: '/branches',
    };

    const targetRoute = routes[entityType];

    // Navigate to the entity page with the entity ID and field to scroll to
    // The editor will automatically open the modal and scroll to the field
    const params = new URLSearchParams();
    params.set('editId', targetId);
    if (issue.field) {
      params.set('scrollTo', issue.field);
    }

    navigate(`${targetRoute}?${params.toString()}`);
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
    <div className="rounded-md">
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

      {/* Inline fix: assign a program without leaving the panel */}
      {isFixableProgramIssue && (
        <div className="flex items-center gap-2 px-3 pb-3 pl-9">
          <Wrench className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <Select
            placeholder="Assign a program…"
            options={Object.entries(programs).map(([id, program]) => ({
              value: id,
              label: program.program_name || id,
            }))}
            onValueChange={handleAssignProgram}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
};
