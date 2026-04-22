/**
 * App Component
 * Main application component with React Router configuration and authentication
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Show, SignIn, UserButton } from '@clerk/react';
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
  PendingChangesPage,
  SettingsPage,
  NotFoundPage,
} from './pages';
import { useAutoSave } from './hooks/useAutoSave';
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
  // Enable auto-save functionality
  useAutoSave();

  return (
    <>
      {/* Clerk sign-in gate */}
      <Show when="signed-out">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-gray-800">Picasso Config Builder</h1>
              <p className="text-sm text-gray-500">Internal tool — authorized access only</p>
            </div>
            <div className="flex justify-center">
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-xl border border-gray-100 w-full',
                    footer: 'hidden',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </Show>

      {/* Authenticated — show main app */}
      <Show when="signed-in">
        {renderApp()}
      </Show>
    </>
  );
};

/** Main app content — only rendered when Clerk is signed in */
function renderApp() {
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

            {/* KB-freshness review (read-only in Phase 2) */}
            <Route path="pending-changes" element={<PendingChangesPage />} />

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
