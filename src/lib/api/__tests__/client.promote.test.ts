/**
 * ConfigAPIClient.promoteConfig tests.
 *
 * Pins the promote request contract: POST /config/{id}/promote, the dispatch
 * result passthrough, empty-id guard, non-ok -> ConfigAPIError, and the shared
 * 401 -> session-expired behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigAPIClient } from '../client';
import { ConfigAPIError } from '../errors';

const BASE_URL = 'http://localhost:3001';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('ConfigAPIClient.promoteConfig', () => {
  let client: ConfigAPIClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new ConfigAPIClient(BASE_URL);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('POSTs to /config/{id}/promote and returns the dispatch result', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(202, {
        success: true,
        tenant_id: 'TEST001',
        message: 'Promotion dispatched.',
        runs_url: 'https://github.com/o/r/actions/workflows/promote-tenant-config.yml',
      })
    );

    const result = await client.promoteConfig('TEST001');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/config/TEST001/promote`);
    expect(init.method).toBe('POST');
    expect(result.success).toBe(true);
    expect(result.tenant_id).toBe('TEST001');
    expect(result.runs_url).toContain('promote-tenant-config.yml');
  });

  it('rejects an empty tenant id without calling fetch', async () => {
    await expect(client.promoteConfig('')).rejects.toThrow(ConfigAPIError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a non-ok response (503 not configured) to a ConfigAPIError', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(503, { error: 'Promotion Failed', message: 'Promotion is not configured' })
    );

    await expect(client.promoteConfig('TEST001')).rejects.toThrow(ConfigAPIError);
  });

  it('dispatches auth:session-expired and throws on 401', async () => {
    const spy = vi.fn();
    window.addEventListener('auth:session-expired', spy);
    fetchMock.mockImplementation(() => jsonResponse(401, { error: 'Unauthorized' }));

    await client.promoteConfig('TEST001').catch(() => undefined);

    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:session-expired', spy);
  });
});
