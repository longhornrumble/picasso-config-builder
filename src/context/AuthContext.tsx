/**
 * Authentication Context
 * Provides user info from Clerk session for components that need it
 */

import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const user: User | null = isSignedIn && clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    name: clerkUser.fullName || undefined,
    role: 'super_admin',
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

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
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
