/**
 * Inspector dock (330px, right, docks when something is selected). Read-first
 * panel: meta rows, cross-links, and "Open full editor". Scaffold; full
 * per-kind inspector content lands with the Overview phase.
 */

import { X } from 'lucide-react';
import { useShellStore } from './shellStore';

export function InspectorDock() {
  const selection = useShellStore((s) => s.selection);
  const clearSelection = useShellStore((s) => s.clearSelection);
  const openEditor = useShellStore((s) => s.openEditor);

  if (!selection) return null;

  return (
    <aside
      className="cb-anim-inspector flex h-full w-[330px] flex-shrink-0 flex-col border-l bg-white"
      style={{ borderColor: '#E2E8F0' }}
    >
      <div className="flex items-start justify-between px-4 pt-4">
        <div>
          <div className="font-bold" style={{ fontSize: '13px', color: '#0F172A' }}>
            {selection.id}
          </div>
          <div className="uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '.06em' }}>
            {selection.kind}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close inspector"
          onClick={clearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="border-t p-4" style={{ borderColor: '#E2E8F0' }}>
        <button
          type="button"
          onClick={() => openEditor(selection.kind, selection.id)}
          className="w-full rounded-full px-3 py-2 font-bold text-white"
          style={{ background: '#50C878', fontSize: '12px' }}
        >
          Open full editor
        </button>
        <p className="mt-2 text-center" style={{ fontSize: '10px', color: '#94A3B8' }}>
          Edits queue in Pending changes until you deploy
        </p>
      </div>
    </aside>
  );
}
