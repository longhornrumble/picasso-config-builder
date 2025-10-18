/**
 * useAutoSave Hook
 * Auto-saves configuration drafts to sessionStorage
 * Recovers unsaved work on page reload
 */

import { useEffect, useRef } from 'react';
import { useConfigStore } from '@/store';

export interface AutoSaveOptions {
  /**
   * Debounce delay in milliseconds (default: 30000 = 30s)
   */
  debounceMs?: number;
  /**
   * Whether to enable auto-save (default: true)
   */
  enabled?: boolean;
  /**
   * Storage key prefix (default: 'picasso-config-autosave')
   */
  storageKey?: string;
}

const DEFAULT_OPTIONS: Required<AutoSaveOptions> = {
  debounceMs: 30000, // 30 seconds
  enabled: true,
  storageKey: 'picasso-config-autosave',
};

/**
 * Auto-save hook
 *
 * Features:
 * - Saves to sessionStorage every 30 seconds (debounced)
 * - Recovers unsaved work on page reload
 * - Clears on successful deployment
 * - Shows unsaved changes indicator
 *
 * @example
 * ```tsx
 * function App() {
 *   useAutoSave(); // Use default options
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAutoSave(options: AutoSaveOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const isDirty = useConfigStore((state) => state.config.isDirty);
  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);
  const contentShowcase = useConfigStore((state) => state.contentShowcase.content_showcase);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  /**
   * Save current state to sessionStorage
   */
  const saveToStorage = () => {
    if (!tenantId || !isDirty || !opts.enabled) {
      return;
    }

    try {
      const autoSaveData = {
        tenantId,
        timestamp: Date.now(),
        programs,
        forms,
        ctas,
        branches,
        contentShowcase,
      };

      const key = `${opts.storageKey}-${tenantId}`;
      sessionStorage.setItem(key, JSON.stringify(autoSaveData));
      lastSaveRef.current = Date.now();

      console.log('Auto-saved to sessionStorage:', key);
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  };

  /**
   * Load saved state from sessionStorage
   */
  const loadFromStorage = () => {
    if (!tenantId || !opts.enabled) {
      return false;
    }

    try {
      const key = `${opts.storageKey}-${tenantId}`;
      const saved = sessionStorage.getItem(key);

      if (!saved) {
        return false;
      }

      const autoSaveData = JSON.parse(saved);

      // Check if autosave is for the correct tenant
      if (autoSaveData.tenantId !== tenantId) {
        console.warn('Autosave tenant ID mismatch, ignoring');
        return false;
      }

      // Restore state using Zustand's setState
      useConfigStore.setState((state) => {
        if (autoSaveData.programs) {
          state.programs.programs = autoSaveData.programs;
        }
        if (autoSaveData.forms) {
          state.forms.forms = autoSaveData.forms;
        }
        if (autoSaveData.ctas) {
          state.ctas.ctas = autoSaveData.ctas;
        }
        if (autoSaveData.branches) {
          state.branches.branches = autoSaveData.branches;
        }
        if (autoSaveData.contentShowcase) {
          state.contentShowcase.content_showcase = autoSaveData.contentShowcase;
        }

        // Mark as dirty since we recovered unsaved changes
        state.config.isDirty = true;
      });

      console.log('Recovered autosave from:', new Date(autoSaveData.timestamp));
      return true;
    } catch (error) {
      console.error('Failed to load autosave:', error);
      return false;
    }
  };

  /**
   * Clear autosave for current tenant
   */
  const clearAutoSave = () => {
    if (!tenantId) {
      return;
    }

    try {
      const key = `${opts.storageKey}-${tenantId}`;
      sessionStorage.removeItem(key);
      console.log('Cleared autosave for:', tenantId);
    } catch (error) {
      console.error('Failed to clear autosave:', error);
    }
  };

  /**
   * Load autosave on mount (when tenant changes)
   */
  useEffect(() => {
    if (tenantId && opts.enabled) {
      loadFromStorage();
    }
  }, [tenantId]); // Only run when tenant changes

  /**
   * Set up debounced auto-save
   */
  useEffect(() => {
    if (!opts.enabled || !isDirty || !tenantId) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set up new timer
    saveTimerRef.current = setTimeout(() => {
      saveToStorage();
    }, opts.debounceMs);

    // Cleanup on unmount or deps change
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [programs, forms, ctas, branches, contentShowcase, isDirty, tenantId, opts.enabled, opts.debounceMs]);

  /**
   * Clear autosave when config is no longer dirty (after successful save/deploy)
   */
  useEffect(() => {
    if (!isDirty && tenantId) {
      clearAutoSave();
    }
  }, [isDirty, tenantId]);

  /**
   * Save immediately before page unload if there are unsaved changes
   */
  useEffect(() => {
    if (!opts.enabled) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && tenantId) {
        // Save immediately
        saveToStorage();

        // Show browser warning
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, tenantId, programs, forms, ctas, branches, contentShowcase, opts.enabled]);

  // Return utilities
  return {
    saveToStorage,
    loadFromStorage,
    clearAutoSave,
    lastSaveTime: lastSaveRef.current,
  };
}
