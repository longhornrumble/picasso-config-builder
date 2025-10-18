/**
 * EntityValidationBadge Component
 * Inline validation indicator for entity cards in editor lists
 */

import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';
import { useConfigStore } from '@/store';

export interface EntityValidationBadgeProps {
  /** Entity ID to check validation for */
  entityId: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Inline validation indicator badge for entity cards
 *
 * Features:
 * - Small colored dot next to entity name
 * - Red for errors, yellow for warnings, green for valid
 * - Hover tooltip shows error/warning messages
 * - Click to show full validation details
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <EntityValidationBadge entityId="volunteer_app" showTooltip />
 *   <span>Volunteer Application</span>
 * </div>
 * ```
 */
export const EntityValidationBadge: React.FC<EntityValidationBadgeProps> = ({
  entityId,
  showTooltip = true,
  className,
}) => {
  // Get validation state from store
  const errors = useConfigStore((state) => state.validation.errors[entityId] || []);
  const warnings = useConfigStore((state) => state.validation.warnings[entityId] || []);

  // Determine status
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isValid = !hasErrors && !hasWarnings;

  // Build tooltip content
  const tooltipContent = useMemo(() => {
    if (isValid) {
      return 'No validation issues';
    }

    const messages: string[] = [];

    if (hasErrors) {
      messages.push(`${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`);
      // Show first error message
      if (errors[0]) {
        messages.push(`• ${errors[0].message}`);
      }
    }

    if (hasWarnings) {
      messages.push(`${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`);
      // Show first warning message if no errors shown
      if (!hasErrors && warnings[0]) {
        messages.push(`• ${warnings[0].message}`);
      }
    }

    return messages.join('\n');
  }, [errors, warnings, hasErrors, hasWarnings, isValid]);

  // Get icon and color
  const getIcon = () => {
    if (hasErrors) {
      return (
        <AlertCircle
          className={cn('w-4 h-4 text-red-500', className)}
          aria-label="Validation errors"
        />
      );
    }

    if (hasWarnings) {
      return (
        <AlertTriangle
          className={cn('w-4 h-4 text-amber-500', className)}
          aria-label="Validation warnings"
        />
      );
    }

    return (
      <CheckCircle
        className={cn('w-4 h-4 text-green-500', className)}
        aria-label="Valid"
      />
    );
  };

  const icon = getIcon();

  // Wrap in tooltip if enabled
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip content={tooltipContent} side="right">
          {icon}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return icon;
};
