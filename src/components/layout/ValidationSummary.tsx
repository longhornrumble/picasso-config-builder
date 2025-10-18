/**
 * ValidationSummary Component
 * Compact validation status badge for header with click to expand panel
 */

import React, { useMemo } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { useConfigStore } from '@/store';

export interface ValidationSummaryProps {
  /** Click handler (typically to expand ValidationPanel) */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Show detailed counts */
  showCounts?: boolean;
}

/**
 * Compact validation status badge
 *
 * Features:
 * - Shows overall status (Valid, Warnings, Errors)
 * - Color-coded badge
 * - Optional counts display
 * - Click to expand validation panel
 *
 * @example
 * ```tsx
 * <ValidationSummary onClick={() => setShowPanel(true)} showCounts />
 * ```
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  onClick,
  className,
  showCounts = true,
}) => {
  // Get validation state from store
  const errors = useConfigStore((state) => state.validation.errors);
  const warnings = useConfigStore((state) => state.validation.warnings);
  const lastValidated = useConfigStore((state) => state.validation.lastValidated);

  // Calculate total counts
  const totalErrors = useMemo(() => {
    return Object.values(errors).reduce(
      (sum, entityErrors) => sum + (entityErrors?.length || 0),
      0
    );
  }, [errors]);

  const totalWarnings = useMemo(() => {
    return Object.values(warnings).reduce(
      (sum, entityWarnings) => sum + (entityWarnings?.length || 0),
      0
    );
  }, [warnings]);

  // Don't render if no validation has been run
  if (lastValidated === null) {
    return null;
  }

  // Determine variant and content
  const getVariant = (): 'success' | 'error' | 'warning' => {
    if (totalErrors > 0) return 'error';
    if (totalWarnings > 0) return 'warning';
    return 'success';
  };

  const getIcon = () => {
    if (totalErrors > 0) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (totalWarnings > 0) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  const getText = () => {
    if (totalErrors > 0) {
      if (showCounts) {
        return `${totalErrors} ${totalErrors === 1 ? 'Error' : 'Errors'}${
          totalWarnings > 0 ? `, ${totalWarnings} Warning${totalWarnings > 1 ? 's' : ''}` : ''
        }`;
      }
      return 'Errors';
    }

    if (totalWarnings > 0) {
      if (showCounts) {
        return `${totalWarnings} ${totalWarnings === 1 ? 'Warning' : 'Warnings'}`;
      }
      return 'Warnings';
    }

    return 'Valid';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full',
        'transition-transform hover:scale-105',
        className
      )}
    >
      <Badge variant={getVariant()} size="md" icon={getIcon()}>
        {getText()}
      </Badge>
    </button>
  );
};
