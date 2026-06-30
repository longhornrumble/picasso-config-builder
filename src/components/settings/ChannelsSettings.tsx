/**
 * ChannelsSettings Component
 * Manages Meta Messenger and Instagram DM channel integrations.
 *
 * OAuth flow uses a popup window so the user never leaves the config builder.
 * Toggle and disconnect actions POST to the backend (DynamoDB), not to S3.
 * The S3 config only ever holds display metadata (page_name, enabled, connected_at).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useConfigStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import type { ChannelConnection, ChannelsConfig } from '@/types/config';

// ---------------------------------------------------------------------------
// Brand icons
// ---------------------------------------------------------------------------
// lucide-react removed brand/trademark icons (incl. Facebook, Instagram) in
// v1.0, so the channel-card logos are rendered as inline SVG. `fill:currentColor`
// lets the existing brand-color text classes (e.g. text-[#1877F2]) tint them.

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// `import.meta.env` can be undefined under ESBuild's dev pipeline (unlike Vite's
// auto-injection), which crashed module load and blocked the whole app from
// rendering. Guard against it so the fallback URL is always reachable.
const CHANNELS_API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CHANNELS_API_URL) || 'https://qwxscz5w6lkzjmhcpyhewijize0jpzzx.lambda-url.us-east-1.on.aws';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// StatusBadge — inline connection status chip
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  connected: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ connected }) =>
  connected ? (
    <span
      role="status"
      aria-label="Connected"
      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      Connected
    </span>
  ) : (
    <span
      role="status"
      aria-label="Not connected"
      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    >
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      Not connected
    </span>
  );

// ---------------------------------------------------------------------------
// ToggleSwitch — accessible on/off toggle
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, disabled, onChange, label }) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 select-none">
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        checked
          ? 'bg-primary'
          : 'bg-gray-200 dark:bg-gray-700',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);

// ---------------------------------------------------------------------------
// ConnectedCard — shows page info, enable toggle, disconnect button
// ---------------------------------------------------------------------------

interface ConnectedCardProps {
  pageName: string;
  connectedAt: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onDisconnect: () => void;
  toggleLoading: boolean;
  disconnectLoading: boolean;
  toggleId: string;
}

const ConnectedCard: React.FC<ConnectedCardProps> = ({
  pageName,
  connectedAt,
  enabled,
  onToggle,
  onDisconnect,
  toggleLoading,
  disconnectLoading,
  toggleId,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pageName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Connected {formatDate(connectedAt)}
        </p>
      </div>
      <StatusBadge connected />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-4">
      {toggleLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Updating…
        </div>
      ) : (
        <ToggleSwitch
          id={toggleId}
          checked={enabled}
          onChange={onToggle}
          label={enabled ? 'Channel enabled' : 'Channel disabled'}
        />
      )}

      <Button
        variant="danger"
        size="sm"
        loading={disconnectLoading}
        onClick={onDisconnect}
        aria-label="Disconnect this channel"
      >
        Disconnect
      </Button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ChannelsSettings (main export)
// ---------------------------------------------------------------------------

/**
 * ChannelsSettings Component
 *
 * Manages Meta Messenger and Instagram DM channel integrations:
 * - Facebook Messenger: OAuth popup connect, enable/disable toggle, disconnect
 * - Instagram DMs: Coming Soon placeholder
 * - Channel Status: Summary of active connections
 *
 * @example
 * ```tsx
 * <ChannelsSettings />
 * ```
 */
