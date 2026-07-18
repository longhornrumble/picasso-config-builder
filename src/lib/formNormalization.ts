/**
 * Form Normalization
 *
 * Schema discipline: stored configs may be authored outside the builder
 * (seeders, hand edits, the M2M config API) and carry non-canonical field
 * shapes the builder and widget cannot handle. Normalize once at the store
 * boundary (loadConfig) instead of guarding every consumer — same pattern as
 * normalizeBranches in the config slice.
 *
 * Repairs applied:
 * - `boolean` fields → Yes/No `select` (no widget renderer exists for boolean;
 *   select is how yes/no questions are canonically modeled)
 * - composite `name`/`address` fields missing `subfields` → canonical
 *   subfields generated from the same templates the field editor uses
 */

import type { ConversationalForm, FormField } from '@/types/config';
import { generateCompositeSubfields, isCompositeFieldType } from './compositeFieldTemplates';

export interface NormalizationResult {
  forms: Record<string, ConversationalForm>;
  /** Human-readable description of each repair, e.g. for a toast. Empty = config was canonical. */
  repairs: string[];
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/**
 * Normalize a single field. Returns the (possibly repaired) field plus a
 * repair description, or null if the field was already canonical.
 */
function normalizeField(
  field: FormField,
  formId: string
): { field: FormField; repair: string } | null {
  // Unsupported 'boolean' type → Yes/No select (same field id, so analytics
  // events keyed on field id keep matching)
  if ((field.type as string) === 'boolean') {
    return {
      field: { ...field, type: 'select', options: [...YES_NO_OPTIONS] },
      repair: `${formId}: field "${field.label || field.id}" converted from boolean to Yes/No select`,
    };
  }

  // Composite field without subfields → generate canonical subfields
  if (isCompositeFieldType(field.type) && (!field.subfields || field.subfields.length === 0)) {
    return {
      field: { ...field, subfields: generateCompositeSubfields(field.id, field.type) },
      repair: `${formId}: field "${field.label || field.id}" got canonical ${field.type} subfields`,
    };
  }

  return null;
}

/**
 * Normalize all forms in a config. Pure and idempotent — canonical input is
 * returned unchanged (same object references where possible).
 */
export function normalizeForms(
  forms: Record<string, ConversationalForm> | undefined | null
): NormalizationResult {
  const repairs: string[] = [];
  const out: Record<string, ConversationalForm> = {};

  for (const [formId, form] of Object.entries(forms || {})) {
    let changed = false;
    const fields = (form.fields || []).map((field) => {
      const result = normalizeField(field, formId);
      if (result) {
        changed = true;
        repairs.push(result.repair);
        return result.field;
      }
      return field;
    });
    out[formId] = changed ? { ...form, fields } : form;
  }

  return { forms: out, repairs };
}
