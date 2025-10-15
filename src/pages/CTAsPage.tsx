/**
 * CTAsPage Component
 * CTAs editor page with full CRUD functionality
 */

import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { CTAEditor } from '@/components/editors';

/**
 * CTAs Page
 *
 * Full-featured CTA editor with create, read, update, and delete operations
 *
 * @example
 * ```tsx
 * <CTAsPage />
 * ```
 */
export const CTAsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <MousePointerClick className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call-to-Actions</h1>
          <p className="text-gray-600 mt-1">
            Create and manage CTA buttons with various action types
          </p>
        </div>
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

      {/* CTA Editor */}
      {tenantId && <CTAEditor />}
    </div>
  );
};
