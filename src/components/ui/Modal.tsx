/**
 * Modal Component
 *
 * A modal dialog component built with Radix UI Dialog primitives.
 * Provides accessible overlay modals with customizable content, headers, and footers.
 */

import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const ModalOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 grid gap-4 border bg-white shadow-lg',
        'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        // Mobile: Centered with transform (consistent with desktop)
        'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
        'w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] rounded-lg p-4',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        // Tablet and up: Centered modal with larger max-width
        'sm:max-w-lg sm:rounded-lg sm:p-6',
        // Styling
        'border-gray-200 dark:border-gray-800 dark:bg-gray-900',
        'max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0">
        <X className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = 'ModalContent';

const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
ModalHeader.displayName = 'ModalHeader';

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      'pt-4 mt-4 border-t border-gray-200 dark:border-gray-800',
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = 'ModalFooter';

const ModalTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-50',
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open?: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Prevent closing on outside click or escape key
   */
  modal?: boolean;
}

/**
 * Modal component for overlay dialogs
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen}>
 *   <ModalContent>
 *     <ModalHeader>
 *       <ModalTitle>Delete Program</ModalTitle>
 *       <ModalDescription>
 *         This action cannot be undone. Are you sure?
 *       </ModalDescription>
 *     </ModalHeader>
 *     <ModalFooter>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>
 *         Cancel
 *       </Button>
 *       <Button variant="danger" onClick={handleDelete}>
 *         Delete
 *       </Button>
 *     </ModalFooter>
 *   </ModalContent>
 * </Modal>
 * ```
 */
export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export {
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalOverlay,
};
