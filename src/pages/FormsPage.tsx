/**
 * FormsPage Component
 * Forms editor page placeholder
 */

import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Forms Page
 *
 * Placeholder for Phase 3 - Forms Editor
 *
 * @example
 * ```tsx
 * <FormsPage />
 * ```
 */
export const FormsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const forms = useConfigStore((state) => state.forms.forms);
  const formList = Object.entries(forms);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            Conversational Forms
          </h1>
          <p className="text-gray-600 mt-2">
            Configure multi-field forms for conversational data collection
          </p>
        </div>
        <Button variant="primary" disabled className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Form
        </Button>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Please select a tenant from the header to view and edit forms.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Forms List or Empty State */}
      {tenantId && (
        <>
          {formList.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Forms Defined
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first conversational form.
                </p>
                <Button variant="primary" disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {formList.map(([formId, form]) => (
                <Card key={formId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{form.title || formId}</CardTitle>
                        <CardDescription>ID: {formId}</CardDescription>
                      </div>
                      <Badge variant="info">
                        {form.fields?.length || 0} fields
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {form.description || 'No description available'}
                    </p>
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
            The Forms Editor will be implemented in Phase 3 with the following features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Create and edit multi-field forms</li>
            <li>Add, remove, and reorder fields</li>
            <li>Configure field types and validation</li>
            <li>Set completion messages and CTAs</li>
            <li>Preview conversational flow</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
