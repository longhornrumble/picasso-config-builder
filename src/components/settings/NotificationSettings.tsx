/**
 * NotificationSettings Component
 * Notification delivery behavior configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Notification Settings Component
 *
 * Manages notification delivery configuration:
 * - bubble_forwarding.enabled: Toggle SES event forwarding to Bubble (legacy)
 * - from_email: Sender address for all outbound notifications
 *
 * The notification_settings object may not exist in baseConfig — nested access
 * is handled safely and the object is created on first edit.
 *
 * @example
 * ```tsx
 * <NotificationSettings />
 * ```
 */
export const NotificationSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const bubbleForwardingEnabled =
    baseConfig?.notification_settings?.bubble_forwarding?.enabled ?? false;
  const fromEmail = baseConfig?.notification_settings?.from_email ?? '';

  const updateBubbleForwarding = (enabled: boolean) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.notification_settings) {
          state.config.baseConfig.notification_settings = {};
        }
        state.config.baseConfig.notification_settings.bubble_forwarding = { enabled };
        state.config.isDirty = true;
      }
    });
  };

  const updateFromEmail = (value: string) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.notification_settings) {
          state.config.baseConfig.notification_settings = {};
        }
        state.config.baseConfig.notification_settings.from_email = value;
        state.config.isDirty = true;
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure notification delivery behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bubble Forwarding Toggle */}
        <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <label
              htmlFor="bubble-forwarding-enabled"
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              Bubble Forwarding
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              When enabled, SES delivery events are also forwarded to Bubble (legacy). Disable after
              confirming native notifications are working.
            </p>
          </div>
          <input
            id="bubble-forwarding-enabled"
            type="checkbox"
            checked={bubbleForwardingEnabled}
            onChange={(e) => updateBubbleForwarding(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer mt-0.5"
            aria-describedby="bubble-forwarding-desc"
          />
        </div>

        {/* From Email */}
        <Input
          label="From Email"
          type="email"
          value={fromEmail}
          onChange={(e) => updateFromEmail(e.target.value)}
          placeholder="notify@myrecruiter.ai"
          helperText="Sender email address for all notifications. Must be a verified SES identity. Defaults to notify@myrecruiter.ai"
        />
      </CardContent>
    </Card>
  );
};
