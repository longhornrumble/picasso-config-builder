import { describe, it, expect } from 'vitest';
import { computePendingChanges } from '../pendingChanges';
import type { TenantConfig } from '@/types/config';

/** Build a minimal config-ish object; only the diffed shape matters here. */
function cfg(overrides: Record<string, unknown>): TenantConfig {
  return {
    tenant_id: 'T1',
    chat_title: 'Acme',
    version: '1.0.0',
    generated_at: 1000,
    cta_definitions: {},
    conversational_forms: {},
    conversation_branches: {},
    ...overrides,
  } as unknown as TenantConfig;
}

describe('computePendingChanges', () => {
  it('returns [] for null inputs', () => {
    expect(computePendingChanges(null, cfg({}))).toEqual([]);
    expect(computePendingChanges(cfg({}), null)).toEqual([]);
  });

  it('returns [] for identical configs', () => {
    expect(computePendingChanges(cfg({}), cfg({}))).toEqual([]);
  });

  it('ignores volatile server-owned fields (generated_at, version)', () => {
    const a = cfg({ generated_at: 1000, version: '1.0.0' });
    const b = cfg({ generated_at: 9999, version: '1.0.1' });
    expect(computePendingChanges(a, b)).toEqual([]);
  });

  it('detects a changed top-level leaf', () => {
    const changes = computePendingChanges(cfg({}), cfg({ chat_title: 'NewName' }));
    expect(changes).toEqual([{ path: 'chat_title', from: 'Acme', to: 'NewName' }]);
  });

  it('detects a changed nested field with a dotted path', () => {
    const a = cfg({ cta_definitions: { give: { label: 'Give' } } });
    const b = cfg({ cta_definitions: { give: { label: 'Donate' } } });
    expect(computePendingChanges(a, b)).toEqual([
      { path: 'cta_definitions.give.label', from: 'Give', to: 'Donate' },
    ]);
  });

  it('records an added object as a single entry (not per-subfield)', () => {
    const a = cfg({ cta_definitions: {} });
    const b = cfg({ cta_definitions: { give: { label: 'Give' } } });
    expect(computePendingChanges(a, b)).toEqual([
      { path: 'cta_definitions.give', from: undefined, to: { label: 'Give' } },
    ]);
  });

  it('detects array element changes with indexed paths', () => {
    const a = cfg({ content_showcase: [{ name: 'A' }] });
    const b = cfg({ content_showcase: [{ name: 'B' }] });
    expect(computePendingChanges(a, b)).toEqual([
      { path: 'content_showcase[0].name', from: 'A', to: 'B' },
    ]);
  });

  it('records an appended array element as a single entry', () => {
    const a = cfg({ content_showcase: [{ name: 'A' }] });
    const b = cfg({ content_showcase: [{ name: 'A' }, { name: 'B' }] });
    const changes = computePendingChanges(a, b);
    expect(changes).toEqual([{ path: 'content_showcase[1]', from: undefined, to: { name: 'B' } }]);
  });
});
