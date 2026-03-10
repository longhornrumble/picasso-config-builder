/**
 * Authentication Context
 * Handles Bubble SSO integration and token management for Config Builder
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

// Bubble SSO configuration
const BUBBLE_AUTH_URL = import.meta.env.VITE_BUBBLE_AUTH_URL || '';
const TOKEN_KEY = 'config_builder_token';
const USER_KEY = 'config_builder_user';

/**
 * Decode JWT payload (without verification - verification happens on backend)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Extract user from JWT token
 */
function extractUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return {
    tenant_id: (payload.tenant_id as string) || (payload.sub as string) || '',
    tenant_hash: (payload.tenant_hash as string) || '',
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    role: payload.role as string | undefined,
    company: payload.company as string | undefined,
    tenants: (payload.tenants as string[]) || [],
    features: (payload.features as string[]) || [],
  };
}

// TODO: Remove this bypass once Bubble SSO workflow is built
const AUTH_BYPASS = true;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Initialize auth state from storage
  useEffect(() => {
    // Auth bypass — skip login until Bubble SSO is configured
    if (AUTH_BYPASS) {
      setState({
        isAuthenticated: true,
        user: { email: 'admin@myrecruiter.ai', name: 'Admin', role: 'super_admin' },
        token: null,
        loading: false,
        error: null,
      });
      return;
    }

    const initAuth = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && !isTokenExpired(storedToken)) {
        const user = storedUser ? JSON.parse(storedUser) : extractUserFromToken(storedToken);
        setState({
          isAuthenticated: true,
          user,
          token: storedToken,
          loading: false,
          error: null,
        });
      } else {
        // Clear expired token
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null,
        });
      }
    };

    // Check for token in URL (Bubble SSO callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      // Clear token from URL
      window.history.replaceState({}, '', window.location.pathname);

      if (!isTokenExpired(tokenFromUrl)) {
        const user = extractUserFromToken(tokenFromUrl);
        localStorage.setItem(TOKEN_KEY, tokenFromUrl);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

        setState({
          isAuthenticated: true,
          user,
          token: tokenFromUrl,
          loading: false,
          error: null,
        });
        return;
      } else {
        // Token in URL was expired
        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: 'Token expired. Please sign in again.',
        });
        return;
      }
    }

    initAuth();
  }, []);

  // Listen for session expiration from API client
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });

    // Redirect to Bubble login if configured
    if (BUBBLE_AUTH_URL) {
      window.location.href = BUBBLE_AUTH_URL;
    }
  }, []);

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
