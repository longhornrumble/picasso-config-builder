/**
 * i18n indirection — sub-phase A8b.
 *
 * Verify check (impl plan A8b): `t('test_key')` returns the English string
 * for a known key. Also covers `{param}` interpolation and the
 * non-crashing fallbacks (unknown key, missing param) plus the sanctioned
 * Intl-based date formatter.
 */

import { describe, it, expect } from 'vitest';
import { t, formatDateTime, type MessageKey } from '../index';

describe('t() — message indirection', () => {
  it('returns the English string for a known key', () => {
    expect(t('scheduling.test_key')).toBe('Scheduling is configured.');
  });

  it('interpolates {param} placeholders', () => {
    expect(t('scheduling.test_key_param', { name: 'Dana' })).toBe('Booked with Dana.');
  });

  it('coerces non-string params', () => {
    expect(t('scheduling.test_key_param', { name: 7 })).toBe('Booked with 7.');
  });

  it('returns the template verbatim when no params are given', () => {
    expect(t('scheduling.test_key_param')).toBe('Booked with {name}.');
  });

  it('leaves a placeholder intact when its param is missing (non-crashing)', () => {
    expect(t('scheduling.test_key_param', {})).toBe('Booked with {name}.');
  });

  it('returns the key itself for an unknown key (non-crashing)', () => {
    expect(t('scheduling.does_not_exist' as MessageKey)).toBe('scheduling.does_not_exist');
  });

  it("defaults locale to 'en' and accepts an explicit 'en'", () => {
    expect(t('scheduling.test_key', undefined, 'en')).toBe('Scheduling is configured.');
  });
});

describe('formatDateTime() — sanctioned Intl wrapper', () => {
  const date = new Date('2026-05-18T14:30:00Z');

  it('delegates to Intl.DateTimeFormat', () => {
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    };
    expect(formatDateTime(date, opts)).toBe(
      new Intl.DateTimeFormat('en', opts).format(date)
    );
  });

  it('produces a stable string for a fixed UTC date', () => {
    expect(
      formatDateTime(date, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    ).toBe('05/18/2026');
  });
});
