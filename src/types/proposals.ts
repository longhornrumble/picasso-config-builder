/**
 * KB-freshness proposal types.
 * Mirrors the schema produced by `picasso-webscraping/rag-scraper/scanner/agent-runner.ts`
 * and documented in `picasso-webscraping/rag-scraper/skills/kb-proposal/SKILL.md`.
 */

export type ProposalItemType =
  | 'new_event'
  | 'new_staff'
  | 'new_content'
  | 'page_edit'
  | 'stale_event'
  | 'stale_content';

export type ProposalSeverity = 'high' | 'medium' | 'low';

export type ProposalStatus =
  | 'pending'
  | 'applied'
  | 'partial_apply_error'
  | 'rejected';

export interface KbAppendOp {
  verb: 'kb.append';
  afterMarker: string;
  sourceMarker: string;
  markdown: string;
}

export interface KbReplaceOp {
  verb: 'kb.replace';
  sourceMarker: string;
  markdown: string;
}

export interface KbRemoveOp {
  verb: 'kb.remove';
  sourceMarker: string;
}

export interface ConfigAddOp {
  verb: 'config.add';
  path: string;
  value: Record<string, unknown>;
}

export interface ConfigDeleteOp {
  verb: 'config.delete';
  path: string;
  matchBy: string;
  matchValue: string;
}

export interface ConfigAppendToArrayOp {
  verb: 'config.append_to_array';
  path: string;
  value: string;
}

export interface DubUpsertOp {
  verb: 'dub.upsert';
  externalId: string;
  url: string;
  slug: string;
}

export type ProposalOperation =
  | KbAppendOp
  | KbReplaceOp
  | KbRemoveOp
  | ConfigAddOp
  | ConfigDeleteOp
  | ConfigAppendToArrayOp
  | DubUpsertOp;

export interface ProposalItem {
  id: string;
  type: ProposalItemType;
  sourceUrl?: string;
  severity?: ProposalSeverity;
  rationale?: string;
  operations: ProposalOperation[];
  applicationResult?: {
    status: 'applied' | 'error';
    error?: string;
  } | null;
}

export interface ProposalSummary {
  additions: number;
  edits: number;
  retirements: number;
  skipped: number;
}

export interface Proposal {
  proposalId: string;
  tenantId: string;
  createdAt: string;
  status: ProposalStatus;
  siteUrl: string;
  summary: ProposalSummary;
  applicationResult: unknown | null;
  items: ProposalItem[];
  inventorySnapshotUpdate?: string[];
  skipped?: Array<{ url?: string; id?: string; reason: string }>;
  dryRun?: boolean;
}
