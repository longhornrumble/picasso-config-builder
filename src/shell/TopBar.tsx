/**
 * Top bar (56px). View title/subtitle + search, warnings pill, pending pill,
 * Preview, Deploy, Promote, avatar. Design handoff: README "Layout Shell".
 *
 * Deploy/pending/validation/preview open overlays hosted by AppShell; the
 * overlay bodies (popovers/modal) are built in a later phase.
 */

import { Search, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfigStore } from '@/store';
import { useShellStore, type ShellView } from './shellStore';
import { useTenantSummary } from './useShellData';
import { usePendingCount } from './pendingChanges';

const VIEW_META: Record<ShellView, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Every entity for this tenant, at a glance' },
  pipeline: { title: 'Pipeline', subtitle: 'Chips → Branches → CTAs → Forms → Programs' },
  settings: { title: 'Settings', subtitle: 'Identity, brand, behavior, channels & admin' },
};

export function TopBar() {
  const view = useShellStore((s) => s.view);
  const openOverlay = useShellStore((s) => s.openOverlay);
  const toggleOverlay = useShellStore((s) => s.toggleOverlay);
  const tenant = useTenantSummary();
  const { user } = useAuth();

  const pendingCount = usePendingCount();
  const warningCount = useConfigStore(
    (s) => Object.values(s.validation.warnings).reduce((n, arr) => n + (arr?.length ?? 0), 0),
  );

  const meta = VIEW_META[view];
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-5"
      style={{ borderColor: '#E2E8F0' }}
    >
      {/* Title */}
      <div className="min-w-0">
        <div className="font-bold" style={{ fontSize: '14px', color: '#0F172A' }}>
          {meta.title}
        </div>
        <div className="truncate" style={{ fontSize: '10.5px', color: '#94A3B8' }}>
          {meta.subtitle}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search (⌘/)"
          onClick={() => openOverlay('globalSearch')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Search size={15} />
        </button>

        {warningCount > 0 && (
          <button
            type="button"
            onClick={() => toggleOverlay('validationPopover')}
            className="flex items-center gap-1 rounded-full px-3 py-1 font-semibold"
            style={{ background: '#FEF3C7', color: '#92400E', fontSize: '11px' }}
          >
            <TriangleAlert size={12} />
            {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
          </button>
        )}

        <button
          type="button"
          onClick={() => toggleOverlay('pendingPopover')}
          className="flex items-center gap-2 rounded-full px-3 py-1 font-semibold text-white"
          style={{ background: '#0F172A', fontSize: '11px' }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: pendingCount > 0 ? '#fbbf24' : '#334155' }}
          />
          {pendingCount > 0
            ? `${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`
            : 'No pending changes'}
        </button>

        <button
          type="button"
          onClick={() => openOverlay('previewModal')}
          disabled={!tenant.loaded}
          className="rounded-full border px-3 py-1 font-semibold transition-colors hover:bg-slate-50 disabled:opacity-40"
          style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '11px' }}
        >
          Preview
        </button>

        <button
          type="button"
          onClick={() => toggleOverlay('pendingPopover')}
          disabled={!tenant.loaded || pendingCount === 0}
          className="rounded-full px-4 py-1.5 font-bold text-white transition-transform hover:-translate-y-px disabled:opacity-40"
          style={{ background: '#50C878', fontSize: '11px', boxShadow: '0 4px 14px rgba(80,200,120,.3)' }}
        >
          Deploy
        </button>

        <button
          type="button"
          disabled
          title="Promote to production (coming soon)"
          className="rounded-full border px-3 py-1 font-semibold opacity-50"
          style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '11px' }}
        >
          Promote
        </button>

        <span
          className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white"
          style={{ background: '#334155', fontSize: '12px' }}
          title={user?.email}
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
