/**
 * Badge Component
 *
 * Small status indicators and labels for displaying metadata, categories, or states.
 * Perfect for showing counts, statuses, or tags.
 */

import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80',
        primary:
          'border-transparent bg-primary text-white hover:bg-primary-hover',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80',
        success:
          'border-transparent bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-100',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-100',
        error:
          'border-transparent bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-100',
        info:
          'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-100',
        outline:
          'border-gray-300 bg-transparent text-gray-900 dark:border-gray-700 dark:text-gray-50',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends ComponentProps<'div'>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional icon to display before text
   */
  icon?: React.ReactNode;
  /**
   * Optional icon to display after text
   */
  endIcon?: React.ReactNode;
}

/**
 * Badge component for status indicators and labels
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Draft</Badge>
 * <Badge variant="primary">5 Forms</Badge>
 * <Badge variant="warning" icon={<AlertIcon />}>Warning</Badge>
 * ```
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, endIcon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1 inline-flex">{icon}</span>}
        {children}
        {endIcon && <span className="ml-1 inline-flex">{endIcon}</span>}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
