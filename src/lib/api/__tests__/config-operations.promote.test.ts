/**
 * Unit tests for the promoteConfig + getPromoteStatus wrappers: passthrough,
 * result return, and the empty-id guard on promote.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promoteConfig, getPromoteStatus } from '../config-operations';
import { configApiClient } from '../client';

vi.mock('../client', () => ({
  configApiClient: {
    promoteConfig: vi.fn(),
    getPromoteStatus: vi.fn(),
  },
}));

describe('config-operations promoteConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configApiClient.promoteConfig).mockResolvedValue({
      success: true,
      tenant_id: 'TEST_TENANT',
      message: 'Promotion started.',
      baseline: 99,
    } as Awaited<ReturnType<typeof configApiClient.promoteConfig>>);
  });

  it('passes the tenant id to the client and returns the dispatch result + baseline', async () => {
    const result = await promoteConfig('TEST_TENANT');

    expect(vi.mocked(configApiClient.promoteConfig)).toHaveBeenCalledWith('TEST_TENANT');
    expect(result.success).toBe(true);
    expect(result.tenant_id).toBe('TEST_TENANT');
    expect(result.baseline).toBe(99);
  });

  it('rejects an empty tenant id without calling the client', async () => {
    await expect(promoteConfig('')).rejects.toThrow();
    expect(configApiClient.promoteConfig).not.toHaveBeenCalled();
  });
});

describe('config-operations getPromoteStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configApiClient.getPromoteStatus).mockResolvedValue({
      found: true,
      status: 'completed',
      conclusion: 'success',
      run_url: 'u',
    } as Awaited<ReturnType<typeof configApiClient.getPromoteStatus>>);
  });

  it('passes tenant + baseline to the client and returns the run outcome', async () => {
    const result = await getPromoteStatus('TEST_TENANT', 99);

    expect(vi.mocked(configApiClient.getPromoteStatus)).toHaveBeenCalledWith('TEST_TENANT', 99);
    expect(result.found).toBe(true);
    expect(result.conclusion).toBe('success');
  });
});
