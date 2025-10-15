/**
 * Sidebar Component
 * Left navigation menu with links to all sections
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  FileText,
  MousePointerClick,
  GitBranch,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge, Button } from '../ui';
import { useConfigStore } from '@/store';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Application Sidebar
 *
 * Features:
 * - Navigation links to all sections
 * - Active state highlighting
 * - Badge showing error count
 * - Collapsible on mobile
 * - Sticky positioning
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export const Sidebar: React.FC = () => {
  const sidebarOpen = useConfigStore((state) => state.ui.sidebarOpen);
  const toggleSidebar = useConfigStore((state) => state.ui.toggleSidebar);
  const errors = useConfigStore((state) => state.validation.errors);

  // Calculate total error count
  const errorCount = Object.values(errors).reduce(
    (total, entityErrors) => total + entityErrors.length,
    0
  );

  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/programs',
      label: 'Programs',
      icon: <ListChecks className="w-5 h-5" />,
    },
    {
      to: '/forms',
      label: 'Forms',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      to: '/ctas',
      label: 'CTAs',
      icon: <MousePointerClick className="w-5 h-5" />,
    },
    {
      to: '/branches',
      label: 'Branches',
      icon: <GitBranch className="w-5 h-5" />,
    },
    {
      to: '/cards',
      label: 'Card Inventory',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        flex flex-col sticky top-16 h-[calc(100vh-4rem)]
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}
    >
      {/* Sidebar Header with Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {sidebarOpen && (
          <span className="text-sm font-semibold text-gray-700">Navigation</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="ml-auto"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
            title={!sidebarOpen ? item.label : undefined}
          >
            {item.icon}
            {sidebarOpen && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Error Count Badge */}
      {errorCount > 0 && (
        <div className="p-4 border-t border-gray-100">
          <div
            className={`flex items-center gap-2 ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <Badge variant="error" className="flex items-center gap-1">
              {errorCount}
            </Badge>
            {sidebarOpen && (
              <span className="text-xs text-gray-600">
                {errorCount === 1 ? 'error' : 'errors'}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
