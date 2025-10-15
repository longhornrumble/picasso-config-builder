/**
 * Tabs Component
 *
 * A set of tabbed content panels built with Radix UI Tabs primitives.
 * Perfect for organizing related content into separate views.
 */

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils/cn';

const TabsRoot = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500',
      'dark:bg-gray-800 dark:text-gray-400',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
      'text-sm font-medium ring-offset-white transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm',
      'dark:ring-offset-gray-950 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-50',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'dark:ring-offset-gray-950',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /**
   * Default selected tab value
   */
  defaultValue?: string;
  /**
   * Controlled selected tab value
   */
  value?: string;
  /**
   * Callback when tab changes
   */
  onValueChange?: (value: string) => void;
}

/**
 * Tabs component for organizing content into switchable panels
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="forms">Forms</TabsTrigger>
 *     <TabsTrigger value="ctas">CTAs</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">
 *     <Card>Overview content</Card>
 *   </TabsContent>
 *   <TabsContent value="forms">
 *     <Card>Forms content</Card>
 *   </TabsContent>
 *   <TabsContent value="ctas">
 *     <Card>CTAs content</Card>
 *   </TabsContent>
 * </Tabs>
 * ```
 */
export const Tabs = TabsRoot;

export { TabsList, TabsTrigger, TabsContent };
