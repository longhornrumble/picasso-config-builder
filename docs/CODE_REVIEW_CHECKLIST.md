# Code Review Checklist

**Purpose.** Mandatory checklist for any PR that touches scheduling-related code. Reviewers run through this list and cite it by file path in review comments when an item is not satisfied. Required by implementation plan A8b as the enforcement mechanism for multi-language scaffolding conventions.

---

## Scheduling-Touched Files

The following paths define "scheduling-touched" for this checklist. Any PR that adds or modifies files under these paths must pass all mandatory items below.

- `scheduling/`
- `Picasso/src/components/scheduling/`
- `customer-portal/src/components/scheduling/`
- `picasso-config-builder/src/components/scheduling/`
- `Lambdas/lambda/Bedrock_Streaming_Handler_Staging/scheduling/`
- `Lambdas/lambda/Scheduling_*/` (any Lambda starting with `Scheduling_`)

---

## Mandatory: Scheduling-Touched Files

These three items are required for every PR touching the paths above. A PR may not merge with any of these outstanding.

- [ ] **All user-facing strings go through `t(key)` indirection.** No raw string literals in scheduling-touched files. v1 populates English keys only; the indirection layer is the point. Grep check: `grep -rn '"[A-Z]'` in scheduling-touched JS/TS files should return no results in user-facing string positions.

- [ ] **No hand-formatted dates or times.** Use `Intl.DateTimeFormat` (JS/TS) or `babel.dates` (Python) for all date/time rendering. Grep check: `grep -rn 'toLocaleString\|\.getHours\|\.getMinutes\|strftime'` in scheduling-touched files should return no results outside of formatting utility modules.

- [ ] **No `margin-left` or `margin-right` in scheduling-touched stylesheets.** Use CSS logical properties: `margin-inline-start` and `margin-inline-end`. Grep check: `grep -rn 'margin-left\|margin-right'` in scheduling-touched CSS/SCSS files should return no results.

---

## General: All PRs

Brief carry-over from existing review practice. Apply to every PR, not just scheduling-touched ones.

- [ ] Tests added alongside new code — no new logic without a corresponding test.
- [ ] No commented-out code in committed files.
- [ ] Comments explain the *why*, not the *what* — code already says what; comments explain intent, constraints, and non-obvious decisions.
- [ ] No premature abstractions — no factory/registry/plugin pattern for code that has one current caller.

---

## How to Use

During PR review: work through the relevant sections top to bottom. For any item not satisfied, leave an inline comment on the offending line citing this file:

> Per `picasso-config-builder/docs/CODE_REVIEW_CHECKLIST.md` — this string literal must go through `t(key)` indirection.

PRs may not be approved with open mandatory items. General items that cannot be addressed immediately should have a tracking ticket reference before merge.

---

## Change log

| Date | Change | Author |
|---|---|---|
| 2026-05-02 | Initial — authored for sub-phase A8b multi-language scaffolding enforcement | Chris + Claude |
