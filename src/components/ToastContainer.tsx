/**
 * ToastContainer Component
 * Toast notification system using Radix UI Toast
 */

import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useConfigStore } from '@/store';
import { cn } from '@/lib/utils/cn';

/**
 * Toast Container
 *
 * Features:
 * - Displays toast notifications from Zustand store
 * - Success, error, info, warning variants
 * - Auto-dismiss after duration
 * - Dismissible by user
 * - Position: top-right
 * - Stacked notifications
 *
 * @example
 * ```tsx
 * <ToastContainer />
 * ```
 */
export const ToastContainer: React.FC = () => {
  const toasts = useConfigStore((state) => state.ui.toasts) || [];
  const dismissToast = useConfigStore((state) => state.ui.dismissToast);

  const getIcon = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300';
    }
  };

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          duration={toast.duration || 5000}
          onOpenChange={(open) => {
            if (!open) {
              dismissToast(toast.id);
            }
          }}
          className={cn(
            'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all',
            'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
            getColorClasses(toast.type)
          )}
        >
          <div className="flex items-center gap-3">
            {getIcon(toast.type)}
            <ToastPrimitive.Description className="text-sm font-medium">
              {toast.message}
            </ToastPrimitive.Description>
          </div>

          <ToastPrimitive.Close
            onClick={() => dismissToast(toast.id)}
            className={cn(
              'absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              toast.type === 'success' && 'focus:ring-green-500',
              toast.type === 'error' && 'focus:ring-red-500',
              toast.type === 'warning' && 'focus:ring-amber-500',
              toast.type === 'info' && 'focus:ring-blue-500'
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}

      <ToastPrimitive.Viewport className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-4 sm:right-4 sm:flex-col sm:w-auto sm:max-w-md gap-2" />
    </ToastPrimitive.Provider>
  );
};
