/**
 * Global search (⌘/ or top-bar icon). Command palette over every entity type
 * (name + key); selecting a result switches to Overview and opens its Inspector.
 * Design handoff §Overlays "Global search".
 */

import React from 'react';
import { useConfigStore } from '@/store';
import { useShellStore, type EntityKind } from '../shellStore';
import { CommandPalette, type PaletteItem } from '../CommandPalette';

const KIND_LABEL: Record<EntityKind, string> = {
  cta: 'CTA',
  form: 'FORM',
  program: 'PROGRAM',
  branch: 'BRANCH',
  chip: 'CHIP',
  showcase: 'SHOWCASE',
};

export function GlobalSearch() {
  const open = useShellStore((s) => s.overlays.globalSearch);
  const closeOverlay = useShellStore((s) => s.closeOverlay);
  const setView = useShellStore((s) => s.setView);
  const select = useShellStore((s) => s.select);

  const ctas = useConfigStore((s) => s.ctas.ctas);
  const forms = useConfigStore((s) => s.forms.forms);
  const programs = useConfigStore((s) => s.programs.programs);
  const branches = useConfigStore((s) => s.branches.branches);
  const showcase = useConfigStore((s) => s.contentShowcase.content_showcase);
  const chips = useConfigStore((s) => s.config.baseConfig?.action_chips?.default_chips ?? {});

  const results = React.useMemo(() => {
    const rows: { kind: EntityKind; id: string; name: string }[] = [];
    Object.entries(ctas).forEach(([id, c]) => rows.push({ kind: 'cta', id, name: c.label || id }));
    Object.entries(forms).forEach(([id, f]) => rows.push({ kind: 'form', id, name: f.title || id }));
    Object.entries(programs).forEach(([id, p]) => rows.push({ kind: 'program', id, name: p.program_name || id }));
    Object.entries(branches).forEach(([id]) => rows.push({ kind: 'branch', id, name: id }));
    Object.entries(chips).forEach(([id, c]) => rows.push({ kind: 'chip', id, name: c.label || id }));
    showcase.forEach((i) => rows.push({ kind: 'showcase', id: i.id, name: i.name || i.id }));
    return rows;
  }, [ctas, forms, programs, branches, chips, showcase]);

  const items: PaletteItem[] = results.map((r) => ({
    id: `${r.kind}:${r.id}`,
    haystack: `${r.name} ${r.id} ${KIND_LABEL[r.kind]}`,
    render: (
      <>
        <span className="w-[78px] flex-shrink-0 rounded-full px-2 py-0.5 text-center font-bold uppercase" style={{ background: '#E9F7EF', color: '#1C7A45', fontSize: '9px', letterSpacing: '.04em' }}>
          {KIND_LABEL[r.kind]}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold" style={{ fontSize: '12.5px', color: '#0F172A' }}>{r.name}</span>
        <span className="font-mono" style={{ fontSize: '10.5px', color: '#64748B' }}>{r.id}</span>
      </>
    ),
  }));

  return (
    <CommandPalette
      open={open}
      onClose={() => closeOverlay('globalSearch')}
      placeholder="Search CTAs, forms, programs, branches, chips, showcase…"
      items={items}
      onSelect={(compositeId) => {
        const [kind, ...rest] = compositeId.split(':');
        const id = rest.join(':');
        setView('overview');
        select({ kind: kind as EntityKind, id });
      }}
      footer={<><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></>}
    />
  );
}
