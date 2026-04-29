/**
 * IntegrationSettings Component
 * External integration configuration (Bubble, webhooks)
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { TenantConfig } from '@/types/config';

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

  // bubble_integration is a legacy passthrough not in TenantConfig's typed surface
  type ConfigWithBubble = TenantConfig & {
    bubble_integration?: { webhook_url?: string; api_key?: string; [k: string]: unknown };
  };
  const webhookUrl = (baseConfig as ConfigWithBubble | null)?.bubble_integration?.webhook_url ?? '';
  const apiKey = (baseConfig as ConfigWithBubble | null)?.bubble_integration?.api_key ?? '';

  const updateField = (field: string, value: string) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        const cfg = state.config.baseConfig as ConfigWithBubble;
        if (!cfg.bubble_integration) {
          cfg.bubble_integration = {};
        }
        cfg.bubble_integration[field] = value;
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
