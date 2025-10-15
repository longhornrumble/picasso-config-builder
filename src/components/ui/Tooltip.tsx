/**
 * Tooltip Component
 *
 * Accessible tooltip built with Radix UI primitives.
 * Provides contextual information on hover or focus.
 */

import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils/cn';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-950 shadow-md',
      'animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      'dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

export interface TooltipProps {
  /**
   * Content to show in the tooltip
   */
  content: React.ReactNode;
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactNode;
  /**
   * Side where tooltip appears
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Alignment of tooltip
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Delay before showing (ms)
   */
  delayDuration?: number;
  /**
   * Whether tooltip can be triggered
   */
  disabled?: boolean;
}

/**
 * Tooltip component for contextual help
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a helpful tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * <Tooltip content="Save your changes" side="right">
 *   <IconButton icon={<SaveIcon />} />
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipProps
>(
  (
    {
      content,
      children,
      side = 'top',
      align = 'center',
      delayDuration = 200,
      disabled = false,
    },
    ref
  ) => {
    if (disabled) {
      return <>{children}</>;
    }

    return (
      <TooltipRoot delayDuration={delayDuration}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent ref={ref} side={side} align={align}>
          {content}
        </TooltipContent>
      </TooltipRoot>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
