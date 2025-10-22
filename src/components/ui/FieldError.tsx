/**
 * FieldError Component
 *
 * Shows field-level validation errors with clear visual feedback
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  showSuccess?: boolean;
  className?: string;
}

/**
 * Field-level error component
 *
 * @example
 * ```tsx
 * <Input {...field} />
 * <FieldError error={errors.email} touched={touched.email} />
 * ```
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  touched,
  showSuccess = false,
  className,
}) => {
  // Only show error if field has been touched
  const showError = touched && error;

  // Show success if field is touched, valid, and showSuccess is enabled
  const showSuccessIndicator = touched && !error && showSuccess;

  if (!showError && !showSuccessIndicator) {
    return null;
  }

  if (showSuccessIndicator) {
    return (
      <div className={cn('flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1', className)}>
        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>Valid</span>
      </div>
    );
  }

  // Parse error message to extract "how to fix" section
  const parts = error?.split('\n→ ') || [];
  const mainMessage = parts[0];
  const suggestion = parts.slice(1).join('\n→ ');

  return (
    <div className={cn('space-y-1 mt-1', className)}>
      {/* Main error message */}
      <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>{mainMessage}</span>
      </div>

      {/* Suggestion/fix */}
      {suggestion && (
        <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 ml-5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="whitespace-pre-line">{suggestion}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Input wrapper component that includes label, input, and error
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   error={errors.email}
 *   touched={touched.email}
 *   required
 * >
 *   <Input {...field} />
 * </FormField>
 * ```
 */
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  showSuccess?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  touched,
  required,
  showSuccess,
  hint,
  children,
  className,
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <div className={cn(
        'transition-all',
        hasError && 'ring-1 ring-red-500 rounded'
      )}>
        {children}
      </div>

      {/* Hint text (if no error) */}
      {hint && !hasError && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}

      {/* Error or success message */}
      <FieldError
        error={error}
        touched={touched}
        showSuccess={showSuccess}
      />
    </div>
  );
};
