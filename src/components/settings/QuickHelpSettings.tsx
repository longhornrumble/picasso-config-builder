/**
 * QuickHelpSettings Component
 * Quick help menu configuration
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { QuickHelpConfig } from '@/types/config';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

/**
 * Quick Help Settings Component
 *
 * Manages quick help menu configuration:
 * - enabled: Toggle quick help visibility
 * - title: Menu title
 * - toggle_text: Toggle button text
 * - close_after_selection: Auto-close behavior
 * - prompts: List of quick help prompts (max 8)
 *
 * @example
 * ```tsx
 * <QuickHelpSettings />
 * ```
 */
export const QuickHelpSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const [newPrompt, setNewPrompt] = useState('');

  // Update quick_help field
  const updateQuickHelp = (field: string, value: unknown) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.quick_help) {
          state.config.baseConfig.quick_help = {} as QuickHelpConfig;
        }
        (state.config.baseConfig.quick_help as Record<string, unknown>)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  // Add prompt to list
  const addPrompt = () => {
    if (!newPrompt.trim()) return;
    const currentPrompts = quickHelp.prompts || [];
    if (currentPrompts.length >= 8) return;

    updateQuickHelp('prompts', [...currentPrompts, newPrompt.trim()]);
    setNewPrompt('');
  };

  // Remove prompt from list
  const removePrompt = (index: number) => {
    const currentPrompts = quickHelp.prompts || [];
    updateQuickHelp('prompts', currentPrompts.filter((_: string, i: number) => i !== index));
  };

  const quickHelp: Partial<QuickHelpConfig> = baseConfig?.quick_help || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Help Menu</CardTitle>
        <CardDescription>
          Configure the quick help menu with preset prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Enable Quick Help
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Show quick help menu in chat interface
            </p>
          </div>
          <input
            type="checkbox"
            checked={quickHelp.enabled || false}
            onChange={(e) => updateQuickHelp('enabled', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {/* Title */}
        <Input
          label="Menu Title"
          value={quickHelp.title || ''}
          onChange={(e) => updateQuickHelp('title', e.target.value)}
          placeholder="e.g., Quick Help"
          helperText="Title shown in the quick help menu"
        />

        {/* Toggle Text */}
        <Input
          label="Toggle Button Text"
          value={quickHelp.toggle_text || ''}
          onChange={(e) => updateQuickHelp('toggle_text', e.target.value)}
          placeholder="e.g., Need help?"
          helperText="Text shown on the toggle button"
        />

        {/* Close After Selection */}
        <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Close After Selection
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically close menu when user selects a prompt
            </p>
          </div>
          <input
            type="checkbox"
            checked={quickHelp.close_after_selection || false}
            onChange={(e) => updateQuickHelp('close_after_selection', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {/* Prompts List */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Quick Help Prompts (Max 8)
          </label>

          {/* Existing prompts */}
          {quickHelp.prompts && quickHelp.prompts.length > 0 && (
            <div className="space-y-2 mb-3">
              {quickHelp.prompts.map((prompt: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                      {prompt}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrompt(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 flex-shrink-0"
                    aria-label="Remove prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new prompt */}
          <div className="space-y-2">
            <Input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="e.g., How do I apply for a job?"
              disabled={(quickHelp.prompts?.length ?? 0) >= 8}
            />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {quickHelp.prompts?.length ?? 0} / 8 prompts
              </span>
              <Button
                onClick={addPrompt}
                disabled={!newPrompt.trim() || (quickHelp.prompts?.length ?? 0) >= 8}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Prompt
              </Button>
            </div>
          </div>

          {(quickHelp.prompts?.length ?? 0) >= 8 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-2">
              <AlertCircle className="w-4 h-4" />
              Maximum number of prompts reached
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
