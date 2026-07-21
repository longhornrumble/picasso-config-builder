/**
 * Staged pending-changes model (redesign).
 *
 * Every edit updates the config store's working state; nothing ships until an
 * explicit Deploy. The set of "pending changes" is derived — NOT stored — by
 * diffing the canonical merged config (getMergedConfig) against the pristine
 * baseline snapshot captured at load/save/deploy (config.pristineConfig).
 *
 * See README "Staged deploys" / "State Management".
 */

import React from 'react';
import { useConfigStore } from '@/store';
import type { TenantConfig } from '@/types/config';

/** A single leaf-level field change: `path` changed `from` → `to`. */
export interface PendingChange {
  path: string;
  from: unknown;
  to: unknown;
}

/** Volatile / server-owned fields that must never count as a pending change. */
const IGNORE_KEYS = new Set(['generated_at', 'version']);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function diffInto(path: string, a: unknown, b: unknown, out: PendingChange[]): void {
  if (a === b) return;
  // Cheap structural short-circuit for unchanged branches.
  if (isPlainObject(a) || Array.isArray(a) || isPlainObject(b) || Array.isArray(b)) {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (IGNORE_KEYS.has(k)) continue;
      diffInto(path ? `${path}.${k}` : k, a[k], b[k], out);
    }
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      diffInto(`${path}[${i}]`, a[i], b[i], out);
    }
    return;
  }

  // Leaf (or type-mismatch): record the change.
  out.push({ path, from: a, to: b });
}

export function computePendingChanges(
  pristine: TenantConfig | null,
  merged: TenantConfig | null,
): PendingChange[] {
  if (!pristine || !merged) return [];
  const out: PendingChange[] = [];
  diffInto('', pristine, merged, out);
  return out;
}

const EMPTY: PendingChange[] = [];

/**
 * Reactive list of pending changes (recomputed whenever the config working
 * state or baseline changes). Cheap enough for a single-operator tool.
 */
export function usePendingChanges(): PendingChange[] {
  const pristine = useConfigStore((s) => s.config.pristineConfig);
  // Subscribe to every working-state source getMergedConfig reads, so the memo
  // recomputes on any edit (slice CRUD or in-place settings edits on baseConfig).
  const programs = useConfigStore((s) => s.programs.programs);
  const forms = useConfigStore((s) => s.forms.forms);
  const ctas = useConfigStore((s) => s.ctas.ctas);
  const branches = useConfigStore((s) => s.branches.branches);
  const showcase = useConfigStore((s) => s.contentShowcase.content_showcase);
  const baseConfig = useConfigStore((s) => s.config.baseConfig);
  const getMergedConfig = useConfigStore((s) => s.config.getMergedConfig);

  return React.useMemo(() => {
    if (!pristine || !baseConfig) return EMPTY;
    return computePendingChanges(pristine, getMergedConfig());
    // getMergedConfig reads the subscribed slices; listing them as deps makes
    // the memo recompute on any edit even though the fn identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pristine, programs, forms, ctas, branches, showcase, baseConfig, getMergedConfig]);
}

export function usePendingCount(): number {
  return usePendingChanges().length;
}
