/**
 * Unit tests for the promoteConfig wrapper: tenant passthrough, result return,
 * and the empty-id guard (client not called).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promoteConfig } from '../config-operations';
import { configApiClient } from '../client';

vi.mock('../client', () => ({
  configApiClient: {
    promoteConfig: vi.fn(),
  },
}));

describe('config-operations promoteConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configApiClient.promoteConfig).mockResolvedValue({
      success: true,
      tenant_id: 'TEST_TENANT',
      message: 'Promotion dispatched.',
      runs_url: 'https://github.com/o/r/actions/workflows/promote-tenant-config.yml',
    } as Awaited<ReturnType<typeof configApiClient.promoteConfig>>);
  });

  it('passes the tenant id to the client and returns the dispatch result', async () => {
    const result = await promoteConfig('TEST_TENANT');

    expect(vi.mocked(configApiClient.promoteConfig)).toHaveBeenCalledWith('TEST_TENANT');
    expect(result.success).toBe(true);
    expect(result.tenant_id).toBe('TEST_TENANT');
    expect(result.runs_url).toContain('promote-tenant-config.yml');
  });

  it('rejects an empty tenant id without calling the client', async () => {
    await expect(promoteConfig('')).rejects.toThrow();
    expect(configApiClient.promoteConfig).not.toHaveBeenCalled();
  });
});
