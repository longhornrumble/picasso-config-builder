/**
 * Layout Component
 * Main layout composition combining Header, Sidebar, and MainContent
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { ValidationPanel } from './ValidationPanel';

/**
 * Application Layout
 *
 * Layout structure:
 * - Header (top, sticky)
 * - Sidebar (left, sticky)
 * - MainContent (center, scrollable)
 * - ValidationPanel (bottom-right, floating)
 * - Outlet for nested routes
 *
 * @example
 * ```tsx
 * <Layout />
 * ```
 */
export const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <MainContent>
          <Outlet />
        </MainContent>
      </div>

      {/* Validation Panel (floating) */}
      <ValidationPanel />
    </div>
  );
};
