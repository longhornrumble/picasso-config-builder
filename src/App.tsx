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
import { useSignInToken } from './hooks/useSignInToken';
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

  // Consume a Clerk sign-in token (ticket strategy) if present in the URL.
  // Kicks in BEFORE the sign-in gate; when state === 'consuming' we render a
  // loading screen instead of the sign-in form so the user doesn't see the
  // login UI flash and vanish. On success, Clerk's session becomes active
  // and <Show when="signed-in"> renders the app. On error, we fall through
  // to the sign-in gate with the URL preserved (same flow as no-token).
  const { state: tokenState } = useSignInToken();

  // Preserve the intended destination across Clerk sign-in so deep links like
  // /pending-changes?h=HASH&proposal=... survive the auth round-trip.
  //
  // Clerk defaults post-sign-in navigation to `/` (or ClerkProvider's afterSignInUrl)
  // unless the SignIn component is given an explicit `forceRedirectUrl`. Reading from
  // window.location at render time captures whatever the user arrived on. We only set
  // it when the user is NOT already on `/` — avoids a meaningless self-redirect and
  // keeps normal sign-in-from-home flows unchanged.
  const deepLinkRedirectUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const { pathname, search } = window.location;
    if (pathname === '/' && !search) return undefined;
    return pathname + search;
  }, []);

  // While the sign-in token is being consumed, render a loading screen so the user
  // doesn't see the sign-in form flash. This is a distinct render branch from the
  // Clerk <Show when> logic because it sits BEFORE the sign-in gate.
  if (tokenState === 'consuming') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <Spinner />
          <p className="text-sm text-gray-600">Signing you in…</p>
        </div>
      </div>
    );
  }

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
                forceRedirectUrl={deepLinkRedirectUrl}
                fallbackRedirectUrl="/"
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
