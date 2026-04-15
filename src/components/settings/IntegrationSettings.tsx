/**
 * IntegrationSettings Component
 * External integration configuration (Bubble, webhooks)
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Integration Settings Component
 *
 * Manages external integration configuration:
 * - bubble_integration.webhook_url: Bubble webhook URL for form submissions
 * - bubble_integration.api_key: Bubble API key for data queries
 *
 * @example
 * ```tsx
 * <IntegrationSettings />
 * ```
 */
export const IntegrationSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const webhookUrl = (baseConfig as any)?.bubble_integration?.webhook_url ?? '';
  const apiKey = (baseConfig as any)?.bubble_integration?.api_key ?? '';

  const updateField = (field: string, value: string) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!(state.config.baseConfig as any).bubble_integration) {
          (state.config.baseConfig as any).bubble_integration = {};
        }
        (state.config.baseConfig as any).bubble_integration[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bubble Integration</CardTitle>
        <CardDescription>
          Webhook and API configuration for Bubble integration (legacy — being phased out)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL */}
        <Input
          label="Webhook URL"
          type="url"
          value={webhookUrl}
          onChange={(e) => updateField('webhook_url', e.target.value)}
          placeholder="https://your-app.bubbleapps.io/api/1.1/wf/webhook"
          helperText="Bubble webhook URL for form submission forwarding"
        />

        {/* API Key */}
        <Input
          label="API Key"
          type="password"
          value={apiKey}
          onChange={(e) => updateField('api_key', e.target.value)}
          placeholder="Enter Bubble API key"
          helperText="Bubble Data API key for user/recipient lookups"
        />
      </CardContent>
    </Card>
  );
};
