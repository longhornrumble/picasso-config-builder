/**
 * Keyboard Shortcuts Help Component
 *
 * Shows a modal with available keyboard shortcuts
 */

import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  Button,
  Tooltip,
  Badge,
} from '@/components/ui';
import { DEFAULT_SHORTCUTS, formatShortcut, useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Register Ctrl/Cmd + / to open help
  useKeyboardShortcuts([
    {
      key: '/',
      ctrl: true,
      meta: true,
      callback: () => setOpen(true),
      description: 'Show keyboard shortcuts',
    },
  ]);

  return (
    <>
      <Tooltip content="Keyboard shortcuts">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </Tooltip>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Keyboard Shortcuts</ModalTitle>
            <ModalDescription>
              Speed up your workflow with these keyboard shortcuts
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-3 mt-4">
            {DEFAULT_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {formatShortcut(shortcut)}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Tip:</strong> Press{' '}
              <Badge variant="secondary" className="mx-1 font-mono text-xs">
                {formatShortcut({ key: '/', ctrl: true, meta: true, description: '' })}
              </Badge>
              to view this help anytime
            </p>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};
