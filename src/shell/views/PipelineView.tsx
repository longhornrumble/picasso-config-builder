/**
 * Pipeline view — chips → branches → CTAs → forms → programs as a left-to-right
 * flow. Clicking a node selects it and lights its connected route (following
 * references); everything else dims. Design handoff §2 Pipeline.
 *
 * (Chip drag-reorder within the pipeline is deferred to a follow-up; reorder is
 * available where chips are managed. The flow + route highlighting are here.)
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { CTADefinition, ConversationalForm, Program, ActionChip, ConversationBranch } from '@/types/config';
import { useShellStore, type EntityKind } from '../shellStore';
import { useTenantSummary } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';

const nodeKey = (kind: EntityKind, id: string) => `${kind}:${id}`;

interface ColNode {
  id: string;
  name: string;
  sub?: string;
}

export function PipelineView() {
  const tenant = useTenantSummary();
  const chips = useConfigStore((s) => s.config.baseConfig?.action_chips?.default_chips ?? {}) as Record<string, ActionChip>;
  const branches = useConfigStore((s) => s.branches.branches) as Record<string, ConversationBranch>;
  const ctas = useConfigStore((s) => s.ctas.ctas) as Record<string, CTADefinition>;
  const forms = useConfigStore((s) => s.forms.forms) as Record<string, ConversationalForm>;
  const programs = useConfigStore((s) => s.programs.programs) as Record<string, Program>;

  const selection = useShellStore((s) => s.selection);
  const select = useShellStore((s) => s.select);
  const clearSelection = useShellStore((s) => s.clearSelection);

  // Build undirected adjacency across entity references.
  const adjacency = React.useMemo(() => {
    const adj = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    };
    for (const [id, chip] of Object.entries(chips)) {
      if (chip.target_branch && branches[chip.target_branch]) link(nodeKey('chip', id), nodeKey('branch', chip.target_branch));
    }
    for (const [id, br] of Object.entries(branches)) {
      const cs = [br.available_ctas?.primary, ...(br.available_ctas?.secondary ?? [])].filter(Boolean) as string[];
      cs.forEach((c) => { if (ctas[c]) link(nodeKey('branch', id), nodeKey('cta', c)); });
    }
    for (const [id, cta] of Object.entries(ctas)) {
      if (cta.formId && forms[cta.formId]) link(nodeKey('cta', id), nodeKey('form', cta.formId));
      if (cta.target_branch && branches[cta.target_branch]) link(nodeKey('cta', id), nodeKey('branch', cta.target_branch));
      if (cta.program_id && programs[cta.program_id]) link(nodeKey('cta', id), nodeKey('program', cta.program_id));
    }
    for (const [id, form] of Object.entries(forms)) {
      if (form.program && programs[form.program]) link(nodeKey('form', id), nodeKey('program', form.program));
    }
    return adj;
  }, [chips, branches, ctas, forms, programs]);

  // Reachable set from the selected node (undirected BFS).
  const highlighted = React.useMemo(() => {
    if (!selection) return null;
    const start = nodeKey(selection.kind, selection.id);
    const seen = new Set<string>([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of adjacency.get(cur) ?? []) {
        if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
      }
    }
    return seen;
  }, [selection, adjacency]);

  if (!tenant.loaded) return <EmptyTenantState />;

  const columns: { kind: EntityKind; header: string; width: number; nodes: ColNode[] }[] = [
    { kind: 'chip', header: 'Action chips', width: 168, nodes: Object.entries(chips).map(([id, c]) => ({ id, name: c.label || id, sub: c.target_branch ? `→ ${c.target_branch}` : undefined })) },
    { kind: 'branch', header: 'Branches', width: 180, nodes: Object.entries(branches).map(([id, b]) => ({ id, name: id, sub: b.description })) },
    { kind: 'cta', header: 'CTAs', width: 200, nodes: Object.entries(ctas).map(([id, c]) => ({ id, name: c.label || id, sub: c.action })) },
    { kind: 'form', header: 'Forms', width: 200, nodes: Object.entries(forms).map(([id, f]) => ({ id, name: f.title || id, sub: `${(f.fields ?? []).length} fields` })) },
    { kind: 'program', header: 'Programs', width: 180, nodes: Object.entries(programs).map(([id, p]) => ({ id, name: p.program_name || id, sub: id })) },
  ];

  const isLit = (kind: EntityKind, id: string) => !highlighted || highlighted.has(nodeKey(kind, id));

  return (
    <div className="flex h-full flex-col">
      {selection && (
        <div className="mb-3">
          <button type="button" onClick={clearSelection} className="font-semibold" style={{ fontSize: '11px', color: '#1C7A45' }}>
            Clear selection
          </button>
        </div>
      )}
      <div className="cb-scroll flex flex-1 items-start gap-2 overflow-x-auto pb-4">
        {columns.map((col, ci) => (
          <React.Fragment key={col.kind}>
            <div style={{ width: col.width, flexShrink: 0 }}>
              <div className="mb-2 flex items-center gap-1.5 uppercase" style={{ fontSize: '10px', color: '#64748B', letterSpacing: '.06em' }}>
                {col.header}
                <span className="rounded-full px-1 font-bold" style={{ background: '#EEF2F6', color: '#475569', fontSize: '9px' }}>{col.nodes.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.nodes.length === 0 ? (
                  <div className="rounded-tile border border-dashed p-3 text-center" style={{ borderColor: '#E2E8F0', fontSize: '10.5px', color: '#94A3B8' }}>
                    None
                  </div>
                ) : (
                  col.nodes.map((n) => {
                    const lit = isLit(col.kind, n.id);
                    const isSelected = selection?.kind === col.kind && selection.id === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => select({ kind: col.kind, id: n.id })}
                        className="rounded-tile border bg-white p-2.5 text-left transition-opacity"
                        style={{
                          opacity: lit ? 1 : 0.45,
                          borderColor: isSelected ? '#50C878' : lit && highlighted ? '#50C878' : '#E2E8F0',
                          borderWidth: isSelected ? 2 : 1,
                          background: lit && highlighted ? '#F7FDFA' : '#fff',
                          boxShadow: isSelected ? '0 4px 14px rgba(80,200,120,.25)' : 'none',
                        }}
                      >
                        <div className="truncate font-semibold" style={{ fontSize: '11.5px', color: '#0F172A' }}>{n.name}</div>
                        {n.sub && <div className="truncate" style={{ fontSize: '10px', color: '#94A3B8' }}>{n.sub}</div>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            {ci < columns.length - 1 && (
              <div className="flex flex-shrink-0 items-center self-stretch pt-8">
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
