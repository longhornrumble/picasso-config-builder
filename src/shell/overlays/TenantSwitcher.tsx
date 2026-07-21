/**
 * Tenant switcher (⌘K / tenant block). Command palette listing tenants;
 * selecting one loads its config into the store (swaps the whole dataset).
 * Reuses the existing listTenants API + config.loadConfig + role filter
 * (same logic as the legacy TenantSelector).
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useConfigStore } from '@/store';
import { listTenants } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { TenantListItem } from '@/types/api';
import { useShellStore } from '../shellStore';
import { CommandPalette, type PaletteItem } from '../CommandPalette';

export function TenantSwitcher() {
  const open = useShellStore((s) => s.overlays.tenantSwitcher);
  const closeOverlay = useShellStore((s) => s.closeOverlay);
  const currentTenantId = useConfigStore((s) => s.config.tenantId);
  const loadConfig = useConfigStore((s) => s.config.loadConfig);
  const addToast = useConfigStore((s) => s.ui.addToast);
  const { user } = useAuth();

  const [tenants, setTenants] = React.useState<TenantListItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch (and role-filter) the tenant list whenever the palette opens.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const list = await listTenants();
        if (cancelled) return;
        let filtered = list;
        if (user?.role !== 'super_admin' && user?.tenants && user.tenants.length > 0) {
          const allowed = new Set(user.tenants);
          filtered = list.filter((t) => allowed.has(t.tenantId));
        }
        setTenants(filtered);
      } catch (err) {
        if (cancelled) return;
        addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load tenants' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchTenants();
    return () => {
      cancelled = true;
    };
  }, [open, user, addToast]);

  const items: PaletteItem[] = tenants.map((t) => {
    const name = t.tenantName || t.tenantId;
    const isCurrent = t.tenantId === currentTenantId;
    return {
      id: t.tenantId,
      haystack: `${name} ${t.tenantId}`,
      render: (
        <>
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-tile font-bold text-white"
            style={{ background: '#50C878', fontSize: '11px' }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold" style={{ fontSize: '12.5px', color: '#0F172A' }}>
              {name}
            </span>
            <span className="block truncate font-mono" style={{ fontSize: '10.5px', color: '#64748B' }}>
              {t.tenantId}
            </span>
          </span>
          {t.tier && (
            <span
              className="rounded-full px-2 py-0.5 font-semibold uppercase"
              style={{ background: '#EEF2F6', color: '#475569', fontSize: '9px', letterSpacing: '.04em' }}
            >
              {t.tier}
            </span>
          )}
          {isCurrent && (
            <span className="flex items-center gap-1 font-semibold" style={{ color: '#1C7A45', fontSize: '10.5px' }}>
              <Check size={12} /> Loaded
            </span>
          )}
        </>
      ),
    };
  });

  return (
    <CommandPalette
      open={open}
      onClose={() => closeOverlay('tenantSwitcher')}
      placeholder={loading ? 'Loading tenants…' : 'Search tenants by name or ID…'}
      items={items}
      onSelect={(id) => {
        if (id !== currentTenantId) void loadConfig(id);
      }}
      emptyLabel={loading ? 'Loading…' : 'No tenants found'}
      footer={
        <>
          <span>↑↓ navigate</span>
          <span>↵ load</span>
          <span>esc close</span>
        </>
      }
    />
  );
}
