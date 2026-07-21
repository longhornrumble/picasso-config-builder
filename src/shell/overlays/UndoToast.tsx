/**
 * Undo toast — bottom-center pill shown briefly after a staged delete, with an
 * Undo action that re-inserts the entity. Auto-dismisses after ~5s. Design
 * handoff §3 (delete shows a toast with Undo).
 */

import React from 'react';
import { Undo2 } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { CTADefinition, ConversationalForm, Program, ConversationBranch, ShowcaseItem, ActionChip } from '@/types/config';
import { useShellStore, type UndoDelete } from '../shellStore';
import { createChip } from '../editors/chipOps';

function reinsert(u: UndoDelete): void {
  const s = useConfigStore.getState();
  switch (u.kind) {
    case 'cta': s.ctas.createCTA(u.data as CTADefinition, u.id); break;
    case 'form': s.forms.createForm(u.data as ConversationalForm); break;
    case 'program': s.programs.createProgram(u.data as Program); break;
    case 'branch': s.branches.createBranch(u.data as ConversationBranch, u.id); break;
    case 'showcase': s.contentShowcase.createShowcaseItem(u.data as ShowcaseItem); break;
    case 'chip': createChip(u.data as ActionChip, u.id); break;
  }
}

export function UndoToast() {
  const undoDelete = useShellStore((s) => s.undoDelete);
  const setUndoDelete = useShellStore((s) => s.setUndoDelete);

  // Auto-dismiss after 5s. Keyed on the delete so each new delete resets the timer.
  React.useEffect(() => {
    if (!undoDelete) return;
    const t = setTimeout(() => setUndoDelete(null), 5000);
    return () => clearTimeout(t);
  }, [undoDelete, setUndoDelete]);

  if (!undoDelete) return null;

  const onUndo = () => {
    reinsert(undoDelete);
    setUndoDelete(null);
  };

  return (
    <div className="cb-scope fixed bottom-5 left-1/2 z-[120] -translate-x-1/2">
      <div
        className="cb-anim-pop flex items-center gap-3 rounded-full px-4 py-2.5 text-white"
        style={{ background: '#0F172A', boxShadow: '0 12px 32px rgba(2,6,23,.32)' }}
      >
        <span style={{ fontSize: '12px' }}>Deleted {undoDelete.label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1 font-bold"
          style={{ color: '#7DE3A8', fontSize: '12px' }}
        >
          <Undo2 size={13} /> Undo
        </button>
      </div>
    </div>
  );
}
