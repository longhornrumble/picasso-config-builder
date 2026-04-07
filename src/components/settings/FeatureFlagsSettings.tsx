/**
 * FeatureFlagsSettings Component
 * Pipeline feature flags configuration panel
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { FeatureFlags } from '@/types/config';

// ============================================================================
// FLAG DEFINITIONS
// ============================================================================

interface FlagDefinition {
  key: keyof FeatureFlags;
  label: string;
  description: string;
  legacy?: boolean;
}

const FLAG_DEFINITIONS: FlagDefinition[] = [
  {
    key: 'V4_ACTION_SELECTOR',
    label: 'V4.0 Action Selector',
    description: 'LLM-based CTA selection — AI picks 0-4 relevant CTAs per turn from ai_available vocabulary',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * FeatureFlagsSettings Component
 *
 * Manages pipeline feature flags:
 * - V4_ACTION_SELECTOR: Enables LLM-based CTA selection (V4.0)
 *
 * @example
 * ```tsx
 * <FeatureFlagsSettings />
 * ```
 */
export const FeatureFlagsSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const featureFlags: FeatureFlags = baseConfig?.feature_flags || {};

  const updateFlag = (key: keyof FeatureFlags, value: boolean) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.feature_flags) {
          state.config.baseConfig.feature_flags = {};
        }
        state.config.baseConfig.feature_flags[key] = value;
        state.config.isDirty = true;
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Feature Flags</CardTitle>
        <CardDescription>
          Control which pipeline behaviors are active for this tenant. V4.0 Action Selector
          enables LLM-based CTA selection from the ai_available vocabulary. V3.5 legacy flags
          control the older dynamic action and chip selection behaviors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {FLAG_DEFINITIONS.map(({ key, label, description, legacy }) => (
            <div
              key={key}
              className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`flag-${key}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    {label}
                  </label>
                  {legacy && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      V3.5 Legacy
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {description}
                </p>
              </div>
              <input
                id={`flag-${key}`}
                type="checkbox"
                checked={featureFlags[key] || false}
                onChange={(e) => updateFlag(key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer mt-0.5"
                aria-describedby={`flag-${key}-desc`}
              />
            </div>
          ))}
        </div>

        {/* Contextual note about flag interactions */}
        <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Note:</span> When V4_ACTION_SELECTOR is enabled, the AI
            selects CTAs marked ai_available after each response. This is the preferred pipeline
            for all new tenants.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
