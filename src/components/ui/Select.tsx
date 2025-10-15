/**
 * Select Component
 *
 * A dropdown select component built with Radix UI primitives.
 * Supports single selection, labels, error states, and keyboard navigation.
 */

import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /**
   * Label text displayed above the select
   */
  label?: string;
  /**
   * Error message to display below the select
   */
  error?: string;
  /**
   * Helper text to display below the select
   */
  helperText?: string;
  /**
   * Placeholder text when no value is selected
   */
  placeholder?: string;
  /**
   * Options to display in the dropdown
   */
  options: SelectOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Disable the select
   */
  disabled?: boolean;
  /**
   * Required field indicator
   */
  required?: boolean;
  /**
   * Custom class name for the trigger button
   */
  className?: string;
}

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
      'data-[state=open]:border-primary',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'dark:bg-gray-900 dark:border-gray-700',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-gray-100 focus:text-gray-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'dark:focus:bg-gray-800 dark:focus:text-gray-100',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/**
 * Select component for choosing from a list of options
 *
 * @example
 * ```tsx
 * <Select
 *   label="Program"
 *   placeholder="Select a program..."
 *   options={[
 *     { value: 'love-box', label: 'Love Box' },
 *     { value: 'food-bank', label: 'Food Bank' }
 *   ]}
 *   value={selectedProgram}
 *   onValueChange={setSelectedProgram}
 * />
 * ```
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      placeholder = 'Select an option...',
      options,
      value,
      onValueChange,
      disabled,
      required,
      className,
    },
    ref
  ) => {
    const selectId = label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <LabelPrimitive.Root
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </LabelPrimitive.Root>
        )}

        <SelectPrimitive.Root
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={cn(error && 'border-red-500 focus:ring-red-500', className)}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
          >
            <SelectPrimitive.Value placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectPrimitive.Root>

        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
