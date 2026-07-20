/**
 * Unit tests for deployConfig's version policy and If-Match passthrough.
 * The integration suite mocks this module wholesale, so the deploy-side
 * version bump (shared incrementVersion scheme with saveConfig) is pinned here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deployConfig } from '../config-operations';
import { configApiClient } from '../client';
import type { TenantConfig } from '@/types/config';

vi.mock('../client', () => ({
  configApiClient: {
    deployConfig: vi.fn(),
  },
}));

const makeConfig = (version: string): TenantConfig =>
  ({
    tenant_id: 'STALE_ID',
    version,
    programs: {},
    conversational_forms: {},
    cta_definitions: {},
    conversation_branches: {},
  } as unknown as TenantConfig);

describe('config-operations deployConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configApiClient.deployConfig).mockResolvedValue({
      etag: 'new-etag',
    } as Awaited<ReturnType<typeof configApiClient.deployConfig>>);
  });

  it('bumps the last version segment with the same scheme as save', async () => {
    await deployConfig('TEST_TENANT', makeConfig('1.3.0'));

    const [, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(sentConfig.version).toBe('1.3.1');
  });

  it('increments 1.9 -> 1.10 (segment increment, not float math)', async () => {
    await deployConfig('TEST_TENANT', makeConfig('1.9'));

    const [, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(sentConfig.version).toBe('1.10');
  });

  it('tolerates a numeric stored version (schema discipline — BRI071351 shipped version: 1)', async () => {
    // Regression: version.split on a number crashed every deploy with
    // "e.split is not a function".
    await deployConfig('TEST_TENANT', makeConfig(1 as unknown as string));

    const [, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(sentConfig.version).toBe('2');
  });

  it('tolerates a missing or unparseable version (falls back to 1.x)', async () => {
    await deployConfig('TEST_TENANT', makeConfig(undefined as unknown as string));
    let [, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(sentConfig.version).toBe('1.1');

    await deployConfig('TEST_TENANT', makeConfig('not-a-version'));
    [, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[1];
    expect(sentConfig.version).toBe('1.0');
  });

  it('forces tenant_id to the request tenant and stamps generated_at', async () => {
    await deployConfig('TEST_TENANT', makeConfig('2.0'));

    const [tenantArg, sentConfig] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(tenantArg).toBe('TEST_TENANT');
    expect(sentConfig.tenant_id).toBe('TEST_TENANT');
    expect(typeof sentConfig.generated_at).toBe('number');
  });

  it('passes ifMatch through to the client and returns the new etag', async () => {
    const result = await deployConfig('TEST_TENANT', makeConfig('1.0'), {
      ifMatch: 'W/"abc123"',
    });

    const [, , optsArg] = vi.mocked(configApiClient.deployConfig).mock.calls[0];
    expect(optsArg).toEqual({ ifMatch: 'W/"abc123"' });
    expect(result.etag).toBe('new-etag');
  });

  it('rejects an empty tenant id without calling the client', async () => {
    await expect(deployConfig('', makeConfig('1.0'))).rejects.toThrow();
    expect(configApiClient.deployConfig).not.toHaveBeenCalled();
  });
});
