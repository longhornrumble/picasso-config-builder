/**
 * Clerk Mock for E2E Builds
 *
 * Drop-in replacement for `@clerk/react` that treats the user as
 * always-signed-in. Wired in via esbuild alias when the build is
 * started with VITE_E2E_BYPASS_AUTH=true.
 *
 * Scope: E2E tests assert behavior of this app, not Clerk's SaaS.
 * Auth is a precondition, not a scenario — so we satisfy it
 * statically and let tests exercise the actual product surface.
 *
 * Never active in production. esbuild.config.mjs throws if the bypass
 * flag is set with a production build environment.
 */

import React from 'react';

const E2E_USER = {
  id: 'e2e-test-user',
  fullName: 'E2E Test User',
  primaryEmailAddress: { emailAddress: 'e2e@test.local' },
  publicMetadata: { role: 'super_admin' } as Record<string, unknown>,
};

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Clerk's <Show when="signed-in"> / <Show when="signed-out"> gate.
// Always signed-in: render children for signed-in, skip signed-out.
export function Show({
  when,
  children,
}: {
  when: 'signed-in' | 'signed-out';
  children: React.ReactNode;
}) {
  return when === 'signed-in' ? <>{children}</> : null;
}

// The real <SignIn> renders Clerk's sign-in form. In a bypassed build
// the signed-out branch never renders, so this is unreachable — but
// typed exports need a real component.
export function SignIn(_props: Record<string, unknown>) {
  return null;
}

export function UserButton(_props: Record<string, unknown>) {
  return (
    <button
      type="button"
      aria-label="User menu (E2E stub)"
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold"
    >
      E2E
    </button>
  );
}

export function useAuth() {
  return {
    isSignedIn: true,
    isLoaded: true,
    userId: E2E_USER.id,
    signOut: () => Promise.resolve(),
    getToken: async (_opts?: unknown) => null,
  };
}

export function useUser() {
  return {
    isSignedIn: true,
    isLoaded: true,
    user: E2E_USER,
  };
}
