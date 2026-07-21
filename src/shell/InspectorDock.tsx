/**
 * Inspector dock (330px, right, docks when something is selected). Read-first
 * panel: per-kind meta rows + cross-links, then "Open full editor" and Delete.
 * Design handoff §3 Inspector.
 *
 * Edits/deletes mutate working state only (staged) — nothing ships until Deploy,
 * so delete is immediate and recoverable via reset/no-deploy.
 */

import React from 'react';
import { X, MessageSquare, FileText, Layers, Zap, GitBranch, Trash2, type LucideIcon } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { CTADefinition, ConversationalForm, Program, ActionChip, ConversationBranch, ShowcaseItem } from '@/types/config';
import { useShellStore, type EntityKind, type Selection } from './shellStore';

const KIND_META: Record<EntityKind, { label: string; icon: LucideIcon }> = {
  cta: { label: 'Call to action', icon: MessageSquare },
  form: { label: 'Form', icon: FileText },
  program: { label: 'Program', icon: Layers },
  chip: { label: 'Action chip', icon: Zap },
  branch: { label: 'Conversation branch', icon: GitBranch },
  showcase: { label: 'Showcase item', icon: Layers },
};

interface Field {
  label: string;
  value: React.ReactNode;
}
interface Link {
  label: string;
  sel: Selection;
}

