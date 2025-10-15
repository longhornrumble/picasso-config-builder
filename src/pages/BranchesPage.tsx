/**
 * BranchesPage Component
 * Branches editor page placeholder
 */

import React from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Branches Page
 *
 * Placeholder for Phase 3 - Branches Editor
 *
 * @example
 * ```tsx
 * <BranchesPage />
 * ```
 */
export const BranchesPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const branches = useConfigStore((state) => state.branches.branches);
  const branchList = Object.entries(branches);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-orange-600" />
            Conversation Branches
          </h1>
          <p className="text-gray-600 mt-2">
            Route conversations based on keywords and intents
          </p>
        </div>
        <Button variant="primary" disabled className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Branch
        </Button>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Please select a tenant from the header to view and edit branches.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Branches List or Empty State */}
      {tenantId && (
        <>
          {branchList.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Branches Defined
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first conversation branch.
                </p>
                <Button variant="primary" disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create Branch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {branchList.map(([branchId, branch]) => (
                <Card key={branchId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Branch: {branchId}</CardTitle>
                        <CardDescription>ID: {branchId}</CardDescription>
                      </div>
                      <Badge variant="info">
                        {branch.detection_keywords?.length || 0} keywords
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {branch.detection_keywords && branch.detection_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {branch.detection_keywords.map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
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
            The Branches Editor will be implemented in Phase 3 with the following features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Create and edit conversation branches</li>
            <li>Configure keyword triggers</li>
            <li>Set priority and responses</li>
            <li>Manage primary and secondary CTAs</li>
            <li>Test branch matching logic</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
