/**
 * Core validation logic for CI-2: validate every prod tenant config against
 * the live tenantConfigSchema. Extracted from scripts/validate-prod-configs.ts
 * so that it lives inside src/** (vitest include scope) and is testable.
 *
 * Security constraints (Rec-4 + threat-model T-09 considerations):
 *   - log only { path, code } per Zod issue
 *   - NEVER log error.format() / error.flatten() / issue.message — superRefine
 *     at tenant.schema.ts embeds program-ID strings into messages
 *   - NEVER log raw config bytes (no JSON.parse error.message either — it
 *     includes a context byte from the source on failure)
 *   - NEVER store config as a CI artifact
 */
import { tenantConfigSchema } from '../schemas/tenant.schema';

export type ValidationResult =
  | { tenantId: string; ok: true }
  | { tenantId: string; ok: false; reason: 'fetch_failed'; awsCode: string | null }
  | { tenantId: string; ok: false; reason: 'invalid_json' }
  | {
      tenantId: string;
      ok: false;
      reason: 'schema_failed';
      issues: Array<{ path: string; code: string }>;
    };

/**
 * Minimal S3 reader contract — abstracts away the actual transport so callers
 * can use the CLI in production and a fake in tests.
 */
export interface S3Reader {
  listTenantIds(bucket: string): Promise<string[]>;
  fetchObjectBody(bucket: string, key: string): Promise<string>;
}

export class S3FetchError extends Error {
  awsCode: string | null;
  constructor(message: string, awsCode: string | null) {
    super(message);
    this.awsCode = awsCode;
  }
}

/**
 * Parses the CommonPrefixes payload that `aws s3api list-objects-v2 --prefix
 * tenants/ --delimiter /` returns. Pulled out for direct unit-testing.
 */
export function parseTenantIdsFromCommonPrefixes(stdout: string): string[] {
  const parsed = JSON.parse(stdout) as { CommonPrefixes?: Array<{ Prefix: string }> };
  return (parsed.CommonPrefixes ?? [])
    .map((p) => p.Prefix.replace(/^tenants\//, '').replace(/\/$/, ''))
    .filter((id) => id.length > 0)
    .sort();
}

export async function fetchAndValidate(
  s3: S3Reader,
  bucket: string,
  tenantId: string,
): Promise<ValidationResult> {
  const key = `tenants/${tenantId}/${tenantId}-config.json`;

  let body: string;
  try {
    body = await s3.fetchObjectBody(bucket, key);
  } catch (e) {
    const awsCode = e instanceof S3FetchError ? e.awsCode : null;
    return { tenantId, ok: false, reason: 'fetch_failed', awsCode };
  }

  let config: unknown;
  try {
    config = JSON.parse(body);
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
    // Rec-4: ONLY path + code. Never include issue.message — superRefine
    // embeds program-ID strings there.
    issues: result.error.issues.map((i) => ({
      path: i.path.join('.'),
      code: i.code,
    })),
  };
}

export interface ValidationRunOptions {
  bucket: string;
  s3: S3Reader;
  log?: (line: string) => void;
}

export interface ValidationRunOutcome {
  results: ValidationResult[];
  failures: number;
}

export async function runProdConfigsValidation(
  opts: ValidationRunOptions,
): Promise<ValidationRunOutcome> {
  const log = opts.log ?? (() => {});
  log(`CI-2: validating prod tenant configs in s3://${opts.bucket}/tenants/`);

  const tenantIds = await opts.s3.listTenantIds(opts.bucket);
  log(`Found ${tenantIds.length} tenant(s): ${tenantIds.join(', ')}`);

  const results = await Promise.all(
    tenantIds.map((id) => fetchAndValidate(opts.s3, opts.bucket, id)),
  );

  let failures = 0;
  for (const r of results) {
    if (r.ok) {
      log(`  PASS  ${r.tenantId}`);
      continue;
    }
    failures++;
    if (r.reason === 'fetch_failed') {
      log(`  FAIL  ${r.tenantId}  reason=fetch_failed  awsCode=${r.awsCode ?? '<none>'}`);
    } else if (r.reason === 'invalid_json') {
      log(`  FAIL  ${r.tenantId}  reason=invalid_json`);
    } else {
      log(`  FAIL  ${r.tenantId}  reason=schema_failed  issues=${r.issues.length}`);
      for (const issue of r.issues) {
        log(`        path=${issue.path}  code=${issue.code}`);
      }
    }
  }

  return { results, failures };
}
