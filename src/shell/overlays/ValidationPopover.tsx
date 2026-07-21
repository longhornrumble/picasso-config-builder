/**
 * Validation popover — lists non-blocking warnings; each row deep-links to the
 * offending entity (switches to Overview + opens its Inspector). Design handoff
 * §Overlays "Validation popover".
 */

import React from 'react';
import { TriangleAlert, ChevronRight } from 'lucide-react';
import { useConfigStore } from '@/store';
import { useShellStore, type EntityKind } from '../shellStore';

export function ValidationPopover() {
  const open = useShellStore((s) => s.overlays.validationPopover);
  const closeOverlay = useShellStore((s) => s.closeOverlay);
  const setView = useShellStore((s) => s.setView);
  const select = useShellStore((s) => s.select);

  const warnings = useConfigStore((s) => s.validation.warnings);
  const store = useConfigStore();

  const rows = React.useMemo(() => {
    const out: { entityId: string; field: string; message: string }[] = [];
    Object.entries(warnings).forEach(([entityId, list]) => {
      (list ?? []).forEach((w) => out.push({ entityId, field: w.field, message: w.message }));
    });
    return out;
  }, [warnings]);

  if (!open) return null;

  // Resolve an entity id to its kind so the row can deep-link.
  const resolveKind = (id: string): EntityKind | null => {
    if (store.ctas.ctas[id]) return 'cta';
    if (store.forms.forms[id]) return 'form';
    if (store.programs.programs[id]) return 'program';
    if (store.branches.branches[id]) return 'branch';
    if (store.config.baseConfig?.action_chips?.default_chips?.[id]) return 'chip';
    if (store.contentShowcase.content_showcase.some((i) => i.id === id)) return 'showcase';
    return null;
  };

  const close = () => closeOverlay('validationPopover');

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={close} />
      <div className="cb-scope cb-anim-pop fixed right-5 top-[60px] z-[91] w-[360px] overflow-hidden rounded-card bg-white" style={{ boxShadow: '0 20px 48px rgba(2,6,23,.18)' }}>
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
          <span className="font-bold" style={{ fontSize: '13px', color: '#0F172A' }}>Validation</span>
          {rows.length === 0 ? (
            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: '#E9F7EF', color: '#1C7A45', fontSize: '10px' }}>Valid</span>
          ) : (
            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px' }}>{rows.length} warnings</span>
          )}
        </div>
        <div className="cb-scroll max-h-[52vh]">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ fontSize: '11.5px', color: '#94A3B8' }}>No warnings.</div>
          ) : (
            rows.map((r, i) => {
              const kind = resolveKind(r.entityId);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!kind}
                  onClick={() => { if (kind) { setView('overview'); select({ kind, id: r.entityId }); close(); } }}
                  className="flex w-full items-start gap-2 border-b px-4 py-2.5 text-left disabled:cursor-default"
                  style={{ borderColor: '#F1F5F9' }}
                >
                  <TriangleAlert size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" style={{ fontSize: '11.5px', color: '#334155' }}>
                      <span className="font-mono">{r.entityId}</span> · {r.field}
                    </span>
                    <span className="block" style={{ fontSize: '10.5px', color: '#64748B' }}>{r.message}</span>
                  </span>
                  {kind && <ChevronRight size={13} className="mt-0.5 flex-shrink-0 text-slate-300" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
