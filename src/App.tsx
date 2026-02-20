/**
 * App Component
 * Main application component with React Router configuration and authentication
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
  AvailableActionsPage,
  CardsPage,
  SettingsPage,
  NotFoundPage,
} from './pages';
import { LoginPage } from './pages/LoginPage';
import { useAutoSave } from './hooks/useAutoSave';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './components/ui';

/**
 * Main Application Component
 *
 * Features:
 * - Authentication gating with Bubble SSO
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
  const { isAuthenticated, loading } = useAuth();

  // Enable auto-save functionality
  useAutoSave();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated - show main app
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

            {/* Available Actions / Vocabulary section */}
            <Route path="available-actions" element={<AvailableActionsPage />} />

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
