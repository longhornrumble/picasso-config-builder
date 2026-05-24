#!/usr/bin/env node
/**
 * CI-2: validate every prod tenant config against the live tenantConfigSchema.
 *
 * Runs in GitHub Actions on PRs that touch src/lib/schemas/**. Fetches each
 * tenant config from s3://${S3_BUCKET}/tenants/{ID}/{ID}-config.json, parses
 * it, and exits non-zero if any tenant fails schema validation.
 *
 * Security constraints (Rec-4 + threat-model T-09 considerations):
 *   - log only { path, code } per Zod issue
 *   - NEVER log error.format() / error.flatten() / issue.message — superRefine
 *     at tenant.schema.ts:283 embeds program-ID strings into messages
 *   - NEVER log raw config bytes (no JSON.parse error.message either — it
 *     includes a context byte from the source on failure)
 *   - NEVER store config as a CI artifact
 *
 * Design + apply checklist + threat model:
 *   ~/.claude/projects/.../memory/project_scheduling_subphase_a_ci2_phase0_design_2026-05-19.md
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tenantConfigSchema } from '../src/lib/schemas/tenant.schema';

const execFileP = promisify(execFile);

const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) {
  process.stderr.write('FATAL: S3_BUCKET env var is required\n');
  process.exit(2);
}

type ValidationResult =
  | { tenantId: string; ok: true }
  | { tenantId: string; ok: false; reason: 'fetch_failed'; awsCode: string | null }
  | { tenantId: string; ok: false; reason: 'invalid_json' }
  | { tenantId: string; ok: false; reason: 'schema_failed'; issues: Array<{ path: string; code: string }> };

async function listTenantIds(bucket: string): Promise<string[]> {
  const { stdout } = await execFileP('aws', [
    's3api', 'list-objects-v2',
    '--bucket', bucket,
    '--prefix', 'tenants/',
    '--delimiter', '/',
    '--output', 'json',
  ]);
  const parsed = JSON.parse(stdout) as { CommonPrefixes?: Array<{ Prefix: string }> };
  return (parsed.CommonPrefixes ?? [])
    .map((p) => p.Prefix.replace(/^tenants\//, '').replace(/\/$/, ''))
    .filter((id) => id.length > 0)
    .sort();
}

async function fetchAndValidate(bucket: string, tenantId: string): Promise<ValidationResult> {
  const key = `tenants/${tenantId}/${tenantId}-config.json`;

  let stdout: string;
  try {
    const result = await execFileP(
      'aws',
      ['s3', 'cp', `s3://${bucket}/${key}`, '-'],
      { maxBuffer: 16 * 1024 * 1024 }
    );
    stdout = result.stdout;
  } catch (e) {
    const stderr = (e as { stderr?: string }).stderr ?? '';
    const match = stderr.match(/\(([A-Z][A-Za-z]+)\)/);
    return { tenantId, ok: false, reason: 'fetch_failed', awsCode: match?.[1] ?? null };
  }

  let config: unknown;
  try {
    config = JSON.parse(stdout);
  } catch {
    return { tenantId, ok: false, reason: 'invalid_json' };
  }

  const result = tenantConfigSchema.safeParse(config);
  if (result.success) {
    return { tenantId, ok: true };
  }
  return {
    tenantId,
    ok: false,
    reason: 'schema_failed',
    issues: result.error.issues.map((i) => ({
      path: i.path.join('.'),
      code: i.code,
    })),
  };
}

async function main(): Promise<void> {
  process.stdout.write(`CI-2: validating prod tenant configs in s3://${S3_BUCKET}/tenants/\n`);

  const tenantIds = await listTenantIds(S3_BUCKET!);
  process.stdout.write(`Found ${tenantIds.length} tenant(s): ${tenantIds.join(', ')}\n`);
  if (tenantIds.length === 0) {
    process.stderr.write(`FATAL: no tenants found in s3://${S3_BUCKET}/tenants/\n`);
    process.exit(2);
  }

  const results = await Promise.all(tenantIds.map((id) => fetchAndValidate(S3_BUCKET!, id)));

  let failures = 0;
  for (const r of results) {
    if (r.ok) {
      process.stdout.write(`  PASS  ${r.tenantId}\n`);
      continue;
    }
    failures++;
    if (r.reason === 'fetch_failed') {
      process.stdout.write(`  FAIL  ${r.tenantId}  reason=fetch_failed  awsCode=${r.awsCode ?? '<none>'}\n`);
    } else if (r.reason === 'invalid_json') {
      process.stdout.write(`  FAIL  ${r.tenantId}  reason=invalid_json\n`);
    } else {
      process.stdout.write(`  FAIL  ${r.tenantId}  reason=schema_failed  issues=${r.issues.length}\n`);
      for (const issue of r.issues) {
        process.stdout.write(`        path=${issue.path}  code=${issue.code}\n`);
      }
    }
  }

  process.stdout.write('\n');
  if (failures > 0) {
    process.stderr.write(`FAIL: ${failures}/${results.length} tenant(s) failed schema validation\n`);
    process.exit(1);
  }
  process.stdout.write(`PASS: all ${results.length} tenant(s) validated against current schema\n`);
}

main().catch((err: unknown) => {
  const name = (err as Error)?.name ?? 'UnknownError';
  const code = (err as { code?: string | number })?.code;
  const codeStr = code !== undefined ? ` (code=${String(code)})` : '';
  process.stderr.write(`FATAL: ${name}${codeStr}\n`);
  process.exit(2);
});
