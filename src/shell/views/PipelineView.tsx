/**
 * Pipeline view — chips → branches → CTAs → forms → programs as a left-to-right
 * flow with click-to-trace route highlighting. Scaffold; the flow + selection
 * model land in the Pipeline phase.
 */

import { useTenantSummary } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';

export function PipelineView() {
  const tenant = useTenantSummary();
  if (!tenant.loaded) return <EmptyTenantState />;
  return (
    <div
      className="flex h-full items-center justify-center rounded-card border border-dashed"
      style={{ borderColor: '#E2E8F0', color: '#94A3B8', fontSize: '12px' }}
    >
      Pipeline flow renders here.
    </div>
  );
}
