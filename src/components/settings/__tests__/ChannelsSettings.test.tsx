/**
 * ChannelsSettings Component Tests
 *
 * Covers:
 * - Disconnected state (Connect button visible)
 * - Connected state (page info, toggle, disconnect)
 * - OAuth popup launch and postMessage handling
 * - Toggle optimistic update and rollback on failure
 * - Disconnect confirmation and API call
 * - Accessibility: ARIA roles, keyboard navigation, focus management
 * - Channel Status summary card
 * - No tenant selected guard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mock: useConfigStore
// ---------------------------------------------------------------------------

const mockSetState = vi.fn();
const mockBaseConfig: Record<string, unknown> = {};
let mockTenantId: string | null = 'TENANT123';

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      config: {
        tenantId: mockTenantId,
        baseConfig: mockBaseConfig,
        isDirty: false,
      },
    })
  ),
}));

// ---------------------------------------------------------------------------
// Mock: useAuth
// ---------------------------------------------------------------------------

const mockGetToken = vi.fn().mockResolvedValue('mock-jwt-token');

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

// ---------------------------------------------------------------------------
// Mock: global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Mock: window.open (popup)
// ---------------------------------------------------------------------------

const mockPopup = { close: vi.fn() };
const mockWindowOpen = vi.fn().mockReturnValue(mockPopup);
Object.defineProperty(window, 'open', { writable: true, value: mockWindowOpen });

// ---------------------------------------------------------------------------
// Mock: window.confirm — re-stubbed in beforeEach to survive
// vi.restoreAllMocks() between tests.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Patch useConfigStore.setState so store mutations are captured
import { useConfigStore } from '@/store';

function setupStore(channels?: Record<string, unknown>) {
  // Reset baseConfig for each test
  Object.keys(mockBaseConfig).forEach((k) => delete (mockBaseConfig as Record<string, unknown>)[k]);
  if (channels) {
    (mockBaseConfig as Record<string, unknown>).channels = channels;
  }
  // Wire setState
  (useConfigStore as unknown as { setState: typeof mockSetState }).setState = mockSetState;
}

// ---------------------------------------------------------------------------
// Import component under test (after mocks are declared)
// ---------------------------------------------------------------------------

import { ChannelsSettings } from '../ChannelsSettings';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChannelsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantId = 'TENANT123';
    setupStore();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    mockWindowOpen.mockReturnValue(mockPopup);
    // (Re-)stub window.confirm every test. A module-level stub gets reset
    // by afterEach's restoreAllMocks() and leaves confirm returning undefined
    // (falsy), which silently aborts handleDisconnect in subsequent tests.
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering — disconnected state
  // -------------------------------------------------------------------------

  describe('disconnected state', () => {
    it('renders the Facebook Messenger card heading', () => {
      render(<ChannelsSettings />);
      expect(screen.getByText('Facebook Messenger')).toBeInTheDocument();
    });

    it('renders a "Connect Facebook Page" button when not connected', () => {
      render(<ChannelsSettings />);
      expect(
        screen.getByRole('button', { name: /connect a facebook page/i })
      ).toBeInTheDocument();
    });

    it('does NOT render toggle or disconnect when not connected', () => {
      render(<ChannelsSettings />);
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /disconnect/i })
      ).not.toBeInTheDocument();
    });

    it('shows Instagram card as Coming Soon', () => {
      render(<ChannelsSettings />);
      // "Instagram DMs" now appears twice (card title + channel-status row),
      // so use getAllByText and assert at least one instance is present.
      expect(screen.getAllByText('Instagram DMs').length).toBeGreaterThan(0);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('disables Connect button when no tenant is selected', () => {
      mockTenantId = null;
      render(<ChannelsSettings />);
      expect(
        screen.getByRole('button', { name: /connect a facebook page/i })
      ).toBeDisabled();
    });

    it('shows a "select a tenant first" hint when tenant is null', () => {
      mockTenantId = null;
      render(<ChannelsSettings />);
      expect(
        screen.getByText(/select a tenant first/i)
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Channel Status card
  // -------------------------------------------------------------------------

  describe('Channel Status card', () => {
    it('shows Messenger as "Not connected" when no config', () => {
      render(<ChannelsSettings />);
      // The Channel Status card contains a Messenger row with a "Not
      // connected" status badge. With no messenger config, the Facebook
      // Messenger card ALSO shows "Not connected" somewhere (not currently,
      // but the channel-status card is enough to assert the disconnected
      // state). Count status badges with that name.
      const statusBadges = screen.getAllByRole('status', { name: /not connected/i });
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('shows Messenger as "Connected" when config present', () => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'My Page',
          enabled: true,
          connected_at: '2024-01-15T10:00:00Z',
          connected_by: 'admin@example.com',
        },
      });
      render(<ChannelsSettings />);
      // The connected badge in the top card
      const badges = screen.getAllByRole('status', { name: /connected/i });
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // Rendering — connected state
  // -------------------------------------------------------------------------

  describe('connected state', () => {
    beforeEach(() => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'Acme Recruiting Page',
          enabled: true,
          connected_at: '2024-06-01T08:00:00Z',
          connected_by: 'admin@example.com',
        },
      });
    });

    it('renders the page name', () => {
      render(<ChannelsSettings />);
      expect(screen.getByText('Acme Recruiting Page')).toBeInTheDocument();
    });

    it('renders an enabled toggle switch', () => {
      render(<ChannelsSettings />);
      const toggle = screen.getByRole('switch', { name: /channel enabled/i });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('renders a Disconnect button', () => {
      render(<ChannelsSettings />);
      expect(
        screen.getByRole('button', { name: /disconnect this channel/i })
      ).toBeInTheDocument();
    });

    it('does NOT render "Connect Facebook Page" when already connected', () => {
      render(<ChannelsSettings />);
      expect(
        screen.queryByRole('button', { name: /connect a facebook page/i })
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // OAuth popup flow
  // -------------------------------------------------------------------------

  describe('OAuth popup', () => {
    it('fetches OAuth URL and opens a popup on connect click', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://facebook.com/oauth/test' }),
      });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /connect a facebook page/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/meta/oauth/url?tenant_id=TENANT123'),
          expect.any(Object)
        );
      });
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://facebook.com/oauth/test',
        'meta_oauth',
        expect.stringContaining('width=600')
      );
    });

    it('shows an error when the OAuth URL fetch fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /connect a facebook page/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('updates store state when META_OAUTH_SUCCESS postMessage is received', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://facebook.com/oauth/test' }),
      });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /connect a facebook page/i }));

      // Simulate the OAuth callback postMessage
      const payload = {
        page_id: '222',
        page_name: 'New Page',
        enabled: true,
        connected_at: '2024-07-01T00:00:00Z',
        connected_by: 'user@example.com',
      };
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'META_OAUTH_SUCCESS', payload } })
      );

      await waitFor(() => {
        expect(mockSetState).toHaveBeenCalled();
      });
    });

    it('ignores postMessage events with wrong type', async () => {
      render(<ChannelsSettings />);
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'SOME_OTHER_EVENT', payload: {} } })
      );
      // setState should not be called for unrelated messages
      expect(mockSetState).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Toggle
  // -------------------------------------------------------------------------

  describe('enable/disable toggle', () => {
    beforeEach(() => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'Acme Page',
          enabled: true,
          connected_at: '2024-06-01T08:00:00Z',
          connected_by: 'admin@example.com',
        },
      });
    });

    it('calls the toggle API when the switch is clicked', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<ChannelsSettings />);
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/meta/channels/TENANT123/toggle'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('makes an optimistic store update before the API resolves', async () => {
      const user = userEvent.setup();
      // Never resolve so we can inspect the optimistic call
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('switch'));

      expect(mockSetState).toHaveBeenCalled();
    });

    it('shows an error and rolls back on toggle API failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      // Rollback means setState was called at least twice
      expect(mockSetState.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // Disconnect
  // -------------------------------------------------------------------------

  describe('disconnect flow', () => {
    beforeEach(() => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'Acme Page',
          enabled: true,
          connected_at: '2024-06-01T08:00:00Z',
          connected_by: 'admin@example.com',
        },
      });
    });

    it('calls the disconnect API after confirmation', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /disconnect this channel/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/meta/channels/TENANT123/disconnect'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('does NOT call the API when the user cancels the confirmation', async () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
      const user = userEvent.setup();

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /disconnect this channel/i }));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('shows an error when disconnect fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /disconnect this channel/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error dismissal
  // -------------------------------------------------------------------------

  describe('error banner', () => {
    it('can be dismissed by clicking the close button', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(<ChannelsSettings />);
      await user.click(screen.getByRole('button', { name: /connect a facebook page/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /dismiss error/i }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('accessibility', () => {
    it('toggle has correct ARIA switch role and aria-checked attribute', () => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'Page',
          enabled: false,
          connected_at: '2024-01-01T00:00:00Z',
          connected_by: 'u@example.com',
        },
      });
      render(<ChannelsSettings />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('toggle receives focus and responds to Space key', async () => {
      setupStore({
        messenger: {
          page_id: '111',
          page_name: 'Page',
          enabled: true,
          connected_at: '2024-01-01T00:00:00Z',
          connected_by: 'u@example.com',
        },
      });
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<ChannelsSettings />);
      const toggle = screen.getByRole('switch');
      toggle.focus();
      await user.keyboard(' ');

      expect(mockSetState).toHaveBeenCalled();
    });

    it('status badges have descriptive aria-labels', () => {
      render(<ChannelsSettings />);
      expect(screen.getAllByRole('status', { name: /not connected/i }).length).toBeGreaterThan(0);
    });

    it('icons are hidden from assistive technology with aria-hidden', () => {
      render(<ChannelsSettings />);
      // All decorative SVG icons should be aria-hidden
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('Instagram Coming Soon button is aria-disabled', () => {
      render(<ChannelsSettings />);
      const instagramBtn = screen.getByRole('button', { name: /instagram.*coming soon/i });
      expect(instagramBtn).toBeDisabled();
    });

    it('Connect button is keyboard accessible via Enter key', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://facebook.com/oauth/test' }),
      });

      render(<ChannelsSettings />);
      const connectBtn = screen.getByRole('button', { name: /connect a facebook page/i });
      connectBtn.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
});
