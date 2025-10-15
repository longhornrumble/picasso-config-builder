/**
 * ProgramsPage Component
 * Programs editor page placeholder
 */

import React from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Programs Page
 *
 * Placeholder for Phase 3 - Programs Editor
 *
 * @example
 * ```tsx
 * <ProgramsPage />
 * ```
 */
export const ProgramsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const programs = useConfigStore((state) => state.programs.programs);
  const programList = Object.entries(programs);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-blue-600" />
            Programs
          </h1>
          <p className="text-gray-600 mt-2">
            Manage program definitions and eligibility criteria
          </p>
        </div>
        <Button variant="primary" disabled className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Program
        </Button>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Please select a tenant from the header to view and edit programs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Programs List or Empty State */}
      {tenantId && (
        <>
          {programList.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Programs Defined
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first program definition.
                </p>
                <Button variant="primary" disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {programList.map(([programId, program]) => (
                <Card key={programId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{program.program_name || programId}</CardTitle>
                        <CardDescription>ID: {programId}</CardDescription>
                      </div>
                      <Badge variant="info">Program</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {program.description || 'No description available'}
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
            The Programs Editor will be implemented in Phase 3 with the following features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Create and edit program definitions</li>
            <li>Configure eligibility criteria</li>
            <li>Set gate types and requirements</li>
            <li>Manage form associations</li>
            <li>Test program logic</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
