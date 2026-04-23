/**
 * useSignInToken — Clerk ticket-strategy consumer tests
 *
 * Covers the state machine:
 *   - no token in URL → idle
 *   - already signed in → idle (token stripped if present)
 *   - token present + signed out + Clerk ready → consuming → success (URL cleaned)
 *   - token rejected by Clerk → error (URL preserved so user can fall back to
 *     manual sign-in with the deep-link intact)
 *   - incomplete sign-in attempt → error
 *   - Clerk not yet loaded → no action until loaded
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — @clerk/react. Each test configures the mocked return shape via setters.
// ---------------------------------------------------------------------------

interface SignInAttempt {
  status: 'complete' | 'needs_second_factor' | 'needs_first_factor' | string;
  createdSessionId?: string;
}

const mockCreate = vi.fn();
const mockSetActive = vi.fn();
const mockSignOut = vi.fn();

let signInState: {
  signIn: { create: typeof mockCreate } | null;
  setActive: typeof mockSetActive | null;
  isLoaded: boolean;
};

let userState: { isSignedIn: boolean; isLoaded: boolean };

vi.mock('@clerk/react', () => ({
  useUser: () => userState,
  useClerk: () => ({ signOut: mockSignOut }),
}));
vi.mock('@clerk/react/legacy', () => ({
  useSignIn: () => signInState,
}));

// Import AFTER mocks — vi.mock hoists, but we rely on the local closure values above.
import { useSignInToken } from '../useSignInToken';

function setUrl(pathAndQuery: string) {
  // JSDOM supports this pattern for testing window.location.
  window.history.replaceState(null, '', pathAndQuery);
}

beforeEach(() => {
  mockCreate.mockReset();
  mockSetActive.mockReset();
  mockSignOut.mockReset();
  signInState = {
    signIn: { create: mockCreate },
    setActive: mockSetActive,
    isLoaded: true,
  };
  userState = { isSignedIn: false, isLoaded: true };
  setUrl('/');
});

afterEach(() => {
  setUrl('/');
});

describe('useSignInToken', () => {
  it('no token in URL → state stays idle, no Clerk call', async () => {
    setUrl('/pending-changes?h=abc');
    const { result } = renderHook(() => useSignInToken());
    // Give effects time to run.
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.state).toBe('idle');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('already signed in → state stays idle; token IS stripped if present', async () => {
    userState = { isSignedIn: true, isLoaded: true };
    setUrl('/pending-changes?h=abc&token=SIGN_IN_TOKEN_XYZ');
    const { result } = renderHook(() => useSignInToken());
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.state).toBe('idle');
    expect(mockCreate).not.toHaveBeenCalled();
    // Token is gone; every other param preserved.
    expect(window.location.search).not.toContain('token=');
    expect(window.location.search).toContain('h=abc');
  });

  it('clerk not yet loaded → no action', async () => {
    signInState = { ...signInState, isLoaded: false };
    setUrl('/pending-changes?token=XYZ');
    const { result } = renderHook(() => useSignInToken());
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.state).toBe('idle');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('happy path: token present, signed out, Clerk ready → consuming → success; URL cleaned', async () => {
    setUrl('/pending-changes?h=abc&token=VALID_TOKEN');
    mockCreate.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'sess_123',
    } satisfies SignInAttempt);
    mockSetActive.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSignInToken());

    await waitFor(() => expect(result.current.state).toBe('success'), { timeout: 500 });

    expect(mockCreate).toHaveBeenCalledWith({ strategy: 'ticket', ticket: 'VALID_TOKEN' });
    expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_123' });
    // URL: token stripped, `h=abc` preserved.
    expect(window.location.search).not.toContain('token=');
    expect(window.location.search).toContain('h=abc');
  });

  it('token rejected by Clerk → error; URL preserved for manual-sign-in fallback', async () => {
    setUrl('/pending-changes?h=abc&token=EXPIRED_TOKEN');
    mockCreate.mockRejectedValueOnce(new Error('Token is expired'));

    const { result } = renderHook(() => useSignInToken());

    await waitFor(() => expect(result.current.state).toBe('error'), { timeout: 500 });

    expect(result.current.error).toMatch(/expired/i);
    // Crucially: token is still in the URL so the user's fallback (manual sign-in
    // via the sign-in gate) still has the full deep-link context. We don't strip
    // on failure.
    expect(window.location.search).toContain('token=EXPIRED_TOKEN');
    expect(window.location.search).toContain('h=abc');
  });

  it('incomplete sign-in attempt (needs second factor) → error', async () => {
    setUrl('/pending-changes?token=TOKEN_NEEDS_2FA');
    mockCreate.mockResolvedValueOnce({
      status: 'needs_second_factor',
      createdSessionId: undefined,
    } satisfies SignInAttempt);

    const { result } = renderHook(() => useSignInToken());

    await waitFor(() => expect(result.current.state).toBe('error'), { timeout: 500 });
    expect(result.current.error).toMatch(/incomplete/i);
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it('signIn client missing → error without network call', async () => {
    signInState = { signIn: null, setActive: null, isLoaded: true };
    setUrl('/pending-changes?token=XYZ');
    const { result } = renderHook(() => useSignInToken());
    await waitFor(() => expect(result.current.state).toBe('error'), { timeout: 500 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('state does not re-enter after reaching terminal state', async () => {
    setUrl('/pending-changes?token=REJECT');
    mockCreate.mockRejectedValueOnce(new Error('Invalid'));

    const { result, rerender } = renderHook(() => useSignInToken());
    await waitFor(() => expect(result.current.state).toBe('error'));

    // Re-render shouldn't trigger another Clerk call — state machine locked on first run.
    rerender();
    await new Promise((r) => setTimeout(r, 10));
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
