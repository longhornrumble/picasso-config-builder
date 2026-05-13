# CF1 — Add `selection_metadata` to `ctaDefinitionSchema`

**Tracker for follow-up PR escalated from PR #56 (config schema adversarial review).**

## Background

During the adversarial review of `scheduling/docs/scheduling_config_schema.md` (picasso PR #56), the typescript-specialist found that `selection_metadata` is documented in §9 of the schema spec and used by V4.1 pool selection (`topic_definitions` + CTA filtering by `selection_metadata.topic_tags` and `role_axis`), but the field is **not declared in `ctaDefinitionSchema`** in `picasso-config-builder/src/lib/schemas/cta.schema.ts`.

The TypeScript type `CTADefinition` (in `src/types/config.ts:222`) declares `selection_metadata?: SelectionMetadata`, but the runtime Zod schema does not. Consequence: when a tenant config containing `selection_metadata` is parsed and then re-serialized through the config builder, the field is silently dropped.

This is a pre-existing V4.1 data-loss risk on config builder round-trips — not introduced by any recent change. Escalated as a separate PR per "do not conflate review fixes with code fixes" guidance from PR #56.

## Acceptance criteria

- `selection_metadata` is declared as an optional field on `ctaDefinitionSchema` matching the `SelectionMetadata` TypeScript shape in `src/types/config.ts:213-225`.
- The Zod definition uses `.passthrough()` semantics OR an explicit object schema — whichever matches existing patterns in the file. Pick the strictest reasonable form.
- `z.infer<typeof ctaDefinitionSchema>` agrees with the existing `CTADefinition` interface (no diff after the change).
- New unit test in `src/lib/schemas/__tests__/cta.schema.test.ts`: round-trip a CTA definition that includes `selection_metadata.topic_tags` and `selection_metadata.role_axis`, confirm the parsed result preserves the field.
- Existing CTA tests still pass.
- `npm run validate` passes.
- `verify-before-commit` skill marker present before commit.

## Out of scope

- Don't refactor adjacent CTA schema code.
- Don't extend `selection_metadata` schema beyond what's already in `SelectionMetadata` in `config.ts`.
- Don't touch `tenant.schema.ts` invariants — this is a CTA-shape fix only.
