/**
 * metaWelcome — auto-push welcome surfaces after deploy.
 *
 * VITE_CHANNELS_API_URL is stubbed to a test URL in src/test/setup.ts, so the
 * module-level const resolves configured here (the not-configured branch is
 * covered separately via resetModules + stubEnv('')).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TenantConfig } from '@/types/config';
import { shouldRepushWelcome, repushWelcomeSurfaces } from '../metaWelcome';

const connectedMessenger = {
  page_id: '1',
  page_name: 'Acme',
  enabled: true,
  connected_at: '2026-07-13',
  connected_by: 'x',
};

function cfg(overrides: Record<string, unknown>): TenantConfig {
  return overrides as unknown as TenantConfig;
}

describe('shouldRepushWelcome', () => {
  it('true only when welcome surfaces exist AND a messenger page is connected', () => {
    expect(
      shouldRepushWelcome(
        cfg({
          channels: { messenger: connectedMessenger },
          messenger_behavior: { welcome: { ice_breakers: [{ question: 'q', payload: 'PIC1:x' }] } },
        })
      )
    ).toBe(true);
  });

  it('false when surfaces exist but no page connected', () => {
    expect(
      shouldRepushWelcome(
        cfg({ messenger_behavior: { welcome: { ice_breakers: [{ question: 'q', payload: 'p' }] } } })
      )
    ).toBe(false);
  });

  it('false when connected but no welcome surfaces', () => {
    expect(shouldRepushWelcome(cfg({ channels: { messenger: connectedMessenger } }))).toBe(false);
    expect(
      shouldRepushWelcome(
        cfg({ channels: { messenger: connectedMessenger }, messenger_behavior: { welcome: {} } })
      )
    ).toBe(false);
  });

  it('true via persistent_menu alone', () => {
    expect(
      shouldRepushWelcome(
        cfg({
          channels: { messenger: connectedMessenger },
          messenger_behavior: { welcome: { persistent_menu: [{ title: 'Home', url: 'https://x' }] } },
        })
      )
    ).toBe(true);
  });
});

describe('repushWelcomeSurfaces', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });
  afterEach(() => vi.unstubAllEnvs());

  it('classifies a pushed result and calls the repush endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { pushed: { ice_breakers: 3, persistent_menu: 2 } } }),
    });
    const outcome = await repushWelcomeSurfaces('TENANT_1');
    expect(outcome).toEqual({ status: 'pushed', detail: '3 ice breakers, 2 menu items' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/meta/channels/TENANT_1/repush-welcome'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('passes through a best-effort skip (flag off / nothing to push)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { skipped: 'MESSENGER_CHANNEL flag not enabled' } }),
    });
    expect(await repushWelcomeSurfaces('T')).toEqual({
      status: 'skipped',
      detail: 'MESSENGER_CHANNEL flag not enabled',
    });
  });

  it('returns failed on a non-2xx (never throws)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'No messenger channel connected for this tenant' }) });
    expect(await repushWelcomeSurfaces('T')).toEqual({
      status: 'failed',
      detail: 'No messenger channel connected for this tenant',
    });
  });

  it('returns failed on a network error (never throws)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    expect(await repushWelcomeSurfaces('T')).toEqual({ status: 'failed', detail: 'network down' });
  });
});

describe('repushWelcomeSurfaces — not configured', () => {
  it('returns not-configured and does NOT fetch when VITE_CHANNELS_API_URL is unset', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_CHANNELS_API_URL', '');
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    const { repushWelcomeSurfaces: fn } = await import('../metaWelcome');
    expect(await fn('T')).toEqual({ status: 'not-configured' });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
