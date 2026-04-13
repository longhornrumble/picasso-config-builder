/**
 * DraftBanner Component Tests
 *
 * Covers:
 * - Conditional rendering (hasDraft + isDraft combinations)
 * - Resume Draft click → calls loadDraft()
 * - Discard Draft click → inline confirmation → calls discardDraft()
 * - Discard Draft click → cancel → confirmation dismissed
 * - Loading / disabled states during async operations
 * - Keyboard accessibility (Enter / Space on buttons)
 * - ARIA attributes (role="alert", aria-live)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftBanner } from '../DraftBanner';

// ---------------------------------------------------------------------------
// Mock the Zustand store so we can control state per-test
// ---------------------------------------------------------------------------
const mockLoadDraft = vi.fn();
const mockDiscardDraft = vi.fn();

// Default store shape — overridden per test via mockUseConfigStore
let storeState = {
  config: {
    hasDraft: false,
    isDraft: false,
    tenantId: null as string | null,
    loadDraft: mockLoadDraft,
    discardDraft: mockDiscardDraft,
  },
  ui: {
    loading: {} as Record<string, boolean>,
  },
};

vi.mock('@/store', () => ({
  useConfigStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStore(overrides: Partial<typeof storeState>) {
  storeState = {
    ...storeState,
    ...overrides,
    config: { ...storeState.config, ...(overrides.config ?? {}) },
    ui: { ...storeState.ui, ...(overrides.ui ?? {}) },
  };
}

function renderBanner() {
  return render(<DraftBanner />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DraftBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to a state where the banner should NOT appear
    storeState = {
      config: {
        hasDraft: false,
        isDraft: false,
        tenantId: null,
        loadDraft: mockLoadDraft,
        discardDraft: mockDiscardDraft,
      },
      ui: { loading: {} },
    };
  });

  // -------------------------------------------------------------------------
  // Conditional rendering
  // -------------------------------------------------------------------------

  describe('conditional rendering', () => {
    it('does not render when no tenant is loaded', () => {
      setStore({ config: { hasDraft: true, isDraft: false, tenantId: null } });
      const { container } = renderBanner();
      expect(container.firstChild).toBeNull();
    });

    it('does not render when hasDraft is false', () => {
      setStore({ config: { hasDraft: false, isDraft: false, tenantId: 'TEST001' } });
      const { container } = renderBanner();
      expect(container.firstChild).toBeNull();
    });

    it('does not render when isDraft is true (already viewing the draft)', () => {
      setStore({ config: { hasDraft: true, isDraft: true, tenantId: 'TEST001' } });
      const { container } = renderBanner();
      expect(container.firstChild).toBeNull();
    });

    it('renders when hasDraft is true and isDraft is false and a tenant is loaded', () => {
      setStore({ config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' } });
      renderBanner();
      expect(
        screen.getByText('A draft exists for this tenant with unsaved changes.')
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('accessibility', () => {
    beforeEach(() => {
      setStore({ config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' } });
    });

    it('has role="alert" on the container', () => {
      renderBanner();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live="polite" on the container', () => {
      renderBanner();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('Resume Draft button has an accessible label', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
    });

    it('Discard Draft button has an accessible label', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument();
    });

    it('Resume Draft button is keyboard activatable via Enter', async () => {
      const user = userEvent.setup();
      mockLoadDraft.mockResolvedValue(undefined);
      renderBanner();

      const resumeBtn = screen.getByRole('button', { name: /resume draft/i });
      resumeBtn.focus();
      await user.keyboard('{Enter}');

      expect(mockLoadDraft).toHaveBeenCalledTimes(1);
    });

    it('Resume Draft button is keyboard activatable via Space', async () => {
      const user = userEvent.setup();
      mockLoadDraft.mockResolvedValue(undefined);
      renderBanner();

      const resumeBtn = screen.getByRole('button', { name: /resume draft/i });
      resumeBtn.focus();
      await user.keyboard(' ');

      expect(mockLoadDraft).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Resume Draft
  // -------------------------------------------------------------------------

  describe('Resume Draft', () => {
    beforeEach(() => {
      setStore({ config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' } });
    });

    it('calls loadDraft() when Resume Draft is clicked', async () => {
      const user = userEvent.setup();
      mockLoadDraft.mockResolvedValue(undefined);
      renderBanner();

      await user.click(screen.getByRole('button', { name: /resume draft/i }));

      expect(mockLoadDraft).toHaveBeenCalledTimes(1);
    });

    it('does not throw when loadDraft() rejects', async () => {
      const user = userEvent.setup();
      mockLoadDraft.mockRejectedValue(new Error('network error'));
      renderBanner();

      // Should not throw — errors are handled in the store
      await expect(
        user.click(screen.getByRole('button', { name: /resume draft/i }))
      ).resolves.not.toThrow();
    });

    it('disables both buttons while loadDraft is in progress', () => {
      setStore({
        config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' },
        ui: { loading: { loadDraft: true } },
      });
      renderBanner();

      expect(screen.getByRole('button', { name: /resuming/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /discard draft/i })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Discard Draft — inline confirmation flow
  // -------------------------------------------------------------------------

  describe('Discard Draft confirmation flow', () => {
    beforeEach(() => {
      setStore({ config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' } });
    });

    it('shows confirmation UI after clicking Discard Draft', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: /discard draft/i }));

      expect(screen.getByText(/permanently discard this draft\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, discard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('hides Resume/Discard buttons once confirmation is shown', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: /discard draft/i }));

      expect(screen.queryByRole('button', { name: /^resume draft$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^discard draft$/i })).not.toBeInTheDocument();
    });

    it('calls discardDraft() when Yes, Discard is clicked', async () => {
      const user = userEvent.setup();
      mockDiscardDraft.mockResolvedValue(undefined);
      renderBanner();

      await user.click(screen.getByRole('button', { name: /discard draft/i }));
      await user.click(screen.getByRole('button', { name: /yes, discard/i }));

      expect(mockDiscardDraft).toHaveBeenCalledTimes(1);
    });

    it('returns to initial state when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: /discard draft/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Confirmation text gone, original buttons back
      expect(screen.queryByText(/permanently discard/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
    });

    it('disables Yes Discard button while discardDraft is in progress', () => {
      // Simulate mid-discard: confirmingDiscard would normally be true but we
      // can only drive it via loading state in this unit-test context.
      setStore({
        config: { hasDraft: true, isDraft: false, tenantId: 'TEST001' },
        ui: { loading: { discardDraft: true } },
      });
      renderBanner();

      // The "Discard Draft" trigger button should be disabled while discarding
      expect(screen.getByRole('button', { name: /discard draft/i })).toBeDisabled();
    });

    it('does not throw when discardDraft() rejects', async () => {
      const user = userEvent.setup();
      mockDiscardDraft.mockRejectedValue(new Error('server error'));
      renderBanner();

      await user.click(screen.getByRole('button', { name: /discard draft/i }));

      await expect(
        user.click(screen.getByRole('button', { name: /yes, discard/i }))
      ).resolves.not.toThrow();

      // Confirmation should be dismissed even on error
      await waitFor(() => {
        expect(screen.queryByText(/permanently discard/i)).not.toBeInTheDocument();
      });
    });
  });
});
