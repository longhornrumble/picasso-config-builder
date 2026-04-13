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
 * - from_email: Sender address for all outbound notifications
 *
 * @example
 * ```tsx
 * <NotificationSettings />
 * ```
 */
export const NotificationSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const fromEmail = baseConfig?.notification_settings?.from_email ?? '';

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
