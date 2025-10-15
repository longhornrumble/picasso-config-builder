/**
 * Breadcrumbs Component
 * Navigation breadcrumbs showing current location
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * Breadcrumb Navigation
 *
 * Features:
 * - Shows current location path
 * - Clickable segments to navigate back
 * - Home icon for root
 * - Auto-generates from URL
 *
 * @example
 * ```tsx
 * <Breadcrumbs />
 * ```
 */
export const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  // Generate breadcrumb items from pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean);

    if (paths.length === 0) {
      return [];
    }

    // Map of route segments to labels
    const labelMap: Record<string, string> = {
      programs: 'Programs',
      forms: 'Forms',
      ctas: 'CTAs',
      branches: 'Branches',
      cards: 'Card Inventory',
      settings: 'Settings',
      edit: 'Edit',
      new: 'New',
    };

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: labelMap[segment] || segment,
        path: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
      {/* Home Link */}
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-green-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {/* Breadcrumb Items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={item.path}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-green-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
