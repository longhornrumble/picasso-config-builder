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
}

const FLAG_DEFINITIONS: FlagDefinition[] = [
  {
    key: 'V5_SINGLE_PASS',
    label: 'V5 Single-Pass Turn',
    description:
      'One streaming call writes the reply AND selects its CTAs (coherent by construction; same ai_available vocabulary). Takes precedence over V4.0 Action Selector when both are enabled.',
  },
  {
    key: 'V4_ACTION_SELECTOR',
    label: 'V4.0 Action Selector',
    description: 'LLM-based CTA selection — AI picks 0-4 relevant CTAs per turn from ai_available vocabulary',
  },
  {
    key: 'scheduling_enabled',
    label: 'Scheduling',
    description: 'Enables the v1 scheduling block — required for start_scheduling/resume_scheduling CTAs and the scheduling configuration section',
  },
  // MESSENGER_CHANNEL intentionally lives on the dedicated Messenger product page
  // (Settings → Messenger), not here. Pattern rule: when a flag graduates to a
  // product page, its flat toggle is removed so there is exactly one control.
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
          enables LLM-based CTA selection from the ai_available vocabulary; V5 Single-Pass
          folds that selection into the response call itself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {FLAG_DEFINITIONS.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1 pr-4">
                <label
                  htmlFor={`flag-${key}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {label}
                </label>
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
            for all new tenants. V5_SINGLE_PASS folds that selection into the response call itself
            and wins over V4 when both are enabled — currently in staged rollout (staging soak on
            the test tenant first).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
