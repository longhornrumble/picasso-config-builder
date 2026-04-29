/**
 * ConfigAPIClient draft method tests.
 *
 * Covers loadDraft / saveDraft / deleteDraft — the three methods that
 * back the draft auto-save feature.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigAPIClient } from '../client';
import { ConfigAPIError } from '../errors';
import type { TenantConfig } from '@/types/config';

const BASE_URL = 'http://localhost:3001';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

describe('ConfigAPIClient draft methods', () => {
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

  // -------------------------------------------------------------------------
  // loadDraft
  // -------------------------------------------------------------------------

  describe('loadDraft', () => {
    it('returns hasDraft + config + lastSaved on success', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, {
          hasDraft: true,
          config: sampleConfig,
          lastSaved: '2026-04-29T12:00:00.000Z',
        })
      );

      const result = await client.loadDraft('TEST001');

      expect(result.hasDraft).toBe(true);
      expect(result.config).toEqual(sampleConfig);
      expect(result.lastSaved).toBe('2026-04-29T12:00:00.000Z');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/draft/TEST001`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('returns hasDraft: false when server reports no draft', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { hasDraft: false }));
      const result = await client.loadDraft('TEST001');
      expect(result).toEqual({ hasDraft: false, config: undefined, lastSaved: undefined });
    });

    it('rejects when tenantId is empty', async () => {
      await expect(client.loadDraft('')).rejects.toThrow(ConfigAPIError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('dispatches session-expired event on 401', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

      await expect(client.loadDraft('TEST001')).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' })
      );
      dispatchSpy.mockRestore();
    });

    it('throws on non-2xx', async () => {
      fetchMock.mockResolvedValue(jsonResponse(500, { error: 'oops' }));
      await expect(client.loadDraft('TEST001')).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // saveDraft
  // -------------------------------------------------------------------------

  describe('saveDraft', () => {
    it('POSTs config and returns lastSaved', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, { success: true, lastSaved: '2026-04-29T12:30:00.000Z' })
      );

      const result = await client.saveDraft('TEST001', sampleConfig);

      expect(result.lastSaved).toBe('2026-04-29T12:30:00.000Z');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/draft/TEST001`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ config: sampleConfig });
    });

    it('rejects when tenantId is empty', async () => {
      await expect(client.saveDraft('', sampleConfig)).rejects.toThrow(ConfigAPIError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects when config is null', async () => {
      await expect(
        client.saveDraft('TEST001', null as unknown as TenantConfig)
      ).rejects.toThrow(ConfigAPIError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('dispatches session-expired event on 401', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

      await expect(client.saveDraft('TEST001', sampleConfig)).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' })
      );
      dispatchSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // deleteDraft
  // -------------------------------------------------------------------------

  describe('deleteDraft', () => {
    it('sends DELETE and resolves on 200', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));
      await expect(client.deleteDraft('TEST001')).resolves.toBeUndefined();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/draft/TEST001`);
      expect(init.method).toBe('DELETE');
    });

    it('rejects when tenantId is empty', async () => {
      await expect(client.deleteDraft('')).rejects.toThrow(ConfigAPIError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws on non-2xx', async () => {
      fetchMock.mockResolvedValue(jsonResponse(500, { error: 'oops' }));
      await expect(client.deleteDraft('TEST001')).rejects.toThrow();
    });

    it('dispatches session-expired event on 401', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

      await expect(client.deleteDraft('TEST001')).rejects.toThrow();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' })
      );
      dispatchSpy.mockRestore();
    });
  });
});
