/**
 * PendingChangesPage
 *
 * Read-only list of pending KB-freshness proposals for the current tenant.
 * Phase 2 of the KB Freshness + Content Lifecycle System — displays what
 * the scanner has proposed. Approve/reject/apply ships in Phase 3.
 *
 * See docs/roadmap/KB_FRESHNESS_LIFECYCLE_SYSTEM.md for schema + context.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge, Button, Spinner, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { configApiClient } from '@/lib/api/client';
import { listTenants } from '@/lib/api';
import { useConfigStore } from '@/store';
import type { Proposal, ProposalItem, ProposalOperation } from '@/types/proposals';

export const PendingChangesPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const loadConfig = useConfigStore((state) => state.config.loadConfig);
  const [searchParams] = useSearchParams();
  // Deep links from Slack/email MUST carry tenant hash only — never tenant ID.
  // Per internal security policy: tenant IDs are never exposed in open surfaces
  // (Slack, email, URLs that could leak). The hash maps 1:1 to a tenant and is
  // resolved server-side via the tenant list endpoint — no new API surface needed.
  const deepLinkHash = searchParams.get('h') || undefined;
  const deepLinkProposal = searchParams.get('proposal') || undefined;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve `?h=HASH` against the tenant list and switch tenant if needed. Runs once
  // per `deepLinkHash` value — the guard ref prevents re-resolution as the store
  // settles. Requires the Lambda's `getTenantMetadata` to return `tenant_hash`.
  const resolvedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!deepLinkHash) return;
    if (resolvedFor.current === deepLinkHash) return;
    resolvedFor.current = deepLinkHash;

    listTenants()
      .then((list) => {
        const match = (list || []).find((t) => t.tenant_hash === deepLinkHash);
        if (!match) {
          setError('Deep link references an unknown tenant hash. Check with whoever shared the link.');
          return;
        }
        if (match.tenantId === tenantId) return;
        return loadConfig(match.tenantId);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to resolve deep-link tenant');
      });
  }, [deepLinkHash, tenantId, loadConfig]);

  const load = React.useCallback(async () => {
    if (!tenantId) {
      setProposals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await configApiClient.listProposals(tenantId);
      setProposals(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // After proposals load, scroll the deep-linked proposal into view + highlight it.
  // The element has id={proposalId}; we rely on the ProposalCard to render that id.
  // scrollIntoView is feature-detected — JSDOM (tests) doesn't implement it.
  useEffect(() => {
    if (!deepLinkProposal || proposals.length === 0) return;
    const el = document.getElementById(deepLinkProposal);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [deepLinkProposal, proposals]);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>No tenant selected</AlertTitle>
          <AlertDescription>
            Select a tenant from the Home page to see its pending KB-freshness proposals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader tenantId={tenantId} count={proposals.length} />
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Couldn't load proposals</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && proposals.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {!loading && !error && proposals.length === 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">No pending proposals</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The scanner will post here when it detects material KB changes.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {proposals.map((p) => (
          <ProposalCard
            key={p.proposalId}
            proposal={p}
            highlighted={deepLinkProposal === p.proposalId}
          />
        ))}
      </div>
    </div>
  );
};

const PageHeader: React.FC<{ tenantId?: string; count?: number }> = ({ tenantId, count }) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
      <ClipboardList className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      Pending Changes
    </h1>
    {tenantId && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {count ?? 0} proposal{count === 1 ? '' : 's'} for {tenantId}
      </p>
    )}
  </div>
);

const ProposalCard: React.FC<{ proposal: Proposal; highlighted?: boolean }> = ({ proposal, highlighted = false }) => {
  const { summary } = proposal;
  const created = new Date(proposal.createdAt).toLocaleString();

  // `id` on the wrapper lets the page's scroll-into-view effect target this card
  // after a deep-link load. The ring is a visual cue for the linked-to proposal.
  return (
    <div
      id={proposal.proposalId}
      className={`rounded-lg border bg-white dark:bg-gray-800 overflow-hidden transition-shadow ${
        highlighted
          ? 'border-teal-500 ring-2 ring-teal-400 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="px-5 py-3 bg-teal-50 dark:bg-teal-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {proposal.siteUrl}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {proposal.proposalId} · {created}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary.additions > 0 && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              {summary.additions} addition{summary.additions === 1 ? '' : 's'}
            </Badge>
          )}
          {summary.edits > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              {summary.edits} edit{summary.edits === 1 ? '' : 's'}
            </Badge>
          )}
          {summary.retirements > 0 && (
            <Badge className="bg-rose-100 text-rose-800 border-rose-200">
              {summary.retirements} retirement{summary.retirements === 1 ? '' : 's'}
            </Badge>
          )}
          {summary.skipped > 0 && (
            <Badge variant="secondary">{summary.skipped} skipped</Badge>
          )}
        </div>
      </div>

      {proposal.items.length === 0 ? (
        <div className="p-5 text-sm text-gray-500 dark:text-gray-400 italic">
          No items — heartbeat proposal (inventory only).
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {proposal.items.map((item) => (
            <ProposalItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProposalItemRow: React.FC<{ item: ProposalItem }> = ({ item }) => {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
            <span>{titleForItem(item)}</span>
            <TypeChip type={item.type} />
            {item.severity && <SeverityChip severity={item.severity} />}
          </div>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline break-all"
            >
              → {item.sourceUrl}
            </a>
          )}
          {item.rationale && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.rationale}</p>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {item.operations.map((op, idx) => (
          <OperationPreview key={idx} op={op} />
        ))}
      </div>
    </div>
  );
};

const TypeChip: React.FC<{ type: ProposalItem['type'] }> = ({ type }) => {
  const classes = typeChipClass(type);
  const label = type.replace(/_/g, ' ');
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
};

const SeverityChip: React.FC<{ severity: 'high' | 'medium' | 'low' }> = ({ severity }) => {
  const color =
    severity === 'high'
      ? 'bg-rose-100 text-rose-800'
      : severity === 'medium'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {severity}
    </span>
  );
};

const OperationPreview: React.FC<{ op: ProposalOperation }> = ({ op }) => {
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-sm">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">
        {op.verb}
      </div>
      <OperationBody op={op} />
    </div>
  );
};

const OperationBody: React.FC<{ op: ProposalOperation }> = ({ op }) => {
  switch (op.verb) {
    case 'kb.append':
      return (
        <>
          <div className="text-xs text-gray-500 mb-1">
            after <code>{op.afterMarker}</code>
          </div>
          <pre className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {op.markdown}
          </pre>
        </>
      );
    case 'kb.replace':
      return (
        <>
          <div className="text-xs text-gray-500 mb-1">
            replaces section at <code>{op.sourceMarker}</code>
          </div>
          <pre className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {op.markdown}
          </pre>
        </>
      );
    case 'kb.remove':
      return (
        <div className="text-xs text-gray-700 dark:text-gray-300">
          remove section at <code>{op.sourceMarker}</code>
        </div>
      );
    case 'config.add':
      return (
        <>
          <div className="text-xs text-gray-500 mb-1">
            add to <code>{op.path}</code>
          </div>
          <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(op.value, null, 2)}
          </pre>
        </>
      );
    case 'config.delete':
      return (
        <div className="text-xs text-gray-700 dark:text-gray-300">
          delete from <code>{op.path}</code> where <code>{op.matchBy}</code> =
          <code> {op.matchValue}</code>
        </div>
      );
    case 'config.append_to_array':
      return (
        <div className="text-xs text-gray-700 dark:text-gray-300">
          append <code>{op.value}</code> to <code>{op.path}</code>
        </div>
      );
    case 'dub.upsert':
      return (
        <div className="text-xs text-gray-700 dark:text-gray-300">
          shortlink <code>{op.slug}</code> → <code>{op.url}</code>
        </div>
      );
    default:
      return (
        <pre className="text-xs overflow-x-auto">{JSON.stringify(op, null, 2)}</pre>
      );
  }
};

function titleForItem(item: ProposalItem): string {
  switch (item.type) {
    case 'new_event':
      return 'New event';
    case 'new_staff':
      return 'New staff member';
    case 'new_content':
      return 'New content';
    case 'page_edit':
      return 'Page edit';
    case 'stale_event':
      return 'Retire expired event';
    case 'stale_content':
      return 'Retire stale content';
    default:
      return item.type;
  }
}

function typeChipClass(type: ProposalItem['type']): string {
  if (type.startsWith('new')) return 'bg-emerald-100 text-emerald-800';
  if (type === 'page_edit') return 'bg-amber-100 text-amber-800';
  if (type.startsWith('stale')) return 'bg-rose-100 text-rose-800';
  return 'bg-gray-100 text-gray-800';
}
