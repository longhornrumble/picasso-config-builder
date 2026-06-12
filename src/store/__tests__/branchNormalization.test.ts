/**
 * Schema-discipline contract test: the store boundary must tolerate old-shape
 * branch records (missing `secondary`, missing `available_ctas`) — the reader
 * crash this pins: BranchCardContent reading `available_ctas.secondary.length`
 * on a hand-seeded branch with only a `primary` CTA (MYR384719, 2026-06-12).
 */
import { describe, it, expect } from 'vitest';
import { normalizeBranches } from '../slices/config';
import type { ConversationBranch } from '@/types/config';

describe('normalizeBranches (old-shape config records)', () => {
  it('defaults a missing secondary array', () => {
    const raw = {
      schedule_call: {
        available_ctas: { primary: 'schedule_intro_call' },
        description: 'Schedule an intro call with the team',
      },
    } as unknown as Record<string, ConversationBranch>;

    const out = normalizeBranches(raw);
    expect(out.schedule_call.available_ctas.secondary).toEqual([]);
    expect(out.schedule_call.available_ctas.primary).toBe('schedule_intro_call');
    expect(out.schedule_call.description).toBe('Schedule an intro call with the team');
  });

  it('defaults a missing available_ctas object entirely', () => {
    const raw = {
      bare: { description: 'no ctas at all' },
    } as unknown as Record<string, ConversationBranch>;

    const out = normalizeBranches(raw);
    expect(out.bare.available_ctas.primary).toBe('');
    expect(out.bare.available_ctas.secondary).toEqual([]);
  });

  it('passes well-formed branches through unchanged', () => {
    const raw: Record<string, ConversationBranch> = {
      request_support: {
        available_ctas: { primary: 'request_dare2dream', secondary: ['love_box_referral'] },
        description: 'Request support',
        program_id: 'daretodream_request',
      } as ConversationBranch,
    };

    const out = normalizeBranches(raw);
    expect(out.request_support).toEqual(raw.request_support);
  });

  it('tolerates undefined and null input', () => {
    expect(normalizeBranches(undefined)).toEqual({});
    expect(normalizeBranches(null)).toEqual({});
  });

  it('tolerates a null branch entry value', () => {
    const raw = { broken: null } as unknown as Record<string, ConversationBranch>;
    const out = normalizeBranches(raw);
    expect(out.broken.available_ctas).toEqual({ primary: '', secondary: [] });
  });
});
