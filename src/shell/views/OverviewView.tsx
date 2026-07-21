/**
 * Overview view — one dense screen grouping every entity type for the loaded
 * tenant (Calls to action · Forms · Programs · Routing · Showcase). Reads the
 * config store directly; clicking any row selects it (opens the Inspector);
 * "+ New" opens the create drawer. Design handoff §1 Overview.
 */

import React from 'react';
import { Plus, ChevronRight, TriangleAlert, MessageSquare, FileText, Layers } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { CTADefinition, ConversationalForm, Program, ActionChip, ConversationBranch, ShowcaseItem } from '@/types/config';
import { useShellStore, type EntityKind } from '../shellStore';
import { useTenantSummary, useEntityCounts } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';
import { RoutingChips } from './RoutingChips';

export function OverviewView() {
  const tenant = useTenantSummary();
  const counts = useEntityCounts();
  const warningCount = useConfigStore(
    (s) => Object.values(s.validation.warnings).reduce((n, arr) => n + (arr?.length ?? 0), 0),
  );

  if (!tenant.loaded) return <EmptyTenantState />;

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
      {/* Health strip */}
      <div className="flex flex-wrap items-center gap-3" style={{ fontSize: '11.5px' }}>
        <span className="rounded-full px-2.5 py-1 font-semibold" style={{ background: '#E9F7EF', color: '#1C7A45' }}>
          Config valid
        </span>
        {warningCount > 0 && (
          <ValidationChip count={warningCount} />
        )}
        <span style={{ color: '#64748B' }}>
          {counts.nodes} nodes · {counts.forms + counts.ctas + counts.branches} connections
        </span>
        <span style={{ color: tenant.messengerOn ? '#1C7A45' : '#94A3B8' }}>
          Messenger {tenant.messengerOn ? 'on' : 'off'}
        </span>
        <span style={{ color: '#94A3B8' }}>
          v{tenant.version} · {tenant.tier}
        </span>
      </div>

      <CTASection />
      <FormsSection />
      <ProgramsSection />
      <RoutingSection />
      <ShowcaseSection />
    </div>
  );
}

function ValidationChip({ count }: { count: number }) {
  const toggleOverlay = useShellStore((s) => s.toggleOverlay);
  return (
    <button
      type="button"
      onClick={() => toggleOverlay('validationPopover')}
      className="flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
      style={{ background: '#FEF3C7', color: '#92400E' }}
    >
      <TriangleAlert size={11} /> {count} {count === 1 ? 'warning' : 'warnings'}
    </button>
  );
}

// ── Section chrome ─────────────────────────────────────────────────────────

function Section({
  title,
  count,
  descriptor,
  kind,
  children,
}: {
  title: string;
  count: number;
  descriptor: string;
  kind: EntityKind;
  children: React.ReactNode;
}) {
  const openEditor = useShellStore((s) => s.openEditor);
  return (
    <section className="rounded-card border bg-white" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="font-bold" style={{ fontSize: '14px', color: '#0F172A' }}>
          {title}
        </h2>
        <span
          className="rounded-full px-1.5 font-bold"
          style={{ background: '#EEF2F6', color: '#475569', fontSize: '10px' }}
        >
          {count}
        </span>
        <span className="flex-1 truncate" style={{ fontSize: '11px', color: '#94A3B8' }}>
          {descriptor}
        </span>
        <button
          type="button"
          onClick={() => openEditor(kind, null)}
          className="flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold hover:bg-slate-50"
          style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '10.5px' }}
        >
          <Plus size={12} /> New
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ kind, id, children }: { kind: EntityKind; id: string; children: React.ReactNode }) {
  const select = useShellStore((s) => s.select);
  const selection = useShellStore((s) => s.selection);
  const selected = selection?.kind === kind && selection.id === id;
  return (
    <button
      type="button"
      onClick={() => select({ kind, id })}
      className="flex w-full items-center gap-3 border-t px-4 py-2.5 text-left transition-colors"
      style={{ borderColor: '#F1F5F9', background: selected ? '#F7FDFA' : 'transparent' }}
    >
      {children}
      <ChevronRight size={14} className="flex-shrink-0 text-slate-300" />
    </button>
  );
}

function IconTile({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-tile"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono" style={{ fontSize: '11px', color: '#64748B' }}>
      {children}
    </span>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="border-t px-4 py-6 text-center" style={{ borderColor: '#F1F5F9', fontSize: '11.5px', color: '#94A3B8' }}>
      {label}
    </div>
  );
}

// ── CTA section ────────────────────────────────────────────────────────────

const CTA_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  start_form: { label: 'FORM', bg: '#E9F7EF', color: '#1C7A45' },
  external_link: { label: 'LINK', bg: '#F1F5F9', color: '#475569' },
  send_query: { label: 'QUERY', bg: '#FEF3C7', color: '#92400E' },
  show_info: { label: 'INFO', bg: '#EFF6FF', color: '#1e40af' },
  start_scheduling: { label: 'SCHED', bg: '#EFF6FF', color: '#1e40af' },
  resume_scheduling: { label: 'SCHED', bg: '#EFF6FF', color: '#1e40af' },
};

