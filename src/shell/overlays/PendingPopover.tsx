/**
 * Pending changes popover (below the top bar). Lists the staged field-level
 * diffs (path: from → to), then Deploy → confirm step → config.deployConfig().
 * Deployment history is deferred ("future release" — no backend endpoint yet).
 * Design handoff §Overlays "Pending changes popover".
 */

import React from 'react';
import { ChevronRight, Rocket } from 'lucide-react';
import { useConfigStore } from '@/store';
import { useShellStore } from '../shellStore';
import { useTenantSummary } from '../useShellData';
import { usePendingChanges, type PendingChange } from '../pendingChanges';

function fmt(v: unknown): string {
  if (v === undefined) return '(unset)';
  if (v === null) return 'null';
  if (typeof v === 'string') return v === '' ? '(empty)' : v;
  if (typeof v === 'object') return Array.isArray(v) ? `[${(v as unknown[]).length} items]` : '{…}';
  return String(v);
}

export function PendingPopover() {
  const open = useShellStore((s) => s.overlays.pendingPopover);
  const closeOverlay = useShellStore((s) => s.closeOverlay);
  const tenant = useTenantSummary();
  const changes = usePendingChanges();
  const deployConfig = useConfigStore((s) => s.config.deployConfig);
  const deploying = useConfigStore((s) => s.ui.loading?.deploy ?? false);

  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  if (!open) return null;

  const close = () => {
    setConfirming(false);
    setExpanded(null);
    closeOverlay('pendingPopover');
  };

  const onDeploy = async () => {
    try {
      await deployConfig();
      close();
    } catch {
      // deployConfig surfaces its own error/conflict toast; keep the popover open.
    }
  };

  return (
    <>
      {/* click-catcher */}
      <div className="fixed inset-0 z-[90]" onClick={close} />
      <div
        className="cb-scope cb-anim-pop fixed right-5 top-[60px] z-[91] w-[330px] overflow-hidden rounded-card bg-white"
        style={{ boxShadow: '0 20px 48px rgba(2,6,23,.18)' }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
          <span className="font-bold" style={{ fontSize: '13px', color: '#0F172A' }}>Pending changes</span>
          <span className="rounded-full px-1.5 font-bold" style={{ background: '#EEF2F6', color: '#475569', fontSize: '10px' }}>
            {changes.length}
          </span>
        </div>

        {confirming ? (
          <div className="px-4 py-5">
            <p style={{ fontSize: '12.5px', color: '#334155' }}>
              Deploy <span className="font-bold">{tenant.name}</span> — {changes.length}{' '}
              {changes.length === 1 ? 'change' : 'changes'}?
            </p>
            <p className="mt-1" style={{ fontSize: '11px', color: '#94A3B8' }}>
              This writes the config to S3 and bumps the version.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full border px-3 py-1.5 font-semibold" style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '11.5px' }}>
                Cancel
              </button>
              <button type="button" onClick={onDeploy} disabled={deploying} className="rounded-full px-4 py-1.5 font-bold text-white disabled:opacity-50" style={{ background: '#50C878', fontSize: '11.5px' }}>
                {deploying ? 'Deploying…' : 'Confirm deploy'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="cb-scroll max-h-[46vh]">
              {changes.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                  Nothing staged. Edits appear here until you deploy.
                </div>
              ) : (
                changes.map((c: PendingChange, i) => (
                  <div key={i} className="border-b" style={{ borderColor: '#F1F5F9' }}>
                    <button type="button" onClick={() => setExpanded(expanded === i ? null : i)} className="flex w-full items-center gap-2 px-4 py-2 text-left">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: '#fbbf24' }} />
                      <span className="min-w-0 flex-1 truncate font-mono" style={{ fontSize: '11px', color: '#334155' }}>{c.path}</span>
                      <ChevronRight size={13} className="flex-shrink-0 text-slate-300" style={{ transform: expanded === i ? 'rotate(90deg)' : 'none' }} />
                    </button>
                    {expanded === i && (
                      <div className="px-4 pb-2 pl-8" style={{ fontSize: '10.5px' }}>
                        <div style={{ color: '#B91C1C' }}>− {fmt(c.from)}</div>
                        <div style={{ color: '#1C7A45' }}>+ {fmt(c.to)}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Deployment history — deferred */}
            <div className="border-t px-4 py-2" style={{ borderColor: '#E2E8F0', fontSize: '10px', color: '#94A3B8' }}>
              Deployment history & rollback — coming in a future release.
            </div>

            <div className="border-t p-3" style={{ borderColor: '#E2E8F0' }}>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={changes.length === 0}
                className="flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 font-bold text-white disabled:opacity-40"
                style={{ background: '#50C878', fontSize: '12px', boxShadow: changes.length ? '0 4px 14px rgba(80,200,120,.3)' : 'none' }}
              >
                <Rocket size={13} /> Deploy
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
