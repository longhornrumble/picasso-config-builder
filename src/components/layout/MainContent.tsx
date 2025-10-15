/**
 * MainContent Component
 * Content area wrapper with loading overlay and breadcrumbs
 */

import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { LoadingOverlay } from '../ui';
import { useConfigStore } from '@/store';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main Content Area
 *
 * Features:
 * - Scrollable content area
 * - Padding and max-width constraints
 * - Loading overlay when loading
 * - Breadcrumb navigation
 *
 * @example
 * ```tsx
 * <MainContent>
 *   <ProgramsPage />
 * </MainContent>
 * ```
 */
export const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  const loading = useConfigStore((state) => state.ui.loading);

  // Check if any loading is in progress
  const isLoading = loading ? Object.values(loading).some(Boolean) : false;

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 relative">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay isLoading={isLoading} />}

      {/* Content Container */}
      <div className={`max-w-7xl mx-auto p-6 ${className || ''}`}>
        <Breadcrumbs />
        {children}
      </div>
    </main>
  );
};
