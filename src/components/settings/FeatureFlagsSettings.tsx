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
    key: 'V4_PIPELINE',
    label: 'V4 Pipeline',
    description: 'Enable V4 pipeline (topic classification + CTA pool selection)',
  },
  {
    key: 'DYNAMIC_CTA_SELECTION',
    label: 'Dynamic CTA Pool Selection',
    description: 'Enable dynamic CTA pool selection based on classified topic',
  },
  {
    key: 'DYNAMIC_ACTIONS',
    label: 'Dynamic Actions',
    description: 'Enable dynamic actions (V3.5 legacy)',
    legacy: true,
  },
  {
    key: 'DYNAMIC_CHIPS',
    label: 'Dynamic Chips',
    description: 'Enable dynamic chips (V3.5 legacy)',
    legacy: true,
  },
  {
    key: 'GUIDANCE_MODULES',
    label: 'Guidance Modules',
    description: 'Enable guidance modules (V3.5 legacy)',
    legacy: true,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * FeatureFlagsSettings Component
 *
 * Manages pipeline feature flags for V3.5 and V4 pipelines:
 * - V4_PIPELINE: Enables the V4 topic classification pipeline
 * - DYNAMIC_CTA_SELECTION: Enables dynamic CTA pool selection
 * - DYNAMIC_ACTIONS: V3.5 legacy flag
 * - DYNAMIC_CHIPS: V3.5 legacy flag
 * - GUIDANCE_MODULES: V3.5 legacy flag
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
          Control which pipeline behaviors are active for this tenant. V4 flags enable
          topic classification and dynamic CTA pool selection. V3.5 legacy flags control
          the older dynamic action and chip selection behaviors.
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
            <span className="font-semibold">Note:</span> V4_PIPELINE and DYNAMIC_CTA_SELECTION work
            together — enable both to activate the full V4.1 experience. V3.5 legacy flags are
            independent and apply only when V4_PIPELINE is off.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
