/**
 * Form Normalization Tests
 *
 * Contract tests for the store-boundary repair of externally-authored form
 * shapes (schema discipline: readers must tolerate old-shape records).
 * The old-shape fixtures mirror what the demo-zone seeder actually shipped
 * for BRI071351 on 2026-07-18 (boolean fields, flat name/address composites).
 */

import { describe, it, expect } from 'vitest';
import { normalizeForms } from '../formNormalization';
import type { ConversationalForm } from '@/types/config';

const canonicalForm: ConversationalForm = {
  enabled: true,
  form_id: 'canonical',
  program: 'test-program',
  title: 'Canonical',
  description: 'Already canonical',
  trigger_phrases: [],
  fields: [
    { id: 'email', type: 'email', label: 'Email', prompt: 'Email?', required: true },
    {
      id: 'full_name',
      type: 'name',
      label: 'Full name',
      prompt: 'Name?',
      required: true,
      subfields: [
        { id: 'full_name.first_name', label: 'First Name', required: true, type: 'text' },
        { id: 'full_name.last_name', label: 'Last Name', required: true, type: 'text' },
      ],
    },
  ],
};

/** Old-shape form as the seeder wrote it: boolean type + flat composites. */
const seederForm = {
  enabled: true,
  form_id: 'seeded',
  program: 'test-program',
  title: 'Seeded',
  description: 'Externally authored',
  trigger_phrases: [],
  fields: [
    { id: 'field_1', type: 'name', label: 'Full name', prompt: 'Name?', required: true },
    { id: 'field_2', type: 'boolean', label: 'Text consent', prompt: 'OK to text?', required: true },
    { id: 'field_3', type: 'address', label: 'Home address', prompt: 'Address?', required: true },
  ],
} as unknown as ConversationalForm;

describe('normalizeForms', () => {
  it('returns canonical forms unchanged (idempotent, same reference)', () => {
    const input = { canonical: canonicalForm };
    const { forms, repairs } = normalizeForms(input);
    expect(repairs).toEqual([]);
    expect(forms.canonical).toBe(canonicalForm); // reference-equal: no gratuitous copies
  });

  it('converts boolean fields to Yes/No select, preserving the field id', () => {
    const { forms, repairs } = normalizeForms({ seeded: seederForm });
    const field = forms.seeded.fields.find((f) => f.id === 'field_2')!;
    expect(field.type).toBe('select');
    expect(field.options).toEqual([
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]);
    expect(field.id).toBe('field_2'); // analytics events key on field id
    expect(repairs.some((r) => r.includes('Text consent'))).toBe(true);
  });

  it('generates canonical subfields for flat name and address composites', () => {
    const { forms } = normalizeForms({ seeded: seederForm });

    const name = forms.seeded.fields.find((f) => f.id === 'field_1')!;
    expect(name.subfields?.map((s) => s.id)).toEqual([
      'field_1.first_name',
      'field_1.middle_name',
      'field_1.last_name',
    ]);

    const address = forms.seeded.fields.find((f) => f.id === 'field_3')!;
    expect(address.subfields?.map((s) => s.id)).toEqual([
      'field_3.street',
      'field_3.apt_unit',
      'field_3.city',
      'field_3.state',
      'field_3.zip_code',
    ]);
  });

  it('reports one repair per repaired field', () => {
    const { repairs } = normalizeForms({ seeded: seederForm });
    expect(repairs).toHaveLength(3);
  });

  it('is idempotent: normalizing normalized output is a no-op', () => {
    const first = normalizeForms({ seeded: seederForm });
    const second = normalizeForms(first.forms);
    expect(second.repairs).toEqual([]);
    expect(second.forms.seeded).toBe(first.forms.seeded);
  });

  it('does not touch composites that already have subfields', () => {
    const withSubfields: ConversationalForm = {
      ...canonicalForm,
      form_id: 'has-subfields',
    };
    const { forms, repairs } = normalizeForms({ f: withSubfields });
    expect(repairs).toEqual([]);
    expect(forms.f.fields[1].subfields).toHaveLength(2); // untouched, not regenerated
  });

  it('tolerates empty, null, and fieldless input (forward-compatible reads)', () => {
    expect(normalizeForms(undefined)).toEqual({ forms: {}, repairs: [] });
    expect(normalizeForms(null)).toEqual({ forms: {}, repairs: [] });
    const noFields = { f: { form_id: 'f' } as unknown as ConversationalForm };
    expect(normalizeForms(noFields).repairs).toEqual([]);
  });
});
