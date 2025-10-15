/**
 * Input Component
 *
 * A flexible text input component with validation states, error messages,
 * and accessible labels. Supports all standard HTML input types.
 */

import { forwardRef, type ComponentProps } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface InputProps extends ComponentProps<'input'> {
  /**
   * Label text displayed above the input
   */
  label?: string;
  /**
   * Error message to display below the input
   */
  error?: string;
  /**
   * Success message to display below the input
   */
  success?: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success' | 'warning';
  /**
   * Left icon or element
   */
  leftElement?: React.ReactNode;
  /**
   * Right icon or element
   */
  rightElement?: React.ReactNode;
}

/**
 * Input component for text entry
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 *
 * <Input
 *   label="Search"
 *   leftElement={<SearchIcon />}
 *   placeholder="Search..."
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      state = 'default',
      leftElement,
      rightElement,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
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
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </LabelPrimitive.Root>
        )}

        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
              stateClasses[effectiveState],
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            aria-invalid={effectiveState === 'error'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {rightElement && !error && !success && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightElement}
            </div>
          )}

          {effectiveState === 'error' && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}

          {effectiveState === 'success' && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && !error && (
          <p
            id={`${inputId}-success`}
            className="mt-1.5 text-sm text-green-600 dark:text-green-400"
          >
            {success}
          </p>
        )}

        {helperText && !error && !success && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
