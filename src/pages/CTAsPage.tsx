/**
 * CTAsPage Component
 * CTAs editor page placeholder
 */

import React from 'react';
import { MousePointerClick, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * CTAs Page
 *
 * Placeholder for Phase 3 - CTAs Editor
 *
 * @example
 * ```tsx
 * <CTAsPage />
 * ```
 */
export const CTAsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const ctaList = Object.entries(ctas);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MousePointerClick className="w-8 h-8 text-purple-600" />
            Call-to-Actions
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage CTA buttons with actions
          </p>
        </div>
        <Button variant="primary" disabled className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New CTA
        </Button>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Please select a tenant from the header to view and edit CTAs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTAs List or Empty State */}
      {tenantId && (
        <>
          {ctaList.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <MousePointerClick className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No CTAs Defined
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first call-to-action button.
                </p>
                <Button variant="primary" disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create CTA
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {ctaList.map(([ctaId, cta]) => (
                <Card key={ctaId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{cta.label || ctaId}</CardTitle>
                        <CardDescription>ID: {ctaId}</CardDescription>
                      </div>
                      <Badge variant="info">
                        {cta.action || 'No action'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cta.action === 'external_link' && cta.url && (
                      <p className="text-sm text-gray-600">URL: {cta.url}</p>
                    )}
                    {cta.action === 'start_form' && cta.formId && (
                      <p className="text-sm text-gray-600">Form: {cta.formId}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Placeholder Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Coming in Phase 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-3">
            The CTAs Editor will be implemented in Phase 3 with the following features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Create and edit CTA definitions</li>
            <li>Configure button labels and styling</li>
            <li>Set action types (URL, form, dialog)</li>
            <li>Manage CTA dependencies</li>
            <li>Preview CTA appearance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
