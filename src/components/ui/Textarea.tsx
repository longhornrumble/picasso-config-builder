/**
 * Textarea Component
 *
 * A flexible multiline text input component with validation states, error messages,
 * and accessible labels.
 */

import { forwardRef, type ComponentProps } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface TextareaProps extends ComponentProps<'textarea'> {
  /**
   * Label text displayed above the textarea
   */
  label?: string;
  /**
   * Error message to display below the textarea
   */
  error?: string;
  /**
   * Success message to display below the textarea
   */
  success?: string;
  /**
   * Helper text to display below the textarea
   */
  helperText?: string;
  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success' | 'warning';
}

/**
 * Textarea component for multiline text entry
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description..."
 *   rows={4}
 *   error={errors.description}
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      state = 'default',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const effectiveState = error ? 'error' : success ? 'success' : state;

    const stateClasses = {
      default: 'border-gray-300 focus:border-primary focus:ring-primary',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500',
    };

    return (
      <div className="w-full">
        {label && (
          <LabelPrimitive.Root
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </LabelPrimitive.Root>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
              'resize-y',
              stateClasses[effectiveState],
              className
            )}
            aria-invalid={effectiveState === 'error'}
            aria-describedby={
              error
                ? `${textareaId}-error`
                : success
                ? `${textareaId}-success`
                : helperText
                ? `${textareaId}-helper`
                : undefined
            }
            {...props}
          />

          {effectiveState === 'error' && (
            <div className="pointer-events-none absolute right-3 top-3 text-red-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}

          {effectiveState === 'success' && (
            <div className="pointer-events-none absolute right-3 top-3 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && !error && (
          <p
            id={`${textareaId}-success`}
            className="mt-1.5 text-sm text-green-600 dark:text-green-400"
          >
            {success}
          </p>
        )}

        {helperText && !error && !success && (
          <p
            id={`${textareaId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
