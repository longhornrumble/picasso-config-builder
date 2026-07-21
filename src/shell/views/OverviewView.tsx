/**
 * Overview view — one dense screen grouping every entity type for the loaded
 * tenant. Full entity sections land in the Overview phase; this scaffolds the
 * centered column + health strip so the shell is verifiable end-to-end.
 */

import { useTenantSummary, useEntityCounts } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';

export function OverviewView() {
  const tenant = useTenantSummary();
  const counts = useEntityCounts();

  if (!tenant.loaded) return <EmptyTenantState />;

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {/* Health strip */}
      <div className="flex flex-wrap items-center gap-3" style={{ fontSize: '11.5px' }}>
        <span
          className="rounded-full px-2.5 py-1 font-semibold"
          style={{ background: '#E9F7EF', color: '#1C7A45' }}
        >
          Config valid
        </span>
        <span style={{ color: '#64748B' }}>
          {counts.nodes} nodes · {counts.forms + counts.ctas + counts.branches} connections
        </span>
        <span style={{ color: tenant.messengerOn ? '#1C7A45' : '#94A3B8' }}>
          Messenger {tenant.messengerOn ? 'on' : 'off'}
        </span>
        <span style={{ color: '#94A3B8' }}>
          v{tenant.version} · {tenant.tier}
        </span>
      </div>

      <div
        className="mt-6 rounded-card border border-dashed p-8 text-center"
        style={{ borderColor: '#E2E8F0', color: '#94A3B8', fontSize: '12px' }}
      >
        Overview sections (Calls to action · Forms · Programs · Routing · Showcase)
        render here.
        <div className="mt-2" style={{ color: '#64748B' }}>
          {counts.ctas} CTAs · {counts.forms} forms · {counts.programs} programs ·{' '}
          {counts.branches} branches · {counts.chips} chips · {counts.showcase} showcase
        </div>
      </div>
    </div>
  );
}
