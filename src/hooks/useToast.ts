/**
 * useToast Hook
 * Provides access to toast notification functions
 */

import { useConfigStore } from '@/store';

export function useToast() {
  const addToast = useConfigStore((state) => state.ui.addToast);
  const dismissToast = useConfigStore((state) => state.ui.dismissToast);
  const clearToasts = useConfigStore((state) => state.ui.clearToasts);

  return {
    addToast,
    dismissToast,
    clearToasts,
  };
}
