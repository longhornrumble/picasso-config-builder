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
    <main className="app-main-content">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay isLoading={isLoading} />}

      {/* Content Container - Fluid with responsive padding */}
      <div className={`content-container ${className || ''}`}>
        <Breadcrumbs />
        {children}
      </div>
    </main>
  );
};
