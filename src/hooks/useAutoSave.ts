/**
 * useAutoSave Hook
 * Auto-saves configuration drafts to sessionStorage
 * Recovers unsaved work on page reload
 */

import { useCallback, useEffect, useRef } from 'react';
import { useConfigStore } from '@/store';
import type { ConversationalForm } from '@/types/config';

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
  const { debounceMs, enabled, storageKey } = { ...DEFAULT_OPTIONS, ...options };

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
  const saveToStorage = useCallback(() => {
    if (!tenantId || !isDirty || !enabled) {
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

      const key = `${storageKey}-${tenantId}`;
      sessionStorage.setItem(key, JSON.stringify(autoSaveData));
      lastSaveRef.current = Date.now();

      console.log('Auto-saved to sessionStorage:', key);
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  }, [tenantId, isDirty, enabled, programs, forms, ctas, branches, contentShowcase, storageKey]);

  /**
   * Load saved state from sessionStorage
   */
  const loadFromStorage = useCallback(() => {
    if (!tenantId || !enabled) {
      return false;
    }

    try {
      const key = `${storageKey}-${tenantId}`;
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
          // Normalize forms: ensure form_id matches the dictionary key
          state.forms.forms = Object.fromEntries(
            Object.entries(autoSaveData.forms).map(([key, form]) => [
              key,
              { ...(form as ConversationalForm), form_id: key } // Override form_id to match the key
            ])
          );
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
  }, [tenantId, enabled, storageKey]);

  /**
   * Clear autosave for current tenant
   */
  const clearAutoSave = useCallback(() => {
    if (!tenantId) {
      return;
    }

    try {
      const key = `${storageKey}-${tenantId}`;
      sessionStorage.removeItem(key);
      console.log('Cleared autosave for:', tenantId);
    } catch (error) {
      console.error('Failed to clear autosave:', error);
    }
  }, [tenantId, storageKey]);

  /**
   * Load autosave on mount (when tenant changes)
   */
  useEffect(() => {
    if (tenantId && enabled) {
      loadFromStorage();
    }
  }, [tenantId, enabled, loadFromStorage]);

  /**
   * Set up debounced auto-save
   */
  useEffect(() => {
    if (!enabled || !isDirty || !tenantId) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set up new timer
    saveTimerRef.current = setTimeout(() => {
      saveToStorage();
    }, debounceMs);

    // Cleanup on unmount or deps change
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [isDirty, tenantId, enabled, debounceMs, saveToStorage]);

  /**
   * Clear autosave when config is no longer dirty (after successful save/deploy)
   */
  useEffect(() => {
    if (!isDirty && tenantId) {
      clearAutoSave();
    }
  }, [isDirty, tenantId, clearAutoSave]);

  /**
   * Save immediately before page unload if there are unsaved changes
   */
  useEffect(() => {
    if (!enabled) {
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
  }, [isDirty, tenantId, enabled, saveToStorage]);

  // Return utilities. lastSaveTime is exposed as a getter so callers don't
  // read ref.current during render (react-hooks/refs).
  return {
    saveToStorage,
    loadFromStorage,
    clearAutoSave,
    getLastSaveTime: () => lastSaveRef.current,
  };
}