function ctaTarget(cta: CTADefinition, formTitle: (id: string) => string): string {
  switch (cta.action) {
    case 'start_form':
      return cta.formId ? `→ ${formTitle(cta.formId)}` : '→ (no form)';
    case 'external_link':
      return cta.url || '(no url)';
    case 'send_query':
      return cta.query || '(no query)';
    case 'show_info':
      return cta.prompt || '(no prompt)';
    default:
      return '';
  }
}

function CTASection() {
  const ctas = useConfigStore((s) => s.ctas.ctas) as Record<string, CTADefinition>;
  const forms = useConfigStore((s) => s.forms.forms) as Record<string, ConversationalForm>;
  const formTitle = (id: string) => forms[id]?.title || id;
  const entries = Object.entries(ctas);

  return (
    <Section title="Calls to action" count={entries.length} descriptor="Buttons the AI can offer" kind="cta">
      {entries.length === 0 ? (
        <EmptyRow label="No CTAs yet. Create one to give the AI something to offer." />
      ) : (
        entries.map(([id, cta]) => {
          const badge = CTA_BADGE[cta.action] ?? { label: 'CTA', bg: '#F1F5F9', color: '#475569' };
          return (
            <Row key={id} kind="cta" id={id}>
              <IconTile bg="#E9F7EF" color="#1C7A45"><MessageSquare size={13} /></IconTile>
              <span className="w-[180px] flex-shrink-0 truncate font-semibold" style={{ fontSize: '12.5px' }}>
                {cta.label || id}
              </span>
              <Key>{id}</Key>
              <span
                className="rounded px-1.5 py-0.5 font-bold uppercase"
                style={{ background: badge.bg, color: badge.color, fontSize: '9.5px', letterSpacing: '.04em' }}
              >
                {badge.label}
              </span>
              <span className="min-w-0 flex-1 truncate" style={{ fontSize: '11px', color: '#64748B' }}>
                {ctaTarget(cta, formTitle)}
              </span>
              {cta.ai_available && (
                <span title="In AI selection pool" className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: '#50C878' }} />
              )}
            </Row>
          );
        })
      )}
    </Section>
  );
}

// ── Forms section ──────────────────────────────────────────────────────────

