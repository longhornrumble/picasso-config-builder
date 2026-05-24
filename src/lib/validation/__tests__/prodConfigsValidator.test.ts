/**
 * prodConfigsValidator tests — closes audit blockers B9 (0% coverage on
 * CI-2 gate logic) and R10 (Rec-4 no-message-leak regression guard).
 *
 * Audit source: project_scheduling_subphase_a_phase_completion_audit_2026-05-24.
 *
 * The Rec-4 invariant — issues only carry { path, code } — is the load-bearing
 * security property of CI-2: superRefine messages in tenant.schema.ts embed
 * operator-configured strings (program IDs, form IDs). If those flow into CI
 * logs or artifacts, the gate becomes its own data-exfiltration channel.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  fetchAndValidate,
  parseTenantIdsFromCommonPrefixes,
  runProdConfigsValidation,
  S3FetchError,
  type S3Reader,
  type ValidationResult,
} from '../prodConfigsValidator';

// Minimal valid tenant body — anything missing here would surface as
// schema_failed and the Rec-4 leak test wouldn't isolate well.
const validTenantBody = JSON.stringify({
  tenant_id: 'TEST123',
  tenant_hash: 'abc123def456',
  subscription_tier: 'Standard',
  chat_title: 'Test Bot',
  tone_prompt: 'You are helpful.',
  welcome_message: 'Hi!',
  version: '1.5',
  generated_at: 1700000000,
  conversational_forms: {},
  cta_definitions: {},
  conversation_branches: {},
  branding: { primary_color: '#00AA88', font_family: 'Inter' },
  features: {
    uploads: false,
    photo_uploads: false,
    voice_input: false,
    streaming: true,
    callout: { enabled: false, auto_dismiss: false },
  },
  aws: { knowledge_base_id: 'KBABCDEFGH12', aws_region: 'us-east-1' },
});

function fakeS3(
  tenants: Record<string, string | Error>,
  tenantList?: string[],
): S3Reader {
  return {
    async listTenantIds() {
      return tenantList ?? Object.keys(tenants);
    },
    async fetchObjectBody(_bucket: string, key: string) {
      const match = key.match(/^tenants\/([^/]+)\/[^/]+-config\.json$/);
      const tenantId = match?.[1] ?? '';
      const entry = tenants[tenantId];
      if (entry === undefined) {
        throw new S3FetchError('not found', 'NoSuchKey');
      }
      if (entry instanceof Error) throw entry;
      return entry;
    },
  };
}

describe('parseTenantIdsFromCommonPrefixes', () => {
  it('extracts and sorts tenant IDs from CommonPrefixes payload', () => {
    const stdout = JSON.stringify({
      CommonPrefixes: [
        { Prefix: 'tenants/FOO/' },
        { Prefix: 'tenants/AAA/' },
        { Prefix: 'tenants/ZZZ/' },
      ],
    });
    expect(parseTenantIdsFromCommonPrefixes(stdout)).toEqual(['AAA', 'FOO', 'ZZZ']);
  });

  it('returns empty array when CommonPrefixes missing (empty bucket)', () => {
    expect(parseTenantIdsFromCommonPrefixes('{}')).toEqual([]);
  });

  it('skips empty IDs (defensive against malformed prefixes)', () => {
    const stdout = JSON.stringify({
      CommonPrefixes: [{ Prefix: 'tenants/' }, { Prefix: 'tenants/REAL/' }],
    });
    expect(parseTenantIdsFromCommonPrefixes(stdout)).toEqual(['REAL']);
  });
});

describe('fetchAndValidate', () => {
  it('returns ok=true for a tenant with valid config', async () => {
    const s3 = fakeS3({ TEST123: validTenantBody });
    const result = await fetchAndValidate(s3, 'my-bucket', 'TEST123');
    expect(result.ok).toBe(true);
  });

  it('returns fetch_failed with awsCode when S3 throws S3FetchError', async () => {
    const s3 = fakeS3({
      MISSING: new S3FetchError('not found', 'NoSuchKey'),
    });
    const result = await fetchAndValidate(s3, 'my-bucket', 'MISSING');
    expect(result).toEqual({
      tenantId: 'MISSING',
      ok: false,
      reason: 'fetch_failed',
      awsCode: 'NoSuchKey',
    });
  });

  it('returns fetch_failed with awsCode=null when S3 throws a non-S3FetchError', async () => {
    const s3 = fakeS3({ BROKEN: new Error('plain transport failure') });
    const result = await fetchAndValidate(s3, 'my-bucket', 'BROKEN');
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'fetch_failed') {
      expect(result.awsCode).toBeNull();
    } else {
      throw new Error('expected fetch_failed');
    }
  });

  it('returns invalid_json when body is not parseable', async () => {
    const s3 = fakeS3({ BADJSON: '{not-json' });
    const result = await fetchAndValidate(s3, 'my-bucket', 'BADJSON');
    expect(result).toEqual({ tenantId: 'BADJSON', ok: false, reason: 'invalid_json' });
  });

  it('returns schema_failed with issues having ONLY { path, code } (Rec-4 / audit R10)', async () => {
    // Tenant_id missing — superRefine will produce a message that embeds
    // identifying fields. The validator must strip it.
    const body = JSON.stringify({ tone_prompt: 'x', welcome_message: 'y' });
    const s3 = fakeS3({ BROKEN: body });
    const result = await fetchAndValidate(s3, 'my-bucket', 'BROKEN');
    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== 'schema_failed') {
      throw new Error('expected schema_failed');
    }
    expect(result.issues.length).toBeGreaterThan(0);
    for (const issue of result.issues) {
      // Rec-4 invariant: issues must NEVER carry a `message` field. If any
      // does, operator strings could leak from superRefine into CI logs.
      expect(Object.keys(issue).sort()).toEqual(['code', 'path']);
      expect((issue as Record<string, unknown>).message).toBeUndefined();
    }
  });
});

describe('runProdConfigsValidation', () => {
  it('runs all tenants in parallel and counts failures', async () => {
    const s3 = fakeS3({
      OK1: validTenantBody,
      OK2: validTenantBody,
      BAD: '{not-json',
    });
    const lines: string[] = [];
    const outcome = await runProdConfigsValidation({
      bucket: 'my-bucket',
      s3,
      log: (l) => lines.push(l),
    });
    expect(outcome.results.length).toBe(3);
    expect(outcome.failures).toBe(1);
    expect(lines.some((l) => l.includes('PASS  OK1'))).toBe(true);
    expect(lines.some((l) => l.includes('PASS  OK2'))).toBe(true);
    expect(lines.some((l) => l.includes('FAIL  BAD'))).toBe(true);
  });

  it('emits ONLY path=… code=… per issue on schema_failed — never the raw message (Rec-4 log surface)', async () => {
    const body = JSON.stringify({ welcome_message: 'x' });
    const s3 = fakeS3({ ONLYONE: body });
    const lines: string[] = [];
    await runProdConfigsValidation({
      bucket: 'my-bucket',
      s3,
      log: (l) => lines.push(l),
    });
    const issueLines = lines.filter((l) => l.trim().startsWith('path='));
    expect(issueLines.length).toBeGreaterThan(0);
    for (const line of issueLines) {
      // Each issue log line is exactly "        path=… code=…". No room for
      // a leaked message string.
      expect(line).toMatch(/^\s*path=[^\s]*\s+code=[^\s]+\s*$/);
    }
  });

  it('returns failures=0 when every tenant passes', async () => {
    const s3 = fakeS3({ ONLYONE: validTenantBody });
    const outcome = await runProdConfigsValidation({
      bucket: 'my-bucket',
      s3,
      log: () => {},
    });
    expect(outcome.failures).toBe(0);
  });

  it('default log callback is a no-op (does not throw)', async () => {
    const s3 = fakeS3({ ONLYONE: validTenantBody });
    await expect(
      runProdConfigsValidation({ bucket: 'my-bucket', s3 }),
    ).resolves.toBeDefined();
  });
});
