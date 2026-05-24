#!/usr/bin/env node
/**
 * CI-2: validate every prod tenant config against the live tenantConfigSchema.
 *
 * Runs in GitHub Actions on PRs that touch src/lib/schemas/**. Fetches each
 * tenant config from s3://${S3_BUCKET}/tenants/{ID}/{ID}-config.json, parses
 * it, and exits non-zero if any tenant fails schema validation.
 *
 * Thin CLI shell. The validation core lives at
 * src/lib/validation/prodConfigsValidator.ts so it can be unit-tested inside
 * the project's vitest include scope. Security constraints + design + apply
 * checklist + threat model:
 *   ~/.claude/projects/.../memory/project_scheduling_subphase_a_ci2_phase0_design_2026-05-19.md
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  runProdConfigsValidation,
  parseTenantIdsFromCommonPrefixes,
  S3FetchError,
  type S3Reader,
} from '../src/lib/validation/prodConfigsValidator';

const execFileP = promisify(execFile);

const cliS3Reader: S3Reader = {
  async listTenantIds(bucket: string) {
    const { stdout } = await execFileP('aws', [
      's3api', 'list-objects-v2',
      '--bucket', bucket,
      '--prefix', 'tenants/',
      '--delimiter', '/',
      '--output', 'json',
    ]);
    return parseTenantIdsFromCommonPrefixes(stdout);
  },
  async fetchObjectBody(bucket: string, key: string) {
    try {
      const { stdout } = await execFileP(
        'aws',
        ['s3', 'cp', `s3://${bucket}/${key}`, '-'],
        { maxBuffer: 16 * 1024 * 1024 },
      );
      return stdout;
    } catch (e) {
      const stderr = (e as { stderr?: string }).stderr ?? '';
      const match = stderr.match(/\(([A-Z][A-Za-z]+)\)/);
      throw new S3FetchError('s3 cp failed', match?.[1] ?? null);
    }
  },
};

async function main(): Promise<void> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    process.stderr.write('FATAL: S3_BUCKET env var is required\n');
    process.exit(2);
  }

  const outcome = await runProdConfigsValidation({
    bucket,
    s3: cliS3Reader,
    log: (line) => process.stdout.write(line + '\n'),
  });

  if (outcome.results.length === 0) {
    process.stderr.write(`FATAL: no tenants found in s3://${bucket}/tenants/\n`);
    process.exit(2);
  }

  process.stdout.write('\n');
  if (outcome.failures > 0) {
    process.stderr.write(
      `FAIL: ${outcome.failures}/${outcome.results.length} tenant(s) failed schema validation\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `PASS: all ${outcome.results.length} tenant(s) validated against current schema\n`,
  );
}

main().catch((err: unknown) => {
  const name = (err as Error)?.name ?? 'UnknownError';
  const code = (err as { code?: string | number })?.code;
  const codeStr = code !== undefined ? ` (code=${String(code)})` : '';
  process.stderr.write(`FATAL: ${name}${codeStr}\n`);
  process.exit(2);
});
