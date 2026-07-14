/**
 * metaWelcome — auto-push Messenger welcome surfaces to Meta after a deploy.
 *
 * Config Builder edits `messenger_behavior.welcome` (ice breakers + persistent
 * menu), but those only reach the live Facebook/Instagram profile via the
 * Messenger Profile API. Rather than make an operator run the M5 re-push script
 * by hand, the deploy flow calls `POST /meta/channels/{id}/repush-welcome` on
 * Meta_OAuth_Handler (which re-pushes using the stored Page token — the same
 * code path the OAuth callback uses).
 *
 * Best-effort: the deploy itself is the primary action and has already
 * succeeded by the time this runs — a push failure only warns, never throws.
 *
 * The endpoint is unauthenticated today (CORS *, no Clerk), so no token is
 * sent. If it is ever put behind auth, thread the Clerk token through here.
 */
import type { TenantConfig } from '@/types/config';

const CHANNELS_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CHANNELS_API_URL) || '';

/** True when the config has welcome surfaces AND a connected Messenger page worth pushing to. */
export function shouldRepushWelcome(config: TenantConfig): boolean {
  const welcome = config.messenger_behavior?.welcome;
  const hasSurfaces = Boolean(welcome?.ice_breakers?.length || welcome?.persistent_menu?.length);
  const connected = Boolean(config.channels?.messenger);
  return hasSurfaces && connected;
}

export type RepushOutcome =
  | { status: 'pushed'; detail: string }
  | { status: 'skipped'; detail: string }
  | { status: 'failed'; detail: string }
  | { status: 'not-configured' };

/**
 * Re-push welcome surfaces for a tenant. Never throws — returns a classified outcome:
 * - `pushed`  — Meta accepted the surfaces
 * - `skipped` — nothing to push (flag off / no surfaces), per the endpoint's best-effort result
 * - `failed`  — the call errored (network, 4xx/5xx); the caller should warn, not block
 * - `not-configured` — VITE_CHANNELS_API_URL is unset for this build (no auto-push wired)
 */
export async function repushWelcomeSurfaces(tenantId: string): Promise<RepushOutcome> {
  if (!CHANNELS_API_URL) return { status: 'not-configured' };
  try {
    const res = await fetch(
      `${CHANNELS_API_URL}/meta/channels/${encodeURIComponent(tenantId)}/repush-welcome`,
      { method: 'POST' }
    );
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      result?: { pushed?: { ice_breakers?: number; persistent_menu?: number }; skipped?: string };
    };
    if (!res.ok) return { status: 'failed', detail: body?.error || `HTTP ${res.status}` };

    const result = body?.result ?? {};
    if (result.pushed) {
      const p = result.pushed;
      return {
        status: 'pushed',
        detail: `${p.ice_breakers ?? 0} ice breakers, ${p.persistent_menu ?? 0} menu items`,
      };
    }
    if (result.skipped) return { status: 'skipped', detail: String(result.skipped) };
    return { status: 'skipped', detail: 'no changes to push' };
  } catch (e) {
    return { status: 'failed', detail: e instanceof Error ? e.message : 'network error' };
  }
}
