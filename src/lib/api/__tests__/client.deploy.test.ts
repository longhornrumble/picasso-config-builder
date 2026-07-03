/**
 * ConfigAPIClient.deployConfig tests.
 *
 * Pins the deploy request contract: If-Match propagation, merge/create_backup
 * body flags, 409 -> VERSION_CONFLICT (conflict-banner contract shared with
 * saveConfig), and ETag attach from the response header.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigAPIClient } from '../client';
import { ConfigAPIError } from '../errors';
import type { TenantConfig } from '@/types/config';

const BASE_URL = 'http://localhost:3001';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const sampleConfig = {
  tenant_id: 'TEST001',
  version: '1.0',
  programs: {},
  conversational_forms: {},
  cta_definitions: {},
  conversation_branches: {},
} as unknown as TenantConfig;

describe('ConfigAPIClient.deployConfig', () => {
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

  it('PUTs to /config/{id} with merge + create_backup and the If-Match header', async () => {
    fetchMock.mockImplementation(() => jsonResponse(200, { success: true }));

    await client.deployConfig('TEST001', sampleConfig, { ifMatch: 'W/"abc"' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/config/TEST001`);
    expect(init.method).toBe('PUT');
    expect(init.headers['If-Match']).toBe('W/"abc"');
    const body = JSON.parse(init.body);
    expect(body.merge).toBe(true);
    expect(body.create_backup).toBe(true);
    expect(body.config.tenant_id).toBe('TEST001');
  });

  it('omits the If-Match header when no etag is provided', async () => {
    fetchMock.mockImplementation(() => jsonResponse(200, { success: true }));

    await client.deployConfig('TEST001', sampleConfig);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['If-Match']).toBeUndefined();
  });

  it('maps a 409 to a VERSION_CONFLICT ConfigAPIError carrying the server details', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(409, { currentConfig: sampleConfig, currentETag: 'W/"server"' })
    );

    const err = await client
      .deployConfig('TEST001', sampleConfig, { ifMatch: 'W/"stale"' })
      .then(
        () => null,
        (e) => e
      );

    expect(err).toBeInstanceOf(ConfigAPIError);
    expect((err as ConfigAPIError).code).toBe('VERSION_CONFLICT');
    expect(
      ((err as ConfigAPIError).details as { currentETag?: string }).currentETag
    ).toBe('W/"server"');
  });

  it('attaches the ETag from the response header', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(200, { success: true }, { ETag: 'W/"fresh"' })
    );

    const result = await client.deployConfig('TEST001', sampleConfig);

    expect(result.etag).toBe('W/"fresh"');
  });

  it('rejects an empty tenant id without calling fetch', async () => {
    await expect(client.deployConfig('', sampleConfig)).rejects.toThrow(ConfigAPIError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
