/**
 * FeatureFlagsSettings Component
 * V3.5 feature flag toggles for dynamic actions, chips, and guidance modules
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';

export const FeatureFlagsSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const updateFeatureFlag = (flag: string, value: boolean) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.feature_flags) {
          (state.config.baseConfig as any).feature_flags = {};
        }
        ((state.config.baseConfig as any).feature_flags)[flag] = value;
        state.config.isDirty = true;
      }
    });
  };

  const featureFlags = (baseConfig as any)?.feature_flags || {};

  const flags = [
    {
      key: 'DYNAMIC_ACTIONS',
      label: 'Dynamic Actions (V3.5)',
      description: 'Enable AI-driven CTA vocabulary with Tag & Map. The AI tags actions in responses and the mapper converts them to buttons.',
    },
    {
      key: 'DYNAMIC_CHIPS',
      label: 'Dynamic CHIPS',
      description: 'Enable AI-generated follow-up suggestion chips. The AI suggests contextual next questions after each response.',
    },
    {
      key: 'GUIDANCE_MODULES',
      label: 'Guidance Modules',
      description: 'Enable topic-specific tone and behavior instructions injected into the prompt based on conversation context.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags (V3.5)</CardTitle>
        <CardDescription>
          Control V3.5 AI behavior features for this tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          >
            <div className="flex-1 pr-4">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                {flag.label}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {flag.description}
              </p>
            </div>
            <input
              type="checkbox"
              checked={featureFlags[flag.key] || false}
              onChange={(e) => updateFeatureFlag(flag.key, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
