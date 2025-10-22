/**
 * Skeleton Component
 *
 * Loading placeholder that shows skeleton screens while content is loading.
 * Provides better UX than spinners for structured content.
 */

import { forwardRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonProps extends ComponentProps<'div'> {
  /**
   * Variant of the skeleton
   */
  variant?: 'default' | 'card' | 'text' | 'circle';
  /**
   * Whether to show the shimmer animation
   */
  animate?: boolean;
}

/**
 * Skeleton loading component
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * <Skeleton variant="circle" className="h-12 w-12" />
 * <Skeleton variant="card" className="h-48" />
 * ```
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animate = true, ...props }, ref) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-800';
    const animateClasses = animate
      ? 'animate-pulse'
      : '';

    const variantClasses = {
      default: 'rounded',
      card: 'rounded-lg',
      text: 'rounded h-4',
      circle: 'rounded-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          animateClasses,
          variantClasses[variant],
          className
        )}
        role="status"
        aria-label="Loading..."
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Card skeleton for entity cards
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="circle" className="h-8 w-8" />
            <Skeleton variant="circle" className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </>
);

/**
 * Form skeleton for entity forms
 */
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

/**
 * Table skeleton for lists
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-24" />
      </div>
    ))}
  </div>
);
