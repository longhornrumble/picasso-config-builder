/**
 * Minimal i18n indirection for scheduling — impl plan sub-phase A8b.
 *
 * Purpose: establish the `t(key, params)` indirection layer NOW so scheduling
 * UI built in later sub-phases never hardcodes user-facing strings ("cheap
 * now, expensive to retrofit later", canonical §15.1).
 *
 * Deliberately NOT a full i18n engine. Per A8b tightened scope (tech-lead
 * review 2026-05-02), locale switching, the mock `xx` locale, and a custom
 * ESLint/stylelint rule were all cut as gold-plating for an English-only v1.
 * The convention (all user-facing scheduling strings via `t()`; dates via the
 * `formatDateTime` helper below; CSS logical properties) is enforced by
 * `picasso-config-builder/docs/CODE_REVIEW_CHECKLIST.md`, not by tooling.
 *
 * v1 ships English only. `locale` defaults to 'en' and is the single
 * supported value today; the parameter exists so call sites are already
 * locale-shaped when a non-English tenant lands — this mirrors the scheduling
 * config's `default_locale` / `available_locales` (BCP-47, default 'en').
 */
import { en, type MessageKey } from './en';

const CATALOGS = { en } as const;
export type Locale = keyof typeof CATALOGS;
export type { MessageKey };

export type TParams = Record<string, string | number>;

/**
 * Resolve a catalog key to its string, interpolating `{name}` placeholders
 * from `params`. An unknown key returns the key itself, and a placeholder
 * with no matching param is left intact — both are visible-but-non-crashing
 * so a gap surfaces in review/QA without breaking the rendered UI (same
 * forward-compatible-read discipline as the schema readers).
 */
export function t(key: MessageKey, params?: TParams, locale: Locale = 'en'): string {
  const catalog = CATALOGS[locale] ?? CATALOGS.en;
  const template: string = catalog[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * Sanctioned date/time rendering for scheduling. Wraps `Intl.DateTimeFormat`
 * so no scheduling-touched file hand-formats dates (the checklist's
 * date-format guard explicitly carves out "formatting utility modules" —
 * this is that module). `locale` defaults to 'en' for v1.
 */
export function formatDateTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale: Locale = 'en'
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
