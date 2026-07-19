/**
 * Contract test: getMergedConfig is the single merge path for save, deploy,
 * and preview. Two directions, both load-bearing:
 *
 *   1. SOUNDNESS — every key it emits must be one the deployed Lambda accepts
 *      (cm_accepts + metadata). A stray key (e.g. card_inventory) 400s the PUT.
 *   2. COMPLETENESS — for every section the Config Builder owns a UI for
 *      (cb_must_emit), getMergedConfig must actually emit it when present.
 *      A forgotten emit line means the section silently never persists
 *      (Landmine 1). This is the direction that guards T2b's messenger_behavior
 *      emit line, and every future editable section.
 *
 * The section lists are pinned in the shared contract file
 * src/lib/contracts/config_sections_contract.json, duplicated verbatim in the
 * lambda repo (Picasso_Config_Manager/config_sections_contract.json). The repos
 * have separate CI, so each side self-validates its own copy — reconcile by
 * manual diff when either changes. (Messenger Product Surface P0b.)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createMockS3API,
  createTestTenantConfig,
  resetIdCounter,
  resetConfigStore,
} from './testUtils';
import * as configOps from '@/lib/api/config-operations';
import type { TenantConfig } from '@/types/config';
import contract from '@/lib/contracts/config_sections_contract.json';

vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  deployConfig: vi.fn(),
  listTenants: vi.fn(),
}));

describe('merge payload contract (getMergedConfig vs shared section contract)', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
    resetConfigStore(useConfigStore);
  });

  it('the contract is internally consistent: cb_must_emit ⊆ cm_accepts, disjoint from cb_not_emitted', () => {
    const accepts = new Set(contract.cm_accepts);
    for (const s of contract.cb_must_emit) {
      expect(accepts.has(s), `cb_must_emit "${s}" is not in cm_accepts`).toBe(true);
    }
    // cb_must_emit ∪ cb_not_emitted.sections === cm_accepts (no section unaccounted for).
    const union = new Set([...contract.cb_must_emit, ...contract.cb_not_emitted.sections]);
    expect(union.size).toBe(accepts.size);
    for (const s of contract.cm_accepts) {
      expect(union.has(s), `cm_accepts "${s}" is neither cb_must_emit nor cb_not_emitted`).toBe(true);
    }
  });

  it('SOUNDNESS: emits only server-accepted keys, sheds stale keys, never sends card_inventory', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const testConfig = createTestTenantConfig('TEST_TENANT') as TenantConfig &
      Record<string, unknown>;
    // Legacy stored configs can carry these; the merge path must shed them.
    testConfig.card_inventory = [{ id: 'legacy-card' }];
    testConfig.some_retired_section = { junk: true };

    mockS3._setMockConfig('TEST_TENANT', testConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    const merged = result.current.config.getMergedConfig();
    expect(merged).not.toBeNull();

    const allowed = new Set([...contract.cm_accepts, ...contract.metadata_fields]);
    for (const key of Object.keys(merged!)) {
      expect(allowed.has(key), `"${key}" is not accepted by the server merge`).toBe(true);
    }

    // Server 400s the entire PUT when card_inventory is present.
    expect(merged).not.toHaveProperty('card_inventory');
    // Unknown stale keys must not ride along.
    expect(merged).not.toHaveProperty('some_retired_section');
  });

  it('COMPLETENESS: with every editable section populated, getMergedConfig emits all cb_must_emit sections (Landmine 1 guard)', async () => {
    const { result } = renderHook(() => useConfigStore());
    const mockS3 = createMockS3API();

    // A fully-populated config: every optional cb_must_emit section present with
    // a truthy value, so a missing emit line in getMergedConfig fails this test.
    const overrides = {
      branding: { primary_color: '#000' },
      features: { some_feature: true },
      aws: { region: 'us-east-1' },
      cta_settings: { max_ctas_per_response: 3 },
      feature_flags: { V5_SINGLE_PASS: true },
      quick_help: { items: [] },
      action_chips: { default_chips: [] },
      widget_behavior: { greeting_delay_ms: 0 },
      bedrock_instructions: {
        _version: '1',
        _updated: 'x',
        formatting_preferences: {
          emoji_usage: 'none',
          max_emojis_per_response: 0,
          response_style: 'professional_concise',
          detail_level: 'concise',
        },
        custom_constraints: [],
        fallback_message: 'x',
      },
      // topic_definitions is cb_not_emitted (passthrough dropped in the dead-field
      // cleanup) — present here to prove the merge path sheds it while the server
      // preserves the stored value.
      topic_definitions: [{ id: 't1', label: 'T1' }],
      notification_settings: { enabled: true },
      messenger_behavior: { escalation_email: 'notify@myrecruiter.ai' },
    } as unknown as Partial<TenantConfig>;

    const testConfig = createTestTenantConfig('FULL_TENANT', overrides) as TenantConfig &
      Record<string, unknown>;
    // form_settings is a legacy passthrough, not on the typed TenantConfig surface.
    testConfig.form_settings = { collect_mode: 'conversational' };

    mockS3._setMockConfig('FULL_TENANT', testConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    await act(async () => {
      await result.current.config.loadConfig('FULL_TENANT');
    });

    const merged = result.current.config.getMergedConfig() as Record<string, unknown>;
    expect(merged).not.toBeNull();

    for (const section of contract.cb_must_emit) {
      expect(
        Object.prototype.hasOwnProperty.call(merged, section),
        `getMergedConfig dropped cb_must_emit section "${section}" — missing emit line?`
      ).toBe(true);
    }

    // And it correctly does NOT emit the sections CB has no editor for.
    for (const section of contract.cb_not_emitted.sections) {
      expect(
        Object.prototype.hasOwnProperty.call(merged, section),
        `getMergedConfig emitted "${section}" but CB has no editor for it`
      ).toBe(false);
    }
  });

  it('NEVER-CLEAR fix: a cleared model_id ("") is still emitted so the server persists the clear', async () => {
    const { result } = renderHook(() => useConfigStore());
    const mockS3 = createMockS3API();

    const testConfig = createTestTenantConfig('CLEAR_TENANT') as TenantConfig &
      Record<string, unknown>;
    testConfig.model_id = 'claude-x'; // stored override the user is about to clear

    mockS3._setMockConfig('CLEAR_TENANT', testConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    await act(async () => {
      await result.current.config.loadConfig('CLEAR_TENANT');
    });

    // User clears the model override in AI & AWS settings.
    act(() => {
      useConfigStore.setState((state) => {
        if (state.config.baseConfig) {
          (state.config.baseConfig as Record<string, unknown>).model_id = '';
        }
      });
    });

    const merged = result.current.config.getMergedConfig() as Record<string, unknown>;
    // Truthy-emit dropped the key here, making clears silently no-op server-side.
    expect(Object.prototype.hasOwnProperty.call(merged, 'model_id')).toBe(true);
    expect(merged.model_id).toBe('');

    // And a tenant that never had model_id still omits the key (absence = preserve).
    const bare = createTestTenantConfig('NO_MODEL_TENANT') as TenantConfig & Record<string, unknown>;
    mockS3._setMockConfig('NO_MODEL_TENANT', bare);
    await act(async () => {
      await result.current.config.loadConfig('NO_MODEL_TENANT');
    });
    const merged2 = result.current.config.getMergedConfig() as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(merged2, 'model_id')).toBe(false);
  });

  it('FORWARD-COMPAT: an old-shape config without messenger_behavior round-trips without emitting the key (Schema Discipline)', async () => {
    const { result } = renderHook(() => useConfigStore());
    const mockS3 = createMockS3API();

    // Baseline test config has no messenger_behavior — the pre-Messenger shape.
    const testConfig = createTestTenantConfig('OLD_TENANT') as TenantConfig &
      Record<string, unknown>;
    expect(testConfig).not.toHaveProperty('messenger_behavior');

    mockS3._setMockConfig('OLD_TENANT', testConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    await act(async () => {
      await result.current.config.loadConfig('OLD_TENANT');
    });

    const merged = result.current.config.getMergedConfig();
    // No crash, and the conditional emit omits the absent section entirely
    // (rather than writing messenger_behavior: undefined).
    expect(merged).not.toBeNull();
    expect(merged).not.toHaveProperty('messenger_behavior');
  });
});
