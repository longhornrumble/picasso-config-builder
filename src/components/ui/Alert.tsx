/**
 * Alert Component
 *
 * Display important messages and notifications to users with different severity levels.
 * Supports dismissible alerts and custom actions.
 */

import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current [&>svg+div]:pl-8',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800',
        info: 'bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-100',
        success: 'bg-green-50 border-green-200 text-green-900 [&>svg]:text-green-600 dark:bg-green-950 dark:border-green-900 dark:text-green-100',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 [&>svg]:text-yellow-600 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-100',
        error: 'bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600 dark:bg-red-950 dark:border-red-900 dark:text-red-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const icons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps
  extends ComponentProps<'div'>,
    VariantProps<typeof alertVariants> {
  /**
   * Show dismiss button
   */
  dismissible?: boolean;
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  /**
   * Hide the default icon
   */
  hideIcon?: boolean;
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
}

/**
 * Alert component for displaying important messages
 *
 * @example
 * ```tsx
 * <Alert variant="success">
 *   <AlertTitle>Success!</AlertTitle>
 *   <AlertDescription>Your changes have been saved.</AlertDescription>
 * </Alert>
 *
 * <Alert variant="error" dismissible onDismiss={handleDismiss}>
 *   <AlertTitle>Error</AlertTitle>
 *   <AlertDescription>Something went wrong.</AlertDescription>
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      dismissible,
      onDismiss,
      hideIcon,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const Icon = icons[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {!hideIcon && (icon || <Icon className="h-5 w-5" />)}
        <div className={cn(dismissible && 'pr-8')}>{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

/**
 * Alert title component
 */
export const AlertTitle = forwardRef<HTMLHeadingElement, ComponentProps<'h5'>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

/**
 * Alert description component
 */
export const AlertDescription = forwardRef<
  HTMLParagraphElement,
  ComponentProps<'p'>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm leading-relaxed [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';
