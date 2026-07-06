/**
 * validate-single-config.ts — CLI wrapper around validateSingleConfig for the
 * tenant-config promotion workflow (docs/roadmap/TENANT_CONFIG_PROMOTION_MECHANISM.md
 * §5.3 / §11 step 3, picasso repo).
 *
 * Reads ONE config JSON file and validates it against the live tenantConfigSchema
 * — the "does this candidate blob parse?" question the promotion workflow needs,
 * which the all-configs validate-prod-configs.ts does NOT answer (§10.1).
 *
 * Exit codes: 0 = valid · 1 = invalid (schema or JSON) · 2 = usage/IO error.
 *
 * Rec-4: on failure prints ONLY { path, code } per issue — never issue.message
 * (superRefine embeds program-ID strings) and never the raw config bytes.
 *
 * Usage: npx tsx scripts/validate-single-config.ts <path-to-config.json>
 */
import { readFileSync } from 'fs';
import { validateSingleConfig } from '../src/lib/validation/prodConfigsValidator';

function main(): void {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write('usage: tsx scripts/validate-single-config.ts <config.json>\n');
    process.exit(2);
  }

  let body: string;
  try {
    body = readFileSync(path, 'utf8');
  } catch {
    // Never echo the underlying error — it can embed a byte of file content.
    process.stderr.write(`FATAL: cannot read ${path}\n`);
    process.exit(2);
  }

  const result = validateSingleConfig(body);
  if (result.ok) {
    process.stdout.write('VALID: config parses against tenantConfigSchema\n');
    process.exit(0);
  }
  if (result.reason === 'invalid_json') {
    process.stderr.write('INVALID: not parseable JSON\n');
    process.exit(1);
  }
  process.stderr.write(`INVALID: ${result.issues.length} schema issue(s):\n`);
  for (const issue of result.issues) {
    // Rec-4: path + code only.
    process.stderr.write(`  path=${issue.path || '(root)'} code=${issue.code}\n`);
  }
  process.exit(1);
}

main();
