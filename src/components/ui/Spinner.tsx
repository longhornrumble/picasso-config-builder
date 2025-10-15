/**
 * Spinner Component
 *
 * A loading indicator for async operations and loading states.
 * Multiple sizes and variants available.
 */

import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-gray-900 dark:text-gray-50',
      primary: 'text-primary',
      secondary: 'text-gray-500 dark:text-gray-400',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface SpinnerProps
  extends Omit<ComponentProps<'svg'>, 'size'>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Optional label for screen readers
   */
  label?: string;
}

/**
 * Spinner component for loading states
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" variant="primary" />
 * <Spinner size="sm" label="Loading data..." />
 * ```
 */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, label = 'Loading...', ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        aria-label={label}
        role="status"
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

export interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isLoading: boolean;
  /**
   * Optional loading message
   */
  message?: string;
  /**
   * Spinner size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Overlay opacity (0-100)
   */
  opacity?: number;
}

/**
 * Loading overlay component for full-page or container loading states
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <YourContent />
 *   <LoadingOverlay isLoading={isLoading} message="Saving changes..." />
 * </div>
 * ```
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading, message, size = 'lg', opacity = 50 }, ref) => {
    if (!isLoading) return null;

    return (
      <div
        ref={ref}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg"
        style={{ backgroundColor: `rgba(255, 255, 255, ${opacity / 100})` }}
        role="progressbar"
        aria-busy="true"
        aria-label={message || 'Loading'}
      >
        <Spinner size={size} variant="primary" />
        {message && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {message}
          </p>
        )}
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';
