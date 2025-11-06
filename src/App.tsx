/**
 * App Component
 * Main application component with React Router configuration
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { Layout } from './components/layout';
import {
  HomePage,
  DashboardPage,
  ProgramsPage,
  FormsPage,
  CTAsPage,
  BranchesPage,
  ActionChipsPage,
  CardsPage,
  SettingsPage,
  NotFoundPage,
} from './pages';
import { useAutoSave } from './hooks/useAutoSave';

/**
 * Main Application Component
 *
 * Features:
 * - React Router v6 configuration
 * - Error boundary for error handling
 * - Toast notification system
 * - Layout with nested routes
 * - Route definitions for all pages
 *
 * Routes:
 * - / - Home page (tenant selector)
 * - /dashboard - Configuration flow diagram
 * - /programs - Programs editor page
 * - /forms - Forms editor page
 * - /ctas - CTAs editor page
 * - /branches - Branches editor page
 * - /action-chips - Action Chips editor page
 * - /cards - Card inventory page
 * - /settings - Configuration settings
 * - * - 404 Not Found page
 *
 * @example
 * ```tsx
 * <App />
 * ```
 */
const App: React.FC = () => {
  // Enable auto-save functionality
  useAutoSave();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Toast Notification System */}
        <ToastContainer />

        {/* Main Routes */}
        <Routes>
          {/* Layout with nested routes */}
          <Route path="/" element={<Layout />}>
            {/* Home page */}
            <Route index element={<HomePage />} />

            {/* Dashboard - Configuration flow diagram */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Programs section */}
            <Route path="programs" element={<ProgramsPage />} />

            {/* Forms section */}
            <Route path="forms" element={<FormsPage />} />

            {/* CTAs section */}
            <Route path="ctas" element={<CTAsPage />} />

            {/* Branches section */}
            <Route path="branches" element={<BranchesPage />} />

            {/* Action Chips section */}
            <Route path="action-chips" element={<ActionChipsPage />} />

            {/* Card inventory section (optional) */}
            <Route path="cards" element={<CardsPage />} />

            {/* Settings section */}
            <Route path="settings" element={<SettingsPage />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
