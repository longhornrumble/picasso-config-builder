/**
 * BedrockInstructionsSettings Component
 * Multi-tenant Bedrock prompt customization
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Textarea, Button, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import type { BedrockInstructions, EmojiUsage, ResponseStyle, DetailLevel } from '@/types/config';

/**
 * Default Bedrock Instructions
 * Fallback values when not configured
 */
const DEFAULT_BEDROCK_INSTRUCTIONS: BedrockInstructions = {
  _version: '1.0',
  _updated: new Date().toISOString(),
  role_instructions: 'You are a helpful virtual assistant for a nonprofit organization. Your primary goal is to provide accurate information about programs and services based on the knowledge base, while maintaining a warm and supportive tone.',
  formatting_preferences: {
    emoji_usage: 'moderate',
    max_emojis_per_response: 3,
    response_style: 'warm_conversational',
    detail_level: 'balanced',
  },
  custom_constraints: [],
  fallback_message: 'I don\'t have specific information about that in my knowledge base. However, I can help you with general questions about our programs and services. What would you like to know?',
};

/**
 * Bedrock Instructions Settings Component
 *
 * Manages tenant-specific AI personality settings:
 * - Role instructions (who the AI is)
 * - Formatting preferences (emoji, style, detail)
 * - Custom constraints (additional rules)
 * - Fallback message (when KB has no context)
 *
 * @example
 * ```tsx
 * <BedrockInstructionsSettings />
 * ```
 */
