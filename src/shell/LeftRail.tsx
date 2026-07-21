/**
 * Left rail (216px navy). Logo + tenant block (opens tenant switcher) + view
 * nav (Overview / Pipeline / Settings) + version footer.
 * Design handoff: README "Layout Shell".
 */

import { LayoutGrid, GitBranch, Settings, Command, type LucideIcon } from 'lucide-react';
import logoUrl from '@/assets/myrecruiter-logo.png';
import { useShellStore, type ShellView } from './shellStore';
import { useTenantSummary } from './useShellData';

const NAV: { view: ShellView; label: string; icon: LucideIcon }[] = [
  { view: 'overview', label: 'Overview', icon: LayoutGrid },
  { view: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function LeftRail() {
  const view = useShellStore((s) => s.view);
  const setView = useShellStore((s) => s.setView);
  const openOverlay = useShellStore((s) => s.openOverlay);
  const tenant = useTenantSummary();

  return (
    <aside
      className="flex h-full w-[216px] flex-shrink-0 flex-col"
      style={{ background: '#0F172A' }}
    >
      {/* Logo + eyebrow */}
      <div className="px-4 pt-4 pb-3">
        <img src={logoUrl} alt="MyRecruiter" className="h-6 w-auto" />
        <div
          className="mt-3 font-bold uppercase"
          style={{ fontSize: '9.5px', letterSpacing: '0.16em', color: '#64748B' }}
        >
          Config Builder
        </div>
      </div>

      {/* Tenant block — opens the tenant switcher (⌘K) */}
      <button
        type="button"
        onClick={() => openOverlay('tenantSwitcher')}
        className="mx-3 mb-2 flex items-center gap-2.5 rounded-tile px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
      >
        <span
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] font-bold text-white"
          style={{ background: tenant.brandColor, fontSize: '12px' }}
        >
          {(tenant.name || '?').charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-white" style={{ fontSize: '12.5px' }}>
            {tenant.name}
          </span>
          <span
            className="block truncate font-mono"
            style={{ fontSize: '9.5px', color: '#94A3B8' }}
          >
            {tenant.loaded ? `${tenant.tenantId} · ${tenant.tier}` : 'Click to load a tenant'}
          </span>
        </span>
        <span
          className="flex items-center gap-0.5 rounded-md border px-1 py-0.5"
          style={{ borderColor: '#334155', color: '#94A3B8', fontSize: '9px' }}
        >
          <Command size={9} /> K
        </span>
      </button>

      {/* Nav */}
      <nav className="mt-1 flex flex-col gap-0.5 px-3">
        {NAV.map(({ view: v, label, icon: Icon }) => {
          const active = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="flex items-center gap-2.5 rounded-tile px-2.5 py-2 font-semibold transition-colors"
              style={{
                fontSize: '12.5px',
                background: active ? 'rgba(80,200,120,.16)' : 'transparent',
                color: active ? '#7DE3A8' : '#CBD5E1',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Footer version line */}
      <div className="px-4 pb-4" style={{ fontSize: '10.5px', color: '#64748B' }}>
        {tenant.loaded ? `v${tenant.version} live` : 'No tenant loaded'}
      </div>
    </aside>
  );
}
