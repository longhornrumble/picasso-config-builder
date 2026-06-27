/**
 * form.schema.ts tests — postSubmissionConfigSchema scheduling pivot fields.
 *
 * The "book an appointment after this form" + post-booking question that drive the
 * runtime form -> schedule -> ask chain (lambda §B post-booking amendment).
 */

import { describe, it, expect } from 'vitest';
import { postSubmissionConfigSchema } from '../form.schema';

const base = { confirmation_message: 'Thanks — we received your application.' };

describe('postSubmissionConfigSchema — book_appointment + post_booking_question', () => {
  it('accepts book_appointment with a post-booking question', () => {
    expect(() =>
      postSubmissionConfigSchema.parse({
        ...base,
        book_appointment: true,
        post_booking_question: 'What would you like to talk about?',
      }),
    ).not.toThrow();
  });

  it('accepts book_appointment without a question (question is optional)', () => {
    expect(() => postSubmissionConfigSchema.parse({ ...base, book_appointment: true })).not.toThrow();
  });

  it('both fields are optional — a config with only the confirmation message parses', () => {
    const parsed = postSubmissionConfigSchema.parse(base);
    expect(parsed.book_appointment).toBeUndefined();
    expect(parsed.post_booking_question).toBeUndefined();
  });

  it('rejects a post-booking question longer than 500 characters', () => {
    expect(() =>
      postSubmissionConfigSchema.parse({ ...base, post_booking_question: 'a'.repeat(501) }),
    ).toThrow(/500 characters/);
  });
});
