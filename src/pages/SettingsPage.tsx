/**
 * SettingsPage Component
 * Settings and configuration metadata page
 */

import React from 'react';
import { Settings, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Settings Page
 *
 * Displays configuration metadata and validation status
 *
 * @example
 * ```tsx
 * <SettingsPage />
 * ```
 */
export const SettingsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const isDirty = useConfigStore((state) => state.config.isDirty);
  const lastSaved = useConfigStore((state) => state.config.lastSaved);
  const isValid = useConfigStore((state) => state.validation.isValid);
  const errors = useConfigStore((state) => state.validation.errors);
  const warnings = useConfigStore((state) => state.validation.warnings);
  const lastValidated = useConfigStore((state) => state.validation.lastValidated);

  const errorCount = Object.values(errors).reduce(
    (total, entityErrors) => total + entityErrors.length,
    0
  );
  const warningCount = Object.values(warnings).reduce(
    (total, entityWarnings) => total + entityWarnings.length,
    0
  );

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configuration metadata and validation status
        </p>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-300">
              Please select a tenant from the header to view settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      {tenantId && baseConfig && (
        <>
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
              <CardDescription>Current configuration metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant ID</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{tenantId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Config Version</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{baseConfig.version || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Tier</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{baseConfig.subscription_tier || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <div className="mt-1">
                    {isDirty ? (
                      <Badge variant="warning">Unsaved changes</Badge>
                    ) : (
                      <Badge variant="success">Saved</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Status</CardTitle>
              <CardDescription>Configuration validation results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {isValid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Valid Configuration</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-semibold">Invalid Configuration</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Errors</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-500">{errorCount}</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Warnings</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{warningCount}</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Validated</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(lastValidated)}</p>
                </div>
              </div>

              {errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
                  <div className="space-y-2">
                    {Object.entries(errors).map(([entityId, entityErrors]) => (
                      <div key={entityId} className="text-sm">
                        <span className="font-medium text-red-800">{entityId}:</span>{' '}
                        <span className="text-red-700">
                          {entityErrors.map((e) => e.message).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
              <CardDescription>Configuration history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Saved</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(lastSaved)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Config Generated</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(baseConfig.generated_at || null)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Deployment History */}
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-400 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Deployment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Deployment history tracking will be implemented in a future release.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
