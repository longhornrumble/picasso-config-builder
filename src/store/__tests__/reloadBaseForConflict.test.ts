/**
 * Durability contract: ConflictBanner's "Reload latest" must refresh the base
 * config + ETag WITHOUT discarding the operator's unsaved domain-slice edits.
 *
 * Regression for the banner that promised "your unsaved edits stay in the
 * editor" while its handler called loadConfig(), which replaced every domain
 * slice and cleared isDirty — silently wiping the edits at the exact moment
 * (409 recovery) when data loss is least acceptable.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConfigStore } from '@/store';
import * as configOps from '@/lib/api/config-operations';
import type { TenantConfig } from '@/types/config';
import type { LoadConfigResponse } from '@/types/api';

vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
}));

function makeConfig(over: Partial<TenantConfig> = {}): TenantConfig {
  return {
    tenant_id: 'TEST001',
    tenant_hash: 'hash',
    version: '1.0',
    chat_title: 'Old title',
    tone_prompt: 't',
    welcome_message: 'w',
    generated_at: 1,
    programs: {},
    conversational_forms: {},
    cta_definitions: {},
    conversation_branches: {},
    content_showcase: [],
    branding: { primary_color: '#000000' },
    ...over,
  } as unknown as TenantConfig;
}

describe('config.reloadBaseForConflict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState((state) => {
      state.config.tenantId = 'TEST001';
      state.config.baseConfig = makeConfig({ chat_title: 'Old title' });
      state.config.etag = 'W/"stale"';
      state.config.isDirty = true;
      state.config.conflictState = { currentConfig: null, currentETag: 'W/"server"' };
      // Operator's unsaved edit lives in a domain slice.
      state.programs.programs = { p1: { program_id: 'p1', name: 'MY UNSAVED EDIT' } } as never;
      state.ui.toasts = [];
      state.ui.loading = {};
    });
  });

  it('preserves domain-slice edits while adopting the server base + fresh ETag', async () => {
    vi.mocked(configOps.loadConfig).mockResolvedValue({
      config: makeConfig({ chat_title: 'Server latest title' }),
      metadata: { lastModified: 999 },
      etag: 'W/"server"',
    } as unknown as LoadConfigResponse);

    await useConfigStore.getState().config.reloadBaseForConflict();

    const s = useConfigStore.getState();
    // The operator's unsaved edit survives — this is the core regression.
    expect(s.programs.programs.p1.name).toBe('MY UNSAVED EDIT');
    // Base + ETag refreshed to the server's latest so the next save's If-Match matches.
    expect(s.config.baseConfig?.chat_title).toBe('Server latest title');
    expect(s.config.etag).toBe('W/"server"');
    // Conflict cleared, but edits are still unsaved.
    expect(s.config.conflictState).toBeNull();
    expect(s.config.isDirty).toBe(true);
  });

  it('is a no-op when no tenant is loaded', async () => {
    useConfigStore.setState((state) => {
      state.config.tenantId = null;
    });
    await useConfigStore.getState().config.reloadBaseForConflict();
    expect(configOps.loadConfig).not.toHaveBeenCalled();
  });

  it('surfaces an error toast and keeps the conflict when the refresh fails', async () => {
    vi.mocked(configOps.loadConfig).mockRejectedValue(new Error('network down'));

    await expect(
      useConfigStore.getState().config.reloadBaseForConflict()
    ).rejects.toThrow('network down');

    const s = useConfigStore.getState();
    // Conflict is NOT cleared on failure — operator can retry.
    expect(s.config.conflictState).not.toBeNull();
    expect(s.ui.toasts.some((t) => t.type === 'error')).toBe(true);
    // Edits untouched.
    expect(s.programs.programs.p1.name).toBe('MY UNSAVED EDIT');
  });
});