export function InspectorDock() {
  const selection = useShellStore((s) => s.selection);
  const clearSelection = useShellStore((s) => s.clearSelection);
  const select = useShellStore((s) => s.select);
  const openEditor = useShellStore((s) => s.openEditor);

  const store = useConfigStore();

  if (!selection) return null;

  const info = describe(selection, store);
  const KindIcon = KIND_META[selection.kind].icon;

  const onDelete = () => {
    deleteEntity(selection);
    // Some deletes are blocked by references (the slice raises its own toast).
    // Only confirm + clear selection if the entity was actually removed.
    if (!entityExists(selection)) {
      useConfigStore.getState().ui.addToast({ type: 'info', message: `Deleted ${info.name} — deploy to apply, or reset to undo.` });
      clearSelection();
    }
  };

  return (
    <aside
      className="cb-anim-inspector flex h-full w-[330px] flex-shrink-0 flex-col border-l bg-white"
      style={{ borderColor: '#E2E8F0' }}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 px-4 pt-4">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-tile" style={{ background: '#E9F7EF', color: '#1C7A45' }}>
          <KindIcon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold" style={{ fontSize: '13px', color: '#0F172A' }}>{info.name}</div>
          <div className="uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '.06em' }}>
            {KIND_META[selection.kind].label}
          </div>
        </div>
        <button type="button" aria-label="Close inspector" onClick={clearSelection} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="cb-scroll flex-1 px-4 py-4">
        {info.missing ? (
          <div className="rounded-tile border border-dashed p-4 text-center" style={{ borderColor: '#E2E8F0', fontSize: '11.5px', color: '#94A3B8' }}>
            This item no longer exists.
          </div>
        ) : (
          <>
            <dl className="flex flex-col gap-2.5">
              {info.fields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <dt className="w-[96px] flex-shrink-0 uppercase" style={{ fontSize: '9.5px', color: '#94A3B8', letterSpacing: '.06em', paddingTop: '1px' }}>
                    {f.label}
                  </dt>
                  <dd className="min-w-0 flex-1" style={{ fontSize: '12px', color: '#334155' }}>{f.value}</dd>
                </div>
              ))}
            </dl>

            {info.links.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 uppercase" style={{ fontSize: '9.5px', color: '#94A3B8', letterSpacing: '.06em' }}>Linked</div>
                <div className="flex flex-wrap gap-1.5">
                  {info.links.map((l, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => select(l.sel)}
                      className="rounded-full px-2 py-1 font-semibold"
                      style={{ background: '#E9F7EF', color: '#1C7A45', fontSize: '10.5px' }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4" style={{ borderColor: '#E2E8F0' }}>
        {!info.missing && (
          <button
            type="button"
            onClick={() => openEditor(selection.kind, selection.id)}
            className="w-full rounded-full px-3 py-2 font-bold text-white"
            style={{ background: '#50C878', fontSize: '12px' }}
          >
            Open full editor
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-semibold"
          style={{ borderColor: '#FECACA', color: '#B91C1C', fontSize: '12px' }}
        >
          <Trash2 size={13} /> Delete
        </button>
        <p className="mt-2 text-center" style={{ fontSize: '10px', color: '#94A3B8' }}>
          Edits queue in Pending changes until you deploy
        </p>
      </div>
    </aside>
  );
}

// ── Per-kind describe ──────────────────────────────────────────────────────

interface Described {
  name: string;
  missing: boolean;
  fields: Field[];
  links: Link[];
}

function describe(sel: Selection, store: ReturnType<typeof useConfigStore.getState>): Described {
  const { kind, id } = sel;

  if (kind === 'cta') {
    const cta = store.ctas.ctas[id] as CTADefinition | undefined;
    if (!cta) return miss(id);
    const links: Link[] = [];
    if (cta.formId && store.forms.forms[cta.formId]) links.push({ label: `Form: ${store.forms.forms[cta.formId].title || cta.formId}`, sel: { kind: 'form', id: cta.formId } });
    if (cta.target_branch && store.branches.branches[cta.target_branch]) links.push({ label: `Branch: ${cta.target_branch}`, sel: { kind: 'branch', id: cta.target_branch } });
    return {
      name: cta.label || id,
      missing: false,
      fields: [
        { label: 'Key', value: <span className="font-mono">{id}</span> },
        { label: 'Action', value: cta.action },
        { label: 'Type', value: cta.type },
        { label: 'Target', value: cta.formId || cta.url || cta.query || cta.prompt || '—' },
        { label: 'AI pool', value: cta.ai_available ? 'Yes' : 'No' },
      ],
      links,
    };
  }

  if (kind === 'form') {
    const form = store.forms.forms[id] as ConversationalForm | undefined;
    if (!form) return miss(id);
    const fields = form.fields ?? [];
    const links: Link[] = [];
    if (form.program && store.programs.programs[form.program]) links.push({ label: `Program: ${store.programs.programs[form.program].program_name || form.program}`, sel: { kind: 'program', id: form.program } });
    return {
      name: form.title || id,
      missing: false,
      fields: [
        { label: 'Key', value: <span className="font-mono">{id}</span> },
        { label: 'Fields', value: `${fields.length} (${fields.filter((f) => f.required).length} required)` },
        { label: 'Enabled', value: form.enabled ? 'Yes' : 'No' },
        { label: 'Description', value: form.description || '—' },
      ],
      links,
    };
  }

  if (kind === 'program') {
    const program = store.programs.programs[id] as Program | undefined;
    if (!program) return miss(id);
    const feeders = Object.values(store.forms.forms).filter((f) => f.program === id);
    return {
      name: program.program_name || id,
      missing: false,
      fields: [
        { label: 'Key', value: <span className="font-mono">{id}</span> },
        { label: 'Description', value: program.description || '—' },
        { label: 'Forms', value: `${feeders.length} feed in` },
      ],
      links: feeders.map((f) => ({ label: `Form: ${f.title || f.form_id}`, sel: { kind: 'form' as const, id: f.form_id } })),
    };
  }

  if (kind === 'chip') {
    const chip = store.config.baseConfig?.action_chips?.default_chips?.[id] as ActionChip | undefined;
    if (!chip) return miss(id);
    const links: Link[] = [];
    if (chip.target_branch && store.branches.branches[chip.target_branch]) links.push({ label: `Branch: ${chip.target_branch}`, sel: { kind: 'branch', id: chip.target_branch } });
    return {
      name: chip.label || id,
      missing: false,
      fields: [
        { label: 'Key', value: <span className="font-mono">{id}</span> },
        { label: 'Action', value: chip.action || 'send_query' },
        { label: 'Value', value: chip.value || '—' },
        { label: 'Target', value: chip.target_branch || 'Fallback routing' },
      ],
      links,
    };
  }

  if (kind === 'branch') {
    const branch = store.branches.branches[id] as ConversationBranch | undefined;
    if (!branch) return miss(id);
    const primary = branch.available_ctas?.primary;
    const secondary = branch.available_ctas?.secondary ?? [];
    const links: Link[] = [];
    if (primary && store.ctas.ctas[primary]) links.push({ label: `Primary: ${store.ctas.ctas[primary].label || primary}`, sel: { kind: 'cta', id: primary } });
    secondary.forEach((c) => { if (store.ctas.ctas[c]) links.push({ label: store.ctas.ctas[c].label || c, sel: { kind: 'cta', id: c } }); });
    return {
      name: id,
      missing: false,
      fields: [
        { label: 'Description', value: branch.description || '—' },
        { label: 'Primary', value: primary || '—' },
        { label: 'Secondary', value: `${secondary.length}` },
      ],
      links,
    };
  }

  // showcase
  const item = store.contentShowcase.content_showcase.find((s) => s.id === id) as ShowcaseItem | undefined;
  if (!item) return miss(id);
  return {
    name: item.name || id,
    missing: false,
    fields: [
      { label: 'Key', value: <span className="font-mono">{id}</span> },
      { label: 'Type', value: item.type },
      { label: 'Tagline', value: item.tagline || '—' },
      { label: 'Enabled', value: item.enabled ? 'Yes' : 'No' },
      { label: 'Keywords', value: (item.keywords ?? []).join(', ') || '—' },
    ],
    links: [],
  };
}

function miss(id: string): Described {
  return { name: id, missing: true, fields: [], links: [] };
}

function entityExists(sel: Selection): boolean {
  const s = useConfigStore.getState();
  switch (sel.kind) {
    case 'cta':
      return !!s.ctas.ctas[sel.id];
    case 'form':
      return !!s.forms.forms[sel.id];
    case 'program':
      return !!s.programs.programs[sel.id];
    case 'branch':
      return !!s.branches.branches[sel.id];
    case 'showcase':
      return s.contentShowcase.content_showcase.some((i) => i.id === sel.id);
    case 'chip':
      return !!s.config.baseConfig?.action_chips?.default_chips?.[sel.id];
  }
}

// ── Delete (staged) ────────────────────────────────────────────────────────

function deleteEntity(sel: Selection): void {
  const s = useConfigStore.getState();
  switch (sel.kind) {
    case 'cta':
      s.ctas.deleteCTA(sel.id);
      break;
    case 'form':
      s.forms.deleteForm(sel.id);
      break;
    case 'program':
      s.programs.deleteProgram(sel.id);
      break;
    case 'branch':
      s.branches.deleteBranch(sel.id);
      break;
    case 'showcase':
      s.contentShowcase.deleteShowcaseItem(sel.id);
      break;
    case 'chip':
      // action_chips has no slice — mutate baseConfig in place (immer middleware).
      useConfigStore.setState((state) => {
        const chips = state.config.baseConfig?.action_chips?.default_chips;
        if (chips) delete chips[sel.id];
        state.config.isDirty = true;
      });
      break;
  }
}
