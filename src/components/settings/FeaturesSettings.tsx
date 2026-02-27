/**
 * FeaturesSettings Component
 * Feature flags and capabilities configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { FeaturesConfig, CalloutConfig } from '@/types/config';

/**
 * Features Settings Component
 *
 * Manages feature flags and capabilities:
 * - Core features (uploads, voice, streaming, etc.)
 * - Dashboard features
 * - Optional callout configuration
 *
 * @example
 * ```tsx
 * <FeaturesSettings />
 * ```
 */
export const FeaturesSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  // Update features field
  const updateFeatures = (field: string, value: any) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.features) {
          state.config.baseConfig.features = {} as any;
        }
        (state.config.baseConfig.features as any)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  // Update callout sub-field
  const updateCallout = (field: string, value: any) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.features) {
          state.config.baseConfig.features = {} as any;
        }
        if (!state.config.baseConfig.features.callout) {
          state.config.baseConfig.features.callout = {} as any;
        }
        (state.config.baseConfig.features.callout as any)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  const features: Partial<FeaturesConfig> = baseConfig?.features || {};
  const callout: Partial<CalloutConfig> = features.callout || {};

  // Feature toggle component
  const FeatureToggle: React.FC<{ label: string; field: string; description?: string }> = ({ label, field, description }) => (
    <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1 pr-4">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <input
        type="checkbox"
        checked={(features as any)[field] || false}
        onChange={(e) => updateFeatures(field, e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features & Capabilities</CardTitle>
        <CardDescription>
          Enable or disable specific features for this tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Features */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Core Features</h3>
          <div className="space-y-1">
            <FeatureToggle
              label="File Uploads"
              field="uploads"
              description="Allow users to upload files"
            />
            <FeatureToggle
              label="Photo Uploads"
              field="photo_uploads"
              description="Allow users to upload photos/images"
            />
            <FeatureToggle
              label="Voice Input"
              field="voice_input"
              description="Enable voice-to-text input"
            />
            <FeatureToggle
              label="Streaming Responses"
              field="streaming"
              description="Stream AI responses in real-time"
            />
            <FeatureToggle
              label="Conversational Forms"
              field="conversational_forms"
              description="Enable forms collected through conversation"
            />
            <FeatureToggle
              label="Smart Response Cards"
              field="smart_cards"
              description="Show contextual action cards"
            />
            <FeatureToggle
              label="SMS Notifications"
              field="sms"
              description="Enable SMS notifications"
            />
            <FeatureToggle
              label="Web Chat"
              field="webchat"
              description="Enable web-based chat interface"
            />
            <FeatureToggle
              label="QR Code Access"
              field="qr"
              description="Allow QR code scanning for quick access"
            />
          </div>
        </div>

        {/* AI & Integration Features */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">AI & Integrations</h3>
          <div className="space-y-1">
            <FeatureToggle
              label="Bedrock Knowledge Base"
              field="bedrock_kb"
              description="Use AWS Bedrock for knowledge retrieval"
            />
            <FeatureToggle
              label="ATS Integration"
              field="ats"
              description="Applicant Tracking System integration"
            />
            <FeatureToggle
              label="Interview Scheduling"
              field="interview_scheduling"
              description="Enable automated interview scheduling"
            />
          </div>
        </div>

        {/* Dashboard Features */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Dashboard Access</h3>
          <div className="space-y-1">
            <FeatureToggle
              label="Conversations Dashboard"
              field="dashboard_conversations"
              description="Access to conversation analytics"
            />
            <FeatureToggle
              label="Forms Dashboard"
              field="dashboard_forms"
              description="Access to form submission data"
            />
            <FeatureToggle
              label="Attribution Dashboard"
              field="dashboard_attribution"
              description="Access to attribution tracking"
            />
          </div>
        </div>

        {/* Callout Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Callout Banner</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 pr-4">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  Enable Callout
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Show a banner message in the chat
                </p>
              </div>
              <input
                type="checkbox"
                checked={callout.enabled || false}
                onChange={(e) => updateCallout('enabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {callout.enabled && (
              <>
                <Input
                  label="Callout Text"
                  value={callout.text || ''}
                  onChange={(e) => updateCallout('text', e.target.value)}
                  placeholder="e.g., New feature: Now accepting applications!"
                  helperText="Message to display in the callout banner"
                />
                <Input
                  label="Display Delay (ms)"
                  type="number"
                  min={0}
                  value={callout.delay?.toString() || '0'}
                  onChange={(e) => updateCallout('delay', parseInt(e.target.value, 10))}
                  placeholder="0"
                  helperText="Delay before showing callout (milliseconds)"
                />
                <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-1 pr-4">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                      Auto Dismiss
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically hide callout after timeout
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={callout.auto_dismiss || false}
                    onChange={(e) => updateCallout('auto_dismiss', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
                {callout.auto_dismiss && (
                  <Input
                    label="Dismiss Timeout (ms)"
                    type="number"
                    min={0}
                    value={callout.dismiss_timeout?.toString() || '5000'}
                    onChange={(e) => updateCallout('dismiss_timeout', parseInt(e.target.value, 10))}
                    placeholder="5000"
                    helperText="Time before auto-dismissing (milliseconds)"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
