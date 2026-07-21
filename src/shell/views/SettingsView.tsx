/**
 * Settings view — the legacy 5 tabs + newer surfaces collapsed into one
 * scrollable page with a grouped scroll-spy index. Scaffold; the reflow reuses
 * the existing settings cards in the Settings phase.
 */

import { useTenantSummary } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';

export function SettingsView() {
  const tenant = useTenantSummary();
  if (!tenant.loaded) return <EmptyTenantState />;
  return (
    <div
      className="mx-auto flex w-full max-w-[1000px] items-center justify-center rounded-card border border-dashed p-10"
      style={{ borderColor: '#E2E8F0', color: '#94A3B8', fontSize: '12px' }}
    >
      Settings sections render here.
    </div>
  );
}