function FormsSection() {
  const forms = useConfigStore((s) => s.forms.forms) as Record<string, ConversationalForm>;
  const programs = useConfigStore((s) => s.programs.programs) as Record<string, Program>;
  const entries = Object.entries(forms);

  return (
    <Section title="Forms" count={entries.length} descriptor="Conversational data collection" kind="form">
      {entries.length === 0 ? (
        <EmptyRow label="No forms yet." />
      ) : (
        entries.map(([id, form]) => {
          const fields = form.fields ?? [];
          const required = fields.filter((f) => f.required).length;
          const programName = form.program ? programs[form.program]?.program_name : undefined;
          return (
            <Row key={id} kind="form" id={id}>
              <IconTile bg="#EFF6FF" color="#2563EB"><FileText size={13} /></IconTile>
              <span className="w-[180px] flex-shrink-0 truncate font-semibold" style={{ fontSize: '12.5px' }}>
                {form.title || id}
              </span>
              <Key>{id}</Key>
              {programName && (
                <span className="rounded-full px-2 py-0.5" style={{ background: '#EEF2F6', color: '#475569', fontSize: '10px' }}>
                  {programName}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate" style={{ fontSize: '11px', color: '#64748B' }}>
                {fields.length} {fields.length === 1 ? 'field' : 'fields'} · {required} required
              </span>
              {required === 0 && fields.length > 0 && (
                <TriangleAlert size={13} className="flex-shrink-0" style={{ color: '#F59E0B' }} />
              )}
            </Row>
          );
        })
      )}
    </Section>
  );
}

// ── Programs section ───────────────────────────────────────────────────────

function ProgramsSection() {
  const programs = useConfigStore((s) => s.programs.programs) as Record<string, Program>;
  const forms = useConfigStore((s) => s.forms.forms) as Record<string, ConversationalForm>;
  const openEditor = useShellStore((s) => s.openEditor);
  const select = useShellStore((s) => s.select);
  const selection = useShellStore((s) => s.selection);
  const entries = Object.entries(programs);

  const formsFeedingIn = (programId: string) => Object.values(forms).filter((f) => f.program === programId).length;

  return (
    <section className="rounded-card border bg-white" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="font-bold" style={{ fontSize: '14px', color: '#0F172A' }}>Programs</h2>
        <span className="rounded-full px-1.5 font-bold" style={{ background: '#EEF2F6', color: '#475569', fontSize: '10px' }}>
          {entries.length}
        </span>
        <span className="flex-1 truncate" style={{ fontSize: '11px', color: '#94A3B8' }}>Top-level offerings</span>
        <button
          type="button"
          onClick={() => openEditor('program', null)}
          className="flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold hover:bg-slate-50"
          style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '10.5px' }}
        >
          <Plus size={12} /> New
        </button>
      </div>
      {entries.length === 0 ? (
        <EmptyRow label="No programs yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: '#F1F5F9' }}>
          {entries.map(([id, program]) => {
            const selected = selection?.kind === 'program' && selection.id === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => select({ kind: 'program', id })}
                className="flex flex-col rounded-tile border p-3 text-left transition-colors"
                style={{ borderColor: selected ? '#50C878' : '#E2E8F0', background: selected ? '#F7FDFA' : '#fff' }}
              >
                <span className="truncate font-semibold" style={{ fontSize: '12.5px', color: '#0F172A' }}>
                  {program.program_name || id}
                </span>
                <span className="mt-0.5 font-mono truncate" style={{ fontSize: '10px', color: '#94A3B8' }}>{id}</span>
                <span className="mt-1.5 line-clamp-2" style={{ fontSize: '11px', color: '#64748B' }}>
                  {program.description || 'No description'}
                </span>
                <span className="mt-2 font-semibold" style={{ fontSize: '10.5px', color: '#1C7A45' }}>
                  {formsFeedingIn(id)} forms feed in
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Routing section (chips + branches) ─────────────────────────────────────

function RoutingSection() {
  const chips = useConfigStore((s) => s.config.baseConfig?.action_chips?.default_chips ?? {}) as Record<string, ActionChip>;
  const branches = useConfigStore((s) => s.branches.branches) as Record<string, ConversationBranch>;
  const select = useShellStore((s) => s.select);
  const selection = useShellStore((s) => s.selection);
  const openEditor = useShellStore((s) => s.openEditor);
  const chipEntries = Object.entries(chips);
  const branchEntries = Object.entries(branches);

  const isSel = (kind: EntityKind, id: string) => selection?.kind === kind && selection.id === id;

  return (
    <section className="rounded-card border bg-white" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="font-bold" style={{ fontSize: '14px', color: '#0F172A' }}>Routing</h2>
        <span className="flex-1 truncate" style={{ fontSize: '11px', color: '#94A3B8' }}>
          Welcome-screen chips and conversation branches
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 border-t p-4 md:grid-cols-2" style={{ borderColor: '#F1F5F9' }}>
        {/* Chips */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold uppercase" style={{ fontSize: '10px', color: '#64748B', letterSpacing: '.06em' }}>
              Action chips · {chipEntries.length}
            </span>
            <button type="button" onClick={() => openEditor('chip', null)} className="font-semibold" style={{ fontSize: '10.5px', color: '#1C7A45' }}>
              + Add chip
            </button>
          </div>
          {chipEntries.length === 0 ? (
            <div className="rounded-tile border border-dashed p-4 text-center" style={{ borderColor: '#E2E8F0', fontSize: '11px', color: '#94A3B8' }}>
              Quick-action chips shown on the welcome screen.
            </div>
          ) : (
            <RoutingChips chips={chips} />
          )}
        </div>

        {/* Branches */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold uppercase" style={{ fontSize: '10px', color: '#64748B', letterSpacing: '.06em' }}>
              Branches · {branchEntries.length}
            </span>
            <button type="button" onClick={() => openEditor('branch', null)} className="font-semibold" style={{ fontSize: '10.5px', color: '#1C7A45' }}>
              + Add branch
            </button>
          </div>
          {branchEntries.length === 0 ? (
            <div className="rounded-tile border border-dashed p-4 text-center" style={{ borderColor: '#E2E8F0', fontSize: '11px', color: '#94A3B8' }}>
              Guided multi-CTA conversation paths.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {branchEntries.map(([id, branch]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => select({ kind: 'branch', id })}
                  className="flex flex-col rounded-tile border px-2.5 py-2 text-left"
                  style={{ borderColor: isSel('branch', id) ? '#50C878' : '#E2E8F0', background: isSel('branch', id) ? '#F7FDFA' : '#fff' }}
                >
                  <span className="truncate font-mono font-semibold" style={{ fontSize: '11px', color: '#0F172A' }}>{id}</span>
                  {branch.description && (
                    <span className="truncate" style={{ fontSize: '10.5px', color: '#64748B' }}>{branch.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Showcase section ───────────────────────────────────────────────────────

function ShowcaseSection() {
  const showcase = useConfigStore((s) => s.contentShowcase.content_showcase) as ShowcaseItem[];

  return (
    <Section title="Showcase items" count={showcase.length} descriptor="Digital flyers / featured content" kind="showcase">
      {showcase.length === 0 ? (
        <EmptyRow label="No showcase items yet." />
      ) : (
        showcase.map((item) => (
          <Row key={item.id} kind="showcase" id={item.id}>
            <IconTile bg="#E9F7EF" color="#1C7A45"><Layers size={13} /></IconTile>
            <span className="w-[180px] flex-shrink-0 truncate font-semibold" style={{ fontSize: '12.5px' }}>{item.name || item.id}</span>
            <span className="min-w-0 flex-1 truncate" style={{ fontSize: '11px', color: '#64748B' }}>
              {item.tagline || (item.keywords ?? []).join(', ')}
            </span>
          </Row>
        ))
      )}
    </Section>
  );
}
