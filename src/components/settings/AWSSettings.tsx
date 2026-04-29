/**
 * AWSSettings Component
 * AWS service configuration (Super Admin only)
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { AWSConfig, TenantConfig } from '@/types/config';
import { Shield } from 'lucide-react';

/**
 * AWS Settings Component
 *
 * Manages AWS service configuration:
 * - knowledge_base_id: Bedrock Knowledge Base ID
 * - aws_region: AWS region
 *
 * @example
 * ```tsx
 * <AWSSettings />
 * ```
 */
export const AWSSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  // Update aws field
  const updateAWS = (field: string, value: unknown) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.aws) {
          state.config.baseConfig.aws = {} as AWSConfig;
        }
        (state.config.baseConfig.aws as Record<string, unknown>)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  // Update top-level baseConfig field
  const updateBaseConfig = (field: string, value: unknown) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        (state.config.baseConfig as Record<string, unknown>)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  const aws: Partial<AWSConfig> = baseConfig?.aws || {};

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              AWS Configuration
            </CardTitle>
            <CardDescription>
              AWS service integration settings (Super Admin only)
            </CardDescription>
          </div>
          <Badge variant="warning">Super Admin Only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bedrock Model ID */}
        <Input
          label="Bedrock Model ID"
          value={(baseConfig as TenantConfig & { model_id?: string })?.model_id || ''}
          onChange={(e) => updateBaseConfig('model_id', e.target.value)}
          placeholder="us.anthropic.claude-haiku-4-5-20251001-v1:0"
          helperText="Override the default Bedrock model for this tenant. Leave empty to use system default."
        />

        {/* Knowledge Base ID */}
        <Input
          label="Knowledge Base ID"
          value={aws.knowledge_base_id || ''}
          onChange={(e) => updateAWS('knowledge_base_id', e.target.value)}
          placeholder="e.g., ABCDEFGHIJ"
          helperText="AWS Bedrock Knowledge Base identifier"
        />

        {/* AWS Region */}
        <Input
          label="AWS Region"
          value={aws.aws_region || ''}
          onChange={(e) => updateAWS('aws_region', e.target.value)}
          placeholder="e.g., us-east-1"
          helperText="AWS region for services"
        />

      </CardContent>
    </Card>
  );
};
