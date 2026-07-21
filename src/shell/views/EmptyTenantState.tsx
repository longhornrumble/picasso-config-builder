/** Shown in any view when no tenant is loaded. Prompts the tenant switcher. */
import { PackageOpen } from 'lucide-react';
import { useShellStore } from '../shellStore';

export function EmptyTenantState() {
  const openOverlay = useShellStore((s) => s.openOverlay);
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <PackageOpen size={40} strokeWidth={1.5} className="text-slate-300" />
      <h2 className="mt-4 font-bold" style={{ fontSize: '15px', color: '#334155' }}>
        No tenant loaded
      </h2>
      <p className="mt-1 max-w-xs" style={{ fontSize: '12px', color: '#94A3B8' }}>
        Load a tenant to view and edit its chat widget configuration.
      </p>
      <button
        type="button"
        onClick={() => openOverlay('tenantSwitcher')}
        className="mt-4 rounded-full px-4 py-2 font-bold text-white"
        style={{ background: '#50C878', fontSize: '12px', boxShadow: '0 4px 14px rgba(80,200,120,.3)' }}
      >
        Load a tenant (⌘K)
      </button>
    </div>
  );
}
