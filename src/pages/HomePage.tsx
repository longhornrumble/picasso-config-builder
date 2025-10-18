/**
 * HomePage Component
 * Landing page with tenant selector and quick actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, FileText, MousePointerClick, GitBranch, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { TenantSelector } from '@/components/TenantSelector';
import { useConfigStore } from '@/store';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

/**
 * Home Page
 *
 * Features:
 * - Welcome message
 * - Tenant selector
 * - Quick action cards to navigate to sections
 * - Overview of current tenant (if loaded)
 *
 * @example
 * ```tsx
 * <HomePage />
 * ```
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);

  const quickActions: QuickAction[] = [
    {
      title: 'Programs',
      description: 'Define and manage program eligibility',
      icon: <ListChecks className="w-8 h-8" />,
      path: '/programs',
      color: 'text-blue-600',
    },
    {
      title: 'Forms',
      description: 'Configure multi-field conversational forms',
      icon: <FileText className="w-8 h-8" />,
      path: '/forms',
      color: 'text-green-600',
    },
    {
      title: 'CTAs',
      description: 'Create call-to-action buttons',
      icon: <MousePointerClick className="w-8 h-8" />,
      path: '/ctas',
      color: 'text-purple-600',
    },
    {
      title: 'Branches',
      description: 'Route conversations based on keywords',
      icon: <GitBranch className="w-8 h-8" />,
      path: '/branches',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to Picasso Config Builder
        </h1>
      </div>

      {/* Tenant Selector Card */}
      <Card className="card-container">
        <CardHeader>
          <CardTitle>Select a Tenant</CardTitle>
          <CardDescription>
            Choose a tenant to load and edit its configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantSelector className="justify-center" />
        </CardContent>
      </Card>

      {/* Current Tenant Overview */}
      {tenantId && (
        <Card className="card-container">
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>Tenant: {tenantId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid-responsive-2-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {Object.keys(programs).length}
                </div>
                <div className="text-responsive-sm text-gray-600">Programs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {Object.keys(forms).length}
                </div>
                <div className="text-responsive-sm text-gray-600">Forms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {Object.keys(ctas).length}
                </div>
                <div className="text-responsive-sm text-gray-600">CTAs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {Object.keys(branches).length}
                </div>
                <div className="text-responsive-sm text-gray-600">Branches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="w-fluid">
        <h2 className="text-responsive-lg font-semibold text-gray-900 mb-4 text-center">
          Quick Actions
        </h2>
        <div className="grid-responsive-1-2-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={action.color}>{action.icon}</div>
                  <h3 className="font-semibold text-responsive-base">{action.title}</h3>
                  <p className="text-responsive-sm text-gray-600">{action.description}</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    Open <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      {!tenantId && (
        <Card className="card-container bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-responsive-base mb-2 text-blue-900">
              Getting Started
            </h3>
            <ol className="list-decimal list-inside space-y-4 text-responsive-sm text-blue-800">
              <li>Select a tenant from the dropdown above</li>
              <li>Navigate to a section (Programs, Forms, CTAs, or Branches)</li>
              <li>Create or edit configurations</li>
              <li>Save your changes</li>
              <li>Deploy to production when ready</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
