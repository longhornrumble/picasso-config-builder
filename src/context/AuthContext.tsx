/**
 * Authentication Context
 * Provides user info from Clerk session for components that need it.
 * Role is read from Clerk publicMetadata — not hardcoded.
 * Clerk session token is exposed via getToken() for API calls.
 */

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';
import { configApiClient } from '@/lib/api/client';

interface User {
  email?: string;
  name?: string;
  role?: string;
  tenant_id?: string;
  tenant_hash?: string;
  company?: string;
  tenants?: string[];
  features?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut, getToken: clerkGetToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Read role from Clerk publicMetadata instead of hardcoding super_admin
  const role = (clerkUser?.publicMetadata as Record<string, unknown>)?.role as string | undefined;

  const user: User | null = isSignedIn && clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    name: clerkUser.fullName || undefined,
    role: role || 'member',
  } : null;

  const state: AuthState = {
    isAuthenticated: isSignedIn ?? false,
    user,
    token: null,
    loading: !isLoaded,
    error: null,
  };

  const logout = () => {
    signOut();
  };

  // Expose Clerk JWT with picasso-config template for API calls
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      return await clerkGetToken({ template: 'picasso-config' });
    } catch {
      return null;
    }
  }, [clerkGetToken]);

  // Wire Clerk token provider into the API client singleton
  useEffect(() => {
    configApiClient.setTokenProvider(getToken);
  }, [getToken]);

  return (
    <AuthContext.Provider value={{ ...state, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
