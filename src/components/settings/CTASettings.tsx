/**
 * CTASettings Component
 * Global CTA behavior configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { CTASettings as CTASettingsType } from '@/types/config';

/**
 * CTA Settings Component
 *
 * Manages global CTA behavior settings:
 * - fallback_branch: Branch to show when no keyword match found
 * - max_ctas_per_response: Maximum number of CTAs to display at once
 *
 * @example
 * ```tsx
 * <CTASettings />
 * ```
 */
export const CTASettings: React.FC = () => {
  const branches = useConfigStore((state) => state.branches.getAllBranches());
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const markDirty = useConfigStore((state) => state.config.markDirty);

  // Get current CTA settings with defaults
  const ctaSettings: CTASettingsType = baseConfig?.cta_settings || {};
  const fallbackBranch = ctaSettings.fallback_branch || '';
  const maxCtas = ctaSettings.max_ctas_per_response || 4;

  // Update CTA settings in baseConfig
  const updateCTASettings = (updates: Partial<CTASettingsType>) => {
    if (!baseConfig) return;

    const newSettings = {
      ...ctaSettings,
      ...updates,
    };

    // Update the baseConfig directly through Immer
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        state.config.baseConfig.cta_settings = newSettings;
      }
    });

    markDirty();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CTA Behavior</CardTitle>
        <CardDescription>
          Configure global call-to-action display and routing behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fallback Branch */}
        <div className="w-full">
          <Select
            label="Fallback Branch"
            value={fallbackBranch || '__none__'}
            onValueChange={(newValue) => {
              updateCTASettings({
                fallback_branch: newValue === '__none__' ? undefined : newValue,
              });
            }}
            options={[
              { value: '__none__', label: 'None (no CTAs shown when no match)' },
              ...branches.map((b) => ({
                value: b.id,
                label: b.id,
              })),
            ]}
            helperText="Show these CTAs when no branch matches user query (recommended for general_help or similar)"
            disabled={branches.length === 0}
          />
          {branches.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              No branches available. Create branches first to enable fallback routing.
            </p>
          )}
        </div>

        {/* Max CTAs Per Response */}
        <div className="w-full">
          <Input
            label="Max CTAs Per Response"
            type="number"
            min={1}
            max={10}
            value={maxCtas.toString()}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1 && value <= 10) {
                updateCTASettings({
                  max_ctas_per_response: value,
                });
              }
            }}
            helperText="Maximum number of CTAs to show at once (1-10, default: 4)"
          />
        </div>
      </CardContent>
    </Card>
  );
};