export const BedrockInstructionsSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const markDirty = useConfigStore((state) => state.config.markDirty);

  // Get current Bedrock instructions with defaults
  const bedrockInstructions: BedrockInstructions = baseConfig?.bedrock_instructions || DEFAULT_BEDROCK_INSTRUCTIONS;

  // Local state for custom constraints
  const [newConstraint, setNewConstraint] = useState('');

  // Character counters
  const roleCharsRemaining = 1000 - bedrockInstructions.role_instructions.length;
  const fallbackCharsRemaining = 500 - bedrockInstructions.fallback_message.length;

  // Update Bedrock instructions in baseConfig
  const updateBedrockInstructions = (updates: Partial<BedrockInstructions>) => {
    if (!baseConfig) return;

    const newInstructions: BedrockInstructions = {
      ...bedrockInstructions,
      ...updates,
      _updated: new Date().toISOString(),
    };

    // Update the baseConfig directly through Immer
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        state.config.baseConfig.bedrock_instructions = newInstructions;
      }
    });

    markDirty();
  };

  // Update formatting preferences
  const updateFormattingPreferences = (updates: Partial<BedrockInstructions['formatting_preferences']>) => {
    updateBedrockInstructions({
      formatting_preferences: {
        ...bedrockInstructions.formatting_preferences,
        ...updates,
      },
    });
  };

  // Add custom constraint
  const addConstraint = () => {
    if (!newConstraint.trim()) return;
    if (bedrockInstructions.custom_constraints.length >= 10) return;

    updateBedrockInstructions({
      custom_constraints: [...bedrockInstructions.custom_constraints, newConstraint.trim()],
    });

    setNewConstraint('');
  };

  // Remove custom constraint
  const removeConstraint = (index: number) => {
    updateBedrockInstructions({
      custom_constraints: bedrockInstructions.custom_constraints.filter((_, i) => i !== index),
    });
  };

  // Emoji usage options
  const emojiOptions: Array<{ value: EmojiUsage; label: string }> = [
    { value: 'none', label: 'None - No emojis' },
    { value: 'moderate', label: 'Moderate - Occasional emojis' },
    { value: 'generous', label: 'Generous - Frequent emojis' },
  ];

  // Response style options
  const styleOptions: Array<{ value: ResponseStyle; label: string }> = [
    { value: 'professional_concise', label: 'Professional & Concise' },
    { value: 'warm_conversational', label: 'Warm & Conversational' },
    { value: 'structured_detailed', label: 'Structured & Detailed' },
  ];

  // Detail level options
  const detailOptions: Array<{ value: DetailLevel; label: string }> = [
    { value: 'concise', label: 'Concise - Brief responses' },
    { value: 'balanced', label: 'Balanced - Moderate detail' },
    { value: 'comprehensive', label: 'Comprehensive - Detailed responses' },
  ];

  return (
    <>
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">About AI Personality Customization</p>
              <p>
                These settings control how the AI assistant communicates with your website visitors.
                Security rules (anti-hallucination, URL preservation) are locked at the system level
                and cannot be modified here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Instructions</CardTitle>
          <CardDescription>
            Define who the AI is and its primary purpose (max 1000 characters)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={bedrockInstructions.role_instructions}
            onChange={(e) => {
              if (e.target.value.length <= 1000) {
                updateBedrockInstructions({
                  role_instructions: e.target.value,
                });
              }
            }}
            rows={6}
            placeholder="Example: You are a helpful virtual assistant for a nonprofit organization..."
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Characters remaining: {roleCharsRemaining}
            </span>
            {roleCharsRemaining < 100 && (
              <Badge variant="warning">Near limit</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formatting Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Formatting Preferences</CardTitle>
          <CardDescription>
            Control response style, emoji usage, and detail level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Emoji Usage */}
            <Select
              label="Emoji Usage"
              value={bedrockInstructions.formatting_preferences.emoji_usage}
              onValueChange={(value) => {
                updateFormattingPreferences({
                  emoji_usage: value as EmojiUsage,
                });
              }}
              options={emojiOptions}
              helperText="How often should the AI use emojis?"
            />

            {/* Max Emojis */}
            <Input
              label="Max Emojis Per Response"
              type="number"
              min={0}
              max={10}
              value={bedrockInstructions.formatting_preferences.max_emojis_per_response.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 0 && value <= 10) {
                  updateFormattingPreferences({
                    max_emojis_per_response: value,
                  });
                }
              }}
              helperText="Maximum emojis allowed (0-10)"
            />

            {/* Response Style */}
            <Select
              label="Response Style"
              value={bedrockInstructions.formatting_preferences.response_style}
              onValueChange={(value) => {
                updateFormattingPreferences({
                  response_style: value as ResponseStyle,
                });
              }}
              options={styleOptions}
              helperText="Overall tone and structure"
            />

            {/* Detail Level */}
            <Select
              label="Detail Level"
              value={bedrockInstructions.formatting_preferences.detail_level}
              onValueChange={(value) => {
                updateFormattingPreferences({
                  detail_level: value as DetailLevel,
                });
              }}
              options={detailOptions}
              helperText="How detailed should responses be?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Constraints</CardTitle>
          <CardDescription>
            Additional rules or guidelines for AI behavior (max 10, each max 500 characters)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing constraints */}
          {bedrockInstructions.custom_constraints.length > 0 && (
            <div className="space-y-2">
              {bedrockInstructions.custom_constraints.map((constraint, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                      {constraint}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConstraint(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation"
                    aria-label="Remove constraint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new constraint */}
          <div className="space-y-2">
            <Textarea
              value={newConstraint}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setNewConstraint(e.target.value);
                }
              }}
              rows={3}
              placeholder="Add a custom constraint (e.g., 'Always mention volunteer opportunities when discussing programs')"
              disabled={bedrockInstructions.custom_constraints.length >= 10}
            />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {bedrockInstructions.custom_constraints.length} / 10 constraints • {500 - newConstraint.length} chars remaining
              </span>
              <Button
                onClick={addConstraint}
                disabled={!newConstraint.trim() || bedrockInstructions.custom_constraints.length >= 10}
                size="sm"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Constraint
              </Button>
            </div>
          </div>

          {bedrockInstructions.custom_constraints.length >= 10 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              Maximum number of custom constraints reached
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fallback Message */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Message</CardTitle>
          <CardDescription>
            Message shown when the knowledge base has no relevant context (max 500 characters)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={bedrockInstructions.fallback_message}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                updateBedrockInstructions({
                  fallback_message: e.target.value,
                });
              }
            }}
            rows={4}
            placeholder="Example: I don't have specific information about that in my knowledge base..."
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Characters remaining: {fallbackCharsRemaining}
            </span>
            {fallbackCharsRemaining < 50 && (
              <Badge variant="warning">Near limit</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Configuration Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Version:</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium sm:font-normal">{bedrockInstructions._version}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium sm:font-normal">
              {new Date(bedrockInstructions._updated).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
