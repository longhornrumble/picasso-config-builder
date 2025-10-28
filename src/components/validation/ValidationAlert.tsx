/**
 * ValidationAlert Component
 * Displays inline validation errors and warnings for a specific entity
 *
 * This component fetches validation issues from the global validation store
 * and displays them inline in the entity editor, making it easier to fix
 * issues without switching back to the global validation panel.
 */

import React from 'react';
import { Alert, AlertDescription, Badge } from '@/components/ui';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useConfigStore } from '@/store';

export interface ValidationAlertProps {
  /**
   * Entity ID to fetch validation issues for
   */
  entityId: string;

  /**
   * Show errors, warnings, or both
   * @default 'both'
   */
  show?: 'errors' | 'warnings' | 'both';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Scroll to and focus a field with validation error
 *
 * Exported so it can be used by other components like ValidationPanel
 */
export function scrollToField(fieldName: string) {
  console.log('[ValidationAlert] Attempting to scroll to field:', fieldName);

  // Try multiple strategies to find the field
  const strategies = [
    // Strategy 1: Direct ID match
    () => document.getElementById(fieldName),
    () => document.getElementById(fieldName.replace(/_/g, '-')),

    // Strategy 2: Label match (search for text in label)
    () => {
      const searchText = fieldName.toLowerCase().replace(/_/g, ' ');
      console.log('[ValidationAlert] Searching for label containing:', searchText);
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(l => {
        const text = l.textContent?.toLowerCase() || '';
        return text.includes(searchText);
      });
      if (label) {
        console.log('[ValidationAlert] Found label:', label.textContent);
        // Try to find the associated input
        const labelFor = label.getAttribute('for');
        if (labelFor) {
          return document.getElementById(labelFor);
        }
        // Otherwise find nearest input/select/textarea
        const container = label.closest('div');
        return container?.querySelector('input, select, textarea');
      }
      return null;
    },

    // Strategy 3: Name attribute match
    () => document.querySelector(`[name="${fieldName}"]`),

    // Strategy 4: Partial ID match (for nested fields like "fields[0].id")
    () => {
      const sanitized = fieldName.replace(/\[|\]|\./g, '-');
      return document.getElementById(sanitized);
    },

    // Strategy 5: Look for inputs with IDs containing the field name
    () => {
      const allInputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return allInputs.find(el => {
        const id = el.id?.toLowerCase() || '';
        const name = el.getAttribute('name')?.toLowerCase() || '';
        const fieldLower = fieldName.toLowerCase().replace(/_/g, '-');
        return id.includes(fieldLower) || name.includes(fieldLower);
      }) as HTMLElement;
    },
  ];

  for (let i = 0; i < strategies.length; i++) {
    const element = strategies[i]() as HTMLElement | null;
    if (element) {
      console.log('[ValidationAlert] Found element with strategy', i + 1, ':', element);

      // Scroll into view with smooth behavior
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus the element if it's focusable
      if (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement) {
        setTimeout(() => {
          element.focus();
          console.log('[ValidationAlert] Focused element');
        }, 300);
      }

      // Add a temporary highlight effect
      element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
      }, 2000);

      return true;
    }
  }

  console.warn('[ValidationAlert] Could not find field:', fieldName);
  console.log('[ValidationAlert] Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
  return false;
}

/**
 * ValidationAlert - Inline validation feedback
 *
 * Displays validation errors and warnings for a specific entity,
 * pulled from the global validation store.
 *
 * @example
 * ```tsx
 * <ValidationAlert entityId="volunteer_application" />
 * ```
 */
export function ValidationAlert({
  entityId,
  show = 'both',
  className = '',
}: ValidationAlertProps): React.ReactElement | null {
  const getErrorsForEntity = useConfigStore((state) => state.validation.getErrorsForEntity);
  const getWarningsForEntity = useConfigStore((state) => state.validation.getWarningsForEntity);

  const errors = show === 'warnings' ? [] : getErrorsForEntity(entityId);
  const warnings = show === 'errors' ? [] : getWarningsForEntity(entityId);

  // Don't render if no issues
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <span>Validation Errors</span>
                <Badge variant="error">{errors.length}</Badge>
              </div>
              <ul className="space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                    {error.field ? (
                      <button
                        type="button"
                        onClick={() => scrollToField(error.field!)}
                        className="text-left hover:underline focus:outline-none focus:underline cursor-pointer"
                      >
                        <strong className="font-semibold">{error.field}:</strong> {error.message}
                      </button>
                    ) : (
                      <span>{error.message}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <span>Validation Warnings</span>
                <Badge variant="warning">{warnings.length}</Badge>
              </div>
              <ul className="space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    {warning.field ? (
                      <button
                        type="button"
                        onClick={() => scrollToField(warning.field!)}
                        className="text-left hover:underline focus:outline-none focus:underline cursor-pointer"
                      >
                        <strong className="font-semibold">{warning.field}:</strong> {warning.message}
                      </button>
                    ) : (
                      <span>{warning.message}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * ValidationSummaryBadge - Compact validation status indicator
 *
 * Shows a badge with the count of errors/warnings for an entity.
 * Useful for displaying validation status in lists or cards.
 *
 * @example
 * ```tsx
 * <ValidationSummaryBadge entityId="volunteer_application" />
 * ```
 */
export interface ValidationSummaryBadgeProps {
  entityId: string;
  className?: string;
}

export function ValidationSummaryBadge({
  entityId,
  className = '',
}: ValidationSummaryBadgeProps): React.ReactElement | null {
  const getErrorsForEntity = useConfigStore((state) => state.validation.getErrorsForEntity);
  const getWarningsForEntity = useConfigStore((state) => state.validation.getWarningsForEntity);

  const errors = getErrorsForEntity(entityId);
  const warnings = getWarningsForEntity(entityId);

  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {errors.length > 0 && (
        <Badge variant="error" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors.length}
        </Badge>
      )}
      {warnings.length > 0 && (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {warnings.length}
        </Badge>
      )}
    </div>
  );
}