export const ChannelsSettings: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const { getToken } = useAuth();

  const messengerConfig = baseConfig?.channels?.messenger;

  // Loading states
  const [connectLoading, setConnectLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to keep track of the OAuth popup window
  const popupRef = useRef<Window | null>(null);

  // -------------------------------------------------------------------------
  // Optimistically update channels config in the Zustand store
  // -------------------------------------------------------------------------

  const setChannelsConfig = useCallback((updater: (prev: ChannelsConfig | undefined) => ChannelsConfig | undefined) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        state.config.baseConfig.channels = updater(state.config.baseConfig.channels);
        state.config.isDirty = true;
      }
    });
  }, []);

  // -------------------------------------------------------------------------
  // OAuth popup flow
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'META_OAUTH_SUCCESS') return;
      const payload = event.data?.payload as ChannelConnection | undefined;
      if (!payload) return;

      // Update local store with the page data returned from OAuth
      setChannelsConfig((prev) => ({
        ...prev,
        messenger: payload,
      }));
      setConnectLoading(false);
      popupRef.current?.close();
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setChannelsConfig]);

  const handleConnect = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    setConnectLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(
        `${CHANNELS_API_URL}/meta/oauth/url?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to get OAuth URL (${res.status})`);
      }

      const { url } = await res.json() as { url: string };

      // Open OAuth in a centred popup
      const width = 600;
      const height = 700;
      const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
      const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
      popupRef.current = window.open(
        url,
        'meta_oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popupRef.current) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate connection.');
      setConnectLoading(false);
    }
  }, [tenantId, getToken]);

  // -------------------------------------------------------------------------
  // Toggle enabled/disabled
  // -------------------------------------------------------------------------

  const handleToggle = useCallback(
    async (enabled: boolean) => {
      if (!tenantId) return;
      setError(null);
      setToggleLoading(true);

      // Optimistic update
      setChannelsConfig((prev) => ({
        ...prev,
        messenger: prev?.messenger ? { ...prev.messenger, enabled } : undefined,
      }));

      try {
        const token = await getToken();
        const res = await fetch(`${CHANNELS_API_URL}/meta/channels/${encodeURIComponent(tenantId)}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ channel: 'messenger', enabled }),
        });

        if (!res.ok) {
          // Roll back on failure
          setChannelsConfig((prev) => ({
            ...prev,
            messenger: prev?.messenger ? { ...prev.messenger, enabled: !enabled } : undefined,
          }));
          throw new Error(`Toggle failed (${res.status})`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update channel status.');
      } finally {
        setToggleLoading(false);
      }
    },
    [tenantId, getToken, setChannelsConfig]
  );

  // -------------------------------------------------------------------------
  // Disconnect
  // -------------------------------------------------------------------------

  const handleDisconnect = useCallback(async () => {
    if (!tenantId) return;
    const confirmed = window.confirm(
      'Are you sure you want to disconnect this Facebook Page? Messages from Messenger will no longer be routed to Picasso.'
    );
    if (!confirmed) return;

    setError(null);
    setDisconnectLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(
        `${CHANNELS_API_URL}/meta/channels/${encodeURIComponent(tenantId)}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ channel: 'messenger' }),
        }
      );

      if (!res.ok) {
        throw new Error(`Disconnect failed (${res.status})`);
      }

      // Remove messenger from local store
      setChannelsConfig((prev) => {
        if (!prev) return prev;
        const { messenger: _removed, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect channel.');
    } finally {
      setDisconnectLoading(false);
    }
  }, [tenantId, getToken, setChannelsConfig]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const messengerConnected = Boolean(messengerConfig);
  const instagramConnected = Boolean(baseConfig?.channels?.instagram);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Global error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
          <button
            className="ml-auto shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Card 1: Facebook Messenger                                          */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FacebookIcon className="h-5 w-5 text-[#1877F2]" aria-hidden="true" />
            Facebook Messenger
          </CardTitle>
          <CardDescription>
            Route Messenger conversations from your Facebook Page directly into Picasso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messengerConnected && messengerConfig ? (
            <ConnectedCard
              pageName={messengerConfig.page_name}
              connectedAt={messengerConfig.connected_at}
              enabled={messengerConfig.enabled}
              onToggle={handleToggle}
              onDisconnect={handleDisconnect}
              toggleLoading={toggleLoading}
              disconnectLoading={disconnectLoading}
              toggleId="messenger-enabled-toggle"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect a Facebook Page to start receiving Messenger conversations in Picasso.
              </p>
              <Button
                variant="primary"
                size="sm"
                loading={connectLoading}
                onClick={handleConnect}
                disabled={!tenantId}
                aria-label="Connect a Facebook Page via Meta OAuth"
                leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
              >
                Connect Facebook Page
              </Button>
              {!tenantId && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Select a tenant first to connect a channel.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Card 2: Instagram DMs                                               */}
      {/* ------------------------------------------------------------------ */}
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InstagramIcon className="h-5 w-5 text-[#E1306C]" aria-hidden="true" />
            Instagram DMs
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            Route Instagram Direct Messages into Picasso (requires a connected Facebook Page).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-label="Instagram DMs — coming soon"
            aria-disabled="true"
          >
            Connect Instagram Account
          </Button>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Card 3: Channel Status                                              */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Status</CardTitle>
          <CardDescription>Connection health summary</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              <dt className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FacebookIcon className="h-4 w-4 text-[#1877F2]" aria-hidden="true" />
                Messenger
              </dt>
              <dd>
                <StatusBadge connected={messengerConnected} />
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              <dt className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <InstagramIcon className="h-4 w-4 text-[#E1306C]" aria-hidden="true" />
                Instagram DMs
              </dt>
              <dd>
                <StatusBadge connected={instagramConnected} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};
