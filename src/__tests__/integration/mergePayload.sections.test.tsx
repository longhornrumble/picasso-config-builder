/**
 * Contract test: getMergedConfig is the single merge path for save, deploy,
 * and preview — every key it emits must be one the deployed Lambda accepts.
 *
 * The authoritative allowlist lives in the lambda repo at
 * Lambdas/lambda/Picasso_Config_Manager/mergeStrategy.mjs (EDITABLE_SECTIONS,
 * READ_ONLY_SECTIONS, METADATA_FIELDS). The repos are separate in CI, so the
 * lists are duplicated here deliberately — if the server allowlist changes,
 * update this copy in the same change.
 *
 * The load-bearing assertion: `card_inventory` must NEVER be sent. The server
 * rejects the whole PUT with a 400 when it appears (validateEditedSections).
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

vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  deployConfig: vi.fn(),
  listTenants: vi.fn(),
  getTenantMetadata: vi.fn(),
}));

// mergeStrategy.mjs EDITABLE_SECTIONS
const SERVER_EDITABLE_SECTIONS = [
  'programs',
  'conversational_forms',
  'cta_definitions',
  'conversation_branches',
  'content_showcase',
  'cta_settings',
  'branding',
  'features',
  'quick_help',
  'action_chips',
  'widget_behavior',
  'aws',
  'bedrock_instructions',
  'feature_flags',
  'intent_definitions',
  'topic_definitions',
  'form_settings',
  'monitor',
  'notification_settings',
];

// mergeStrategy.mjs METADATA_FIELDS
const SERVER_METADATA_FIELDS = [
  'tenant_id',
  'tenant_hash',
  'active',
  'version',
  'chat_title',
  'organization_name',
  'company_name',
  'last_updated',
  'chat_subtitle',
  'welcome_message',
  'subscription_tier',
  'tone_prompt',
  'model_id',
  'callout_text',
  'generated_at',
];

describe('merge payload contract (getMergedConfig vs server allowlist)', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
    resetConfigStore(useConfigStore);
  });

  it('emits only server-accepted keys, sheds stale keys, never sends card_inventory', async () => {
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

    const allowed = new Set([...SERVER_EDITABLE_SECTIONS, ...SERVER_METADATA_FIELDS]);
    for (const key of Object.keys(merged!)) {
      expect(allowed.has(key), `"${key}" is not accepted by the server merge`).toBe(true);
    }

    // Server 400s the entire PUT when card_inventory is present.
    expect(merged).not.toHaveProperty('card_inventory');
    // Unknown stale keys must not ride along.
    expect(merged).not.toHaveProperty('some_retired_section');

    // The five slice-backed sections are the editable payload — always present.
    for (const key of [
      'programs',
      'conversational_forms',
      'cta_definitions',
      'conversation_branches',
      'content_showcase',
    ]) {
      expect(merged, `missing slice-backed section "${key}"`).toHaveProperty(key);
    }
  });
});
