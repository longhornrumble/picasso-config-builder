/**
 * ConfigAPIClient.saveConfig tests.
 *
 * Pins the save request contract: explicit merge=true + create_backup body
 * flags (so a server default change can't silently turn a save into a full
 * replace), If-Match propagation, 409 -> VERSION_CONFLICT, ETag attach, and —
 * the durability fix — NO auto-retry on a non-idempotent conditional write
 * (a retry with a stale If-Match would surface a false conflict for the
 * caller's own successful write).
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

describe('ConfigAPIClient.saveConfig', () => {
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

  it('PUTs with explicit merge=true + create_backup and the If-Match header', async () => {
    fetchMock.mockImplementation(() => jsonResponse(200, { success: true }));

    await client.saveConfig('TEST001', sampleConfig, { ifMatch: 'W/"abc"' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/config/TEST001`);
    expect(init.method).toBe('PUT');
    expect(init.headers['If-Match']).toBe('W/"abc"');
    const body = JSON.parse(init.body);
    // The merge-contract pin: without this, a server whose merge default flips
    // to false would treat a section-scoped save as a full-config replace.
    expect(body.merge).toBe(true);
    // snake_case create_backup — the server ignores the old camelCase key.
    expect(body.create_backup).toBe(true);
  });

  it('honors createBackup=false via the snake_case wire key', async () => {
    fetchMock.mockImplementation(() => jsonResponse(200, { success: true }));

    await client.saveConfig('TEST001', sampleConfig, { createBackup: false });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.create_backup).toBe(false);
    expect(body.merge).toBe(true);
  });

  it('does NOT auto-retry a conditional write (single attempt on a network error)', async () => {
    // A network error after the request is sent is ambiguous — the write may
    // have landed. Retrying with the same stale If-Match would produce a false
    // 409 for the caller's own successful write, so save must fail fast.
    fetchMock.mockRejectedValue(new TypeError('network down'));

    await expect(
      client.saveConfig('TEST001', sampleConfig, { ifMatch: 'W/"abc"' })
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a 409 to a VERSION_CONFLICT error carrying the server details', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(409, { currentConfig: sampleConfig, currentETag: 'W/"server"' })
    );

    const err = await client
      .saveConfig('TEST001', sampleConfig, { ifMatch: 'W/"stale"' })
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

    const result = await client.saveConfig('TEST001', sampleConfig);
    expect(result.etag).toBe('W/"fresh"');
  });

  it('rejects an empty tenant id without calling fetch', async () => {
    await expect(client.saveConfig('', sampleConfig)).rejects.toThrow(ConfigAPIError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
