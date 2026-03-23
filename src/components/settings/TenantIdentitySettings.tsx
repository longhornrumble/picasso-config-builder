/**
 * TenantIdentitySettings Component
 * Core tenant metadata configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Textarea } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Tenant Identity Settings Component
 *
 * Manages core tenant metadata:
 * - chat_title: Display name for the chat widget
 * - welcome_message: Initial greeting message
 * - subscription_tier: Service tier level
 * - tone_prompt: AI personality/tone guidance
 *
 * @example
 * ```tsx
 * <TenantIdentitySettings />
 * ```
 */
export const TenantIdentitySettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  // Update field in baseConfig
  const updateField = (field: string, value: any) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        (state.config.baseConfig as any)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  // Subscription tier options
  const tierOptions = [
    { value: 'Free', label: 'Free' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Premium', label: 'Premium' },
    { value: 'Enterprise', label: 'Enterprise' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Identity</CardTitle>
        <CardDescription>
          Core tenant metadata and identification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Title */}
        <Input
          label="Chat Title"
          value={baseConfig?.chat_title || ''}
          onChange={(e) => updateField('chat_title', e.target.value)}
          placeholder="e.g., Support Assistant"
          helperText="Display name shown in the chat widget header"
        />

        {/* Organization Name */}
        <Input
          label="Organization Name"
          value={baseConfig?.organization_name || ''}
          onChange={(e) => updateField('organization_name', e.target.value)}
          placeholder="e.g., Austin Angels"
          helperText="Official organization name used in email templates and notifications"
        />

        {/* Chat Subtitle */}
        <Input
          label="Chat Subtitle"
          value={baseConfig?.chat_subtitle || ''}
          onChange={(e) => updateField('chat_subtitle', e.target.value)}
          placeholder="e.g., Powered by MyRecruiter AI"
          helperText="Subtitle displayed below the chat title in the widget header"
        />

        {/* Welcome Message */}
        <Textarea
          label="Welcome Message"
          value={baseConfig?.welcome_message || ''}
          onChange={(e) => updateField('welcome_message', e.target.value)}
          rows={3}
          placeholder="e.g., Welcome! How can I help you today?"
          helperText="Initial greeting message shown when chat opens"
        />

        {/* Subscription Tier */}
        <Select
          label="Subscription Tier"
          value={baseConfig?.subscription_tier || 'Free'}
          onValueChange={(value) => updateField('subscription_tier', value)}
          options={tierOptions}
          helperText="Service tier level for this tenant"
        />

        {/* Tone Prompt */}
        <Textarea
          label="Tone Prompt"
          value={baseConfig?.tone_prompt || ''}
          onChange={(e) => updateField('tone_prompt', e.target.value)}
          rows={4}
          placeholder="e.g., Be friendly, professional, and helpful..."
          helperText="High-level guidance for AI personality and communication style"
        />
      </CardContent>
    </Card>
  );
};
