/**
 * Durability contract for useAutoSave crash-recovery.
 *
 * An autosave snapshot records the base ETag its edits sit on. On restore the
 * hook must:
 *  - reapply the snapshot ONLY when that base ETag still matches the loaded
 *    config (genuine same-base crash recovery), and say so visibly; and
 *  - DISCARD the snapshot (visibly) when the server config changed since —
 *    silently overlaying stale edits onto newer data was a data-loss path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { useConfigStore } from '@/store';

const KEY = 'test-autosave';
const TENANT = 'TEST001';
const STORAGE = `${KEY}-${TENANT}`;

function seedStore(etag: string | null) {
  useConfigStore.setState((state) => {
    state.config.tenantId = TENANT;
    state.config.etag = etag;
    state.config.isDirty = false;
    state.programs.programs = { existing: { program_id: 'existing', name: 'server value' } } as never;
    state.ui.toasts = [];
  });
}

function seedSnapshot(baseEtag: string | null) {
  sessionStorage.setItem(
    STORAGE,
    JSON.stringify({
      tenantId: TENANT,
      timestamp: Date.now(),
      baseEtag,
      programs: { draft: { program_id: 'draft', name: 'MY DRAFT EDIT' } },
      forms: {},
      ctas: {},
      branches: {},
      contentShowcase: [],
    })
  );
}

describe('useAutoSave staleness guard', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('restores the draft when the base ETag still matches, visibly', () => {
    seedStore('W/"v1"');
    seedSnapshot('W/"v1"');

    renderHook(() => useAutoSave({ storageKey: KEY }));

    const s = useConfigStore.getState();
    expect(s.programs.programs.draft?.name).toBe('MY DRAFT EDIT');
    expect(s.config.isDirty).toBe(true);
    expect(s.ui.toasts.some((t) => t.message.toLowerCase().includes('recovered'))).toBe(true);
  });

  it('discards a stale draft (base ETag changed) instead of overlaying it, visibly', () => {
    seedStore('W/"v2"'); // server moved on
    seedSnapshot('W/"v1"'); // draft was against the old base

    renderHook(() => useAutoSave({ storageKey: KEY }));

    const s = useConfigStore.getState();
    // Stale draft was NOT applied — the server value is untouched.
    expect(s.programs.programs.draft).toBeUndefined();
    expect(s.programs.programs.existing?.name).toBe('server value');
    // Snapshot cleared, and the discard was surfaced (not silent).
    expect(sessionStorage.getItem(STORAGE)).toBeNull();
    expect(s.ui.toasts.some((t) => t.message.toLowerCase().includes('discarded'))).toBe(true);
  });

  it('discards when freshness cannot be verified (no ETag available)', () => {
    seedStore(null);
    seedSnapshot(null);

    renderHook(() => useAutoSave({ storageKey: KEY }));

    const s = useConfigStore.getState();
    expect(s.programs.programs.draft).toBeUndefined();
    expect(sessionStorage.getItem(STORAGE)).toBeNull();
  });
});
