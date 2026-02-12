/**
 * Login Page
 * Authentication gateway for Picasso Config Builder
 */

import React, { useState } from 'react';
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
  const [manualToken, setManualToken] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(!BUBBLE_AUTH_URL);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleBubbleLogin = () => {
    if (BUBBLE_AUTH_URL) {
      window.location.href = BUBBLE_AUTH_URL;
    } else {
      setShowManualLogin(true);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      // Store token and trigger auth check
      localStorage.setItem('config_builder_token', manualToken.trim());
      localStorage.removeItem('config_builder_user'); // Will be extracted from token

      // Reload page to trigger auth initialization
      window.location.reload();
    } else {
      setLocalError('Please enter a valid token');
    }
  };

  const displayError = error || localError;

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
          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{displayError}</p>
            </div>
          )}

          {/* Login options */}
          {!showManualLogin ? (
            <div className="space-y-4">
              {/* Primary CTA - Bubble SSO */}
              <Button
                onClick={handleBubbleLogin}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/30"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign in with MyRecruiter
              </Button>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs font-bold uppercase text-gray-400 tracking-wider">
                    or
                  </span>
                </div>
              </div>

              {/* Secondary CTA - Manual token */}
              <Button
                onClick={() => setShowManualLogin(true)}
                variant="outline"
                className="w-full py-3 px-6 rounded-xl font-semibold"
              >
                Enter Token Manually
              </Button>
            </div>
          ) : (
            <form onSubmit={handleManualLogin} className="space-y-6">
              {/* Token input */}
              <div>
                <label
                  htmlFor="token"
                  className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-3"
                >
                  JWT Token
                </label>
                <textarea
                  id="token"
                  value={manualToken}
                  onChange={(e) => {
                    setManualToken(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="Paste your JWT token here..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none resize-none h-32 font-mono text-gray-700 placeholder-gray-400 transition-colors duration-200"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!manualToken.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 disabled:shadow-none"
              >
                Sign In
              </Button>

              {/* Back link */}
              {BUBBLE_AUTH_URL && (
                <button
                  type="button"
                  onClick={() => {
                    setShowManualLogin(false);
                    setLocalError(null);
                  }}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to login options
                </button>
              )}
            </form>
          )}

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
