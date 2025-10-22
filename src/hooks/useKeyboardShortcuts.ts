/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for common operations:
 * - Ctrl/Cmd + S: Save
 * - Esc: Close modals
 * - Ctrl/Cmd + K: Quick command palette (future)
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  callback: (event: KeyboardEvent) => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Check if the current platform is Mac
 */
export const isMac = () =>
  typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Format shortcut for display
 * @example "Ctrl+S" or "⌘+S" on Mac
 */
export const formatShortcut = (shortcut: Omit<KeyboardShortcut, 'callback'>): string => {
  const parts: string[] = [];
  const modKey = isMac() ? '⌘' : 'Ctrl';

  if (shortcut.ctrl || shortcut.meta) parts.push(modKey);
  if (shortcut.alt) parts.push(isMac() ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac() ? '⇧' : 'Shift');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac() ? '' : '+');
};

/**
 * Check if event matches shortcut
 */
const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  const key = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  // Key must match
  if (key !== shortcutKey) return false;

  // Check modifiers
  const hasCtrl = event.ctrlKey || event.metaKey;
  const hasAlt = event.altKey;
  const hasShift = event.shiftKey;

  const needsCtrl = shortcut.ctrl || shortcut.meta;
  const needsAlt = shortcut.alt;
  const needsShift = shortcut.shift;

  return (
    hasCtrl === !!needsCtrl &&
    hasAlt === !!needsAlt &&
    hasShift === !!needsShift
  );
};

/**
 * Hook to register keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrl: true,
 *     callback: () => handleSave(),
 *     description: 'Save current form',
 *   },
 *   {
 *     key: 'Escape',
 *     callback: () => closeModal(),
 *     description: 'Close modal',
 *   },
 * ]);
 * ```
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback(event);
          break; // Only trigger first matching shortcut
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook to register a single save shortcut (Ctrl/Cmd + S)
 *
 * @example
 * ```tsx
 * useSaveShortcut(() => handleSave(), { disabled: !isDirty });
 * ```
 */
export const useSaveShortcut = (
  onSave: () => void,
  options?: { disabled?: boolean }
) => {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      meta: true,
      callback: () => {
        if (!options?.disabled) {
          onSave();
        }
      },
      description: 'Save',
      preventDefault: true,
    },
  ]);
};

/**
 * Hook to register an escape key handler for closing modals
 *
 * @example
 * ```tsx
 * useEscapeKey(() => setOpen(false), { disabled: !isOpen });
 * ```
 */
export const useEscapeKey = (
  onEscape: () => void,
  options?: { disabled?: boolean }
) => {
  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (!options?.disabled) {
          onEscape();
        }
      },
      description: 'Close',
      preventDefault: false, // Don't prevent default for Escape
    },
  ]);
};

/**
 * Default keyboard shortcuts for the application
 */
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    key: 'S',
    ctrl: true,
    meta: true,
    description: 'Save current form',
  },
  {
    key: 'Escape',
    description: 'Close modal or dialog',
  },
  {
    key: 'K',
    ctrl: true,
    meta: true,
    description: 'Open command palette (coming soon)',
  },
];
