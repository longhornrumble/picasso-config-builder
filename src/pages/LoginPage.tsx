/**
 * Login Page
 * Authentication gateway for Picasso Config Builder
 */

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/ui';

const BUBBLE_AUTH_URL = import.meta.env.VITE_BUBBLE_AUTH_URL || '';

/**
 * Login Page Component
 *
 * Features:
 * - Bubble SSO integration via redirect
 * - Manual token entry for development
 * - Clean, centered layout with emerald branding
 * - Error display for expired/invalid tokens
 */
export const LoginPage: React.FC = () => {
  const { error } = useAuth();

  const handleLogin = () => {
    if (BUBBLE_AUTH_URL) {
      window.location.href = BUBBLE_AUTH_URL;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
          filter: 'blur(120px)',
        }}
      />

      {/* Main container */}
      <div className="max-w-md w-full relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎨</div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            Picasso Config Builder
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Sign in to manage chat widget configurations
          </p>
        </div>

        {/* Login card */}
        <Card className="p-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Sign in button */}
          <Button
            onClick={handleLogin}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/30"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in with MyRecruiter
          </Button>

          {/* Help text */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Having trouble signing in?{' '}
            <a
              href="mailto:support@myrecruiter.ai"
              className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
            >
              Contact support
            </a>
          </p>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Picasso Config Builder
        </p>
      </div>
    </div>
  );
};
