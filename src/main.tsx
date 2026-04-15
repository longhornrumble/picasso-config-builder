/**
 * Main Entry Point
 * Renders the application with providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import './index.css';
import { TooltipProvider } from './components/ui';
import { AuthProvider } from '@/context/AuthContext';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkKey}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#50C878',
          borderRadius: '0.5rem',
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        },
      }}
    >
      <AuthProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </AuthProvider>
    </ClerkProvider>
  </React.StrictMode>
);
