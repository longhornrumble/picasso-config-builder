/**
 * Card Component
 *
 * A versatile container component with optional header and footer sections.
 * Used for grouping related content and creating visual hierarchy.
 */

import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../lib/utils/cn';

export interface CardProps extends ComponentProps<'div'> {
  /**
   * Variant of the card
   */
  variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Card container component
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Card content goes here
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-900',
      outlined: 'bg-white border-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
      elevated: 'bg-white shadow-lg dark:bg-gray-900',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-gray-200 text-gray-950 dark:border-gray-800 dark:text-gray-50',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends ComponentProps<'div'> {
  /**
   * Add a border below the header
   */
  bordered?: boolean;
}

/**
 * Card header section
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        bordered && 'border-b border-gray-200 dark:border-gray-800',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends ComponentProps<'h3'> {
  /**
   * Visual size of the title
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Card title heading
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    };

    return (
      <h3
        ref={ref}
        className={cn(
          'font-semibold leading-none tracking-tight',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

/**
 * Card description text
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  ComponentProps<'p'>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Card content section
 */
export const CardContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends ComponentProps<'div'> {
  /**
   * Add a border above the footer
   */
  bordered?: boolean;
}

/**
 * Card footer section
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-6 pt-0',
        bordered && 'border-t border-gray-200 pt-6 dark:border-gray-800',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
