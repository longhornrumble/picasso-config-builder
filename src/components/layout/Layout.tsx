/**
 * Layout Component
 * Main layout composition combining Header, Sidebar, and MainContent
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

/**
 * Application Layout
 *
 * Layout structure:
 * - Header (top, sticky)
 * - Sidebar (left, sticky)
 * - MainContent (center, scrollable)
 * - Outlet for nested routes
 *
 * @example
 * ```tsx
 * <Layout />
 * ```
 */
export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </div>
  );
};
