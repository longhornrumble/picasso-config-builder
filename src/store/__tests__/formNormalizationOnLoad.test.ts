/**
 * Wiring contract for loadConfig's import-normalization + validate-on-load:
 *
 * 1. Externally-authored form shapes (seeder boolean fields, flat composites)
 *    are repaired at the store boundary, flagged dirty, and announced.
 * 2. Validation runs immediately on load — the deploy button/dialog and the
 *    validation panel reflect the loaded config from the start (regression:
 *    the deploy dialog claimed "valid" on a config the panel would flag,
 *    because validation only ran after the first edit — BRI071351, 2026-07-18).
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
    chat_title: 'Title',
    tone_prompt: 't',
    welcome_message: 'w',
    generated_at: 1,
    programs: { p1: { program_id: 'p1', program_name: 'Program One' } },
    conversational_forms: {},
    cta_definitions: {},
    conversation_branches: {},
    content_showcase: [],
    branding: { primary_color: '#000000' },
    ...over,
  } as unknown as TenantConfig;
}

const seederForms = {
  seeded: {
    enabled: true,
    form_id: 'seeded',
    program: 'p1',
    title: 'Seeded',
    description: 'Externally authored',
    trigger_phrases: [],
    fields: [
      { id: 'f_name', type: 'name', label: 'Full name', prompt: 'Name?', required: true },
      { id: 'f_consent', type: 'boolean', label: 'Consent', prompt: 'OK?', required: true },
    ],
  },
};

describe('loadConfig — form normalization and validate-on-load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState((state) => {
      state.config.tenantId = null;
      state.config.baseConfig = null;
      state.config.isDirty = false;
      state.forms.forms = {};
      state.programs.programs = {};
      state.validation.errors = {};
      state.validation.warnings = {};
      state.validation.isValid = true;
      state.validation.lastValidated = null;
      state.ui.toasts = [];
      state.ui.loading = {};
    });
  });

  it('repairs seeder-shape forms, marks dirty, and announces the repairs', async () => {
    vi.mocked(configOps.loadConfig).mockResolvedValue({
      config: makeConfig({ conversational_forms: seederForms as never }),
      metadata: { lastModified: 999 },
      etag: 'W/"e1"',
    } as unknown as LoadConfigResponse);

    await useConfigStore.getState().config.loadConfig('TEST001');

    const s = useConfigStore.getState();
    const fields = s.forms.forms.seeded.fields;

    // boolean → Yes/No select, same field id
    const consent = fields.find((f) => f.id === 'f_consent')!;
    expect(consent.type).toBe('select');
    expect(consent.options?.map((o) => o.value)).toEqual(['yes', 'no']);

    // flat name composite → canonical subfields
    const name = fields.find((f) => f.id === 'f_name')!;
    expect(name.subfields?.map((sf) => sf.id)).toEqual([
      'f_name.first_name',
      'f_name.middle_name',
      'f_name.last_name',
    ]);

    // Repairs differ from S3 → dirty, so Save is offered
    expect(s.config.isDirty).toBe(true);
    expect(s.ui.toasts.some((t) => t.type === 'info' && t.message.includes('auto-repaired'))).toBe(
      true
    );
  });

  it('runs validation immediately on load (deploy surfaces reflect reality)', async () => {
    // A form with a missing program — the panel must flag it WITHOUT any edit
    const invalidForms = {
      orphan: { ...seederForms.seeded, form_id: 'orphan', program: '' },
    };
    vi.mocked(configOps.loadConfig).mockResolvedValue({
      config: makeConfig({ conversational_forms: invalidForms as never }),
      metadata: { lastModified: 999 },
      etag: 'W/"e2"',
    } as unknown as LoadConfigResponse);

    await useConfigStore.getState().config.loadConfig('TEST001');

    const s = useConfigStore.getState();
    expect(s.validation.lastValidated).not.toBeNull();
    expect(s.validation.isValid).toBe(false);
    expect(Object.keys(s.validation.errors).length).toBeGreaterThan(0);
  });

  it('leaves canonical configs untouched: clean load, no dirty flag, no repair toast', async () => {
    const canonicalForms = {
      clean: {
        enabled: true,
        form_id: 'clean',
        program: 'p1',
        title: 'Clean',
        description: 'Canonical',
        trigger_phrases: [],
        fields: [{ id: 'email', type: 'email', label: 'Email', prompt: 'Email?', required: true }],
      },
    };
    vi.mocked(configOps.loadConfig).mockResolvedValue({
      config: makeConfig({ conversational_forms: canonicalForms as never }),
      metadata: { lastModified: 999 },
      etag: 'W/"e3"',
    } as unknown as LoadConfigResponse);

    await useConfigStore.getState().config.loadConfig('TEST001');

    const s = useConfigStore.getState();
    expect(s.config.isDirty).toBe(false);
    expect(s.ui.toasts.some((t) => t.message.includes('auto-repaired'))).toBe(false);
    expect(s.validation.lastValidated).not.toBeNull();
    expect(s.validation.isValid).toBe(true);
  });
});
