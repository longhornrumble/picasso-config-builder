/**
 * FeatureFlagsSettings Component
 * Feature flag toggles for V3.5 and V4 pipeline modes
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { Zap } from 'lucide-react';

const FLAG_DEFINITIONS = [
  {
    key: 'V4_PIPELINE',
    label: 'V4 Pipeline',
    description: 'Enable modular conversational pipeline with separate action selection. Replaces V3.5 Tag & Map.',
    isV4: true,
  },
  {
    key: 'DYNAMIC_ACTIONS',
    label: 'Dynamic Actions (V3.5)',
    description: 'Enable AI-driven CTA vocabulary with Tag & Map. Incompatible with V4 Pipeline.',
    isV4: false,
  },
  {
    key: 'DYNAMIC_CHIPS',
    label: 'Dynamic CHIPS (V3.5)',
    description: 'Enable AI-generated follow-up suggestion chips. Incompatible with V4 Pipeline.',
    isV4: false,
  },
  {
    key: 'GUIDANCE_MODULES',
    label: 'Guidance Modules',
    description: 'Enable topic-specific tone and behavior instructions in the AI prompt.',
    isV4: false,
  },
] as const;

export const FeatureFlagsSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const featureFlags = baseConfig?.feature_flags || {};
  const isV4 = featureFlags.V4_PIPELINE === true;

  const updateFeatureFlag = (flag: string, value: boolean) => {
    useConfigStore.setState((state) => {
      if (!state.config.baseConfig) return;
      if (!state.config.baseConfig.feature_flags) {
        state.config.baseConfig.feature_flags = {};
      }
      (state.config.baseConfig.feature_flags as any)[flag] = value;

      // V4 mutual exclusivity
      if (flag === 'V4_PIPELINE' && value) {
        state.config.baseConfig.feature_flags.DYNAMIC_ACTIONS = false;
        state.config.baseConfig.feature_flags.DYNAMIC_CHIPS = false;
      }
      if ((flag === 'DYNAMIC_ACTIONS' || flag === 'DYNAMIC_CHIPS') && value) {
        state.config.baseConfig.feature_flags.V4_PIPELINE = false;
      }

      state.config.isDirty = true;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Feature Flags
        </CardTitle>
        <CardDescription>
          Control AI pipeline mode and behavior features. V4 Pipeline and V3.5 Dynamic Actions/CHIPS are mutually exclusive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {FLAG_DEFINITIONS.map((flag) => {
          const checked = (featureFlags as any)[flag.key] === true;
          const isDisabledByV4 = isV4 && !flag.isV4 && (flag.key === 'DYNAMIC_ACTIONS' || flag.key === 'DYNAMIC_CHIPS');

          return (
            <div
              key={flag.key}
              className={`flex items-start justify-between py-3 px-3 rounded-lg ${
                flag.isV4
                  ? 'bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800'
                  : ''
              } ${isDisabledByV4 ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 pr-4">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  {flag.label}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {flag.description}
                </p>
                {isDisabledByV4 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                    Disabled — V4 Pipeline is active
                  </p>
                )}
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => updateFeatureFlag(flag.key, e.target.checked)}
                disabled={isDisabledByV4}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
