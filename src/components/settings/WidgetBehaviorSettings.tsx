/**
 * WidgetBehaviorSettings Component
 * Widget behavior and interaction configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { WidgetBehaviorConfig } from '@/types/config';

/**
 * Widget Behavior Settings Component
 *
 * Manages widget behavior configuration:
 * - start_open: Whether chat starts open
 * - remember_state: Persist open/closed state
 * - auto_open_delay: Auto-open delay in milliseconds
 *
 * @example
 * ```tsx
 * <WidgetBehaviorSettings />
 * ```
 */
export const WidgetBehaviorSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  // Update widget_behavior field
  const updateWidgetBehavior = (field: string, value: any) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.widget_behavior) {
          state.config.baseConfig.widget_behavior = {} as any;
        }
        (state.config.baseConfig.widget_behavior as any)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  const widgetBehavior: Partial<WidgetBehaviorConfig> = baseConfig?.widget_behavior || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Behavior</CardTitle>
        <CardDescription>
          Configure how the chat widget behaves on page load
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Open */}
        <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Start Open
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Open chat widget automatically on page load
            </p>
          </div>
          <input
            type="checkbox"
            checked={widgetBehavior.start_open || false}
            onChange={(e) => updateWidgetBehavior('start_open', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {/* Remember State */}
        <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Remember State
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Remember whether user closed/opened widget between sessions
            </p>
          </div>
          <input
            type="checkbox"
            checked={widgetBehavior.remember_state || false}
            onChange={(e) => updateWidgetBehavior('remember_state', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {/* Auto Open Delay */}
        <Input
          label="Auto-Open Delay (ms)"
          type="number"
          min={0}
          value={widgetBehavior.auto_open_delay?.toString() || '0'}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 0) {
              updateWidgetBehavior('auto_open_delay', value);
            }
          }}
          placeholder="0"
          helperText="Delay before auto-opening widget (milliseconds). 0 = no auto-open"
        />
      </CardContent>
    </Card>
  );
};
