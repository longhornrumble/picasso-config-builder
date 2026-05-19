/**
 * CI-1 — mock-s3 schema snapshot (impl plan scheduling sub-phase A §3).
 *
 * Every fixture the local dev server serves from mock-s3/ must parse against
 * the current tenantConfigSchema. Purpose: a schema change that breaks an
 * existing mock config → red CI; a backward-compatible change → green. Runs
 * on every PR via the existing `npm run test:run` step in pr-checks.yml (no
 * workflow change needed).
 *
 * Note: TEST001/TEST002 were rewritten 2026-05-19 from deeply stale v1.3
 * shapes (105 combined schema issues) to minimal current-schema-valid
 * configs — they are local-dev scaffolding keyed by tenant ID, not real
 * tenant data. CI-2 (separate) guards real production configs from S3.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tenantConfigSchema } from '../tenant.schema';

const MOCK_S3 = join(process.cwd(), 'mock-s3');
const fixtures = readdirSync(MOCK_S3).filter((f) => f.endsWith('-config.json'));

describe('CI-1: mock-s3 fixtures parse against tenantConfigSchema', () => {
  it('finds fixtures to guard (guards against an empty/mispathed glob)', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures)('%s parses with no schema errors', (file) => {
    const raw = JSON.parse(readFileSync(join(MOCK_S3, file), 'utf8'));
    const result = tenantConfigSchema.safeParse(raw);
    if (!result.success) {
      const summary = result.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n  ');
      throw new Error(`${file} failed tenantConfigSchema:\n  ${summary}`);
    }
    expect(result.success).toBe(true);
  });
});
