/**
 * Composite Field Templates
 * Predefined configurations for composite field types (name, address, etc.)
 */

import type { FormSubField, CompositeFieldConfig } from '@/types/config';

/**
 * Name field template (US format)
 * Includes: First Name, Middle Name (optional), Last Name
 */
export const NAME_FIELD_TEMPLATE: CompositeFieldConfig = {
  subfields: [
    {
      id: 'first_name',
      label: 'First Name',
      placeholder: 'e.g., John',
      required: true,
      type: 'text',
    },
    {
      id: 'middle_name',
      label: 'Middle Name',
      placeholder: 'Optional',
      required: false,
      type: 'text',
    },
    {
      id: 'last_name',
      label: 'Last Name',
      placeholder: 'e.g., Smith',
      required: true,
      type: 'text',
    },
  ],
};

/**
 * Address field template (US format)
 * Includes: Street, Apt/Unit, City, State, ZIP
 */
export const ADDRESS_FIELD_TEMPLATE: CompositeFieldConfig = {
  subfields: [
    {
      id: 'street',
      label: 'Street Address',
      placeholder: 'e.g., 123 Main Street',
      required: true,
      type: 'text',
    },
    {
      id: 'apt_unit',
      label: 'Apt/Suite/Unit',
      placeholder: 'Optional',
      required: false,
      type: 'text',
    },
    {
      id: 'city',
      label: 'City',
      placeholder: 'e.g., Portland',
      required: true,
      type: 'text',
    },
    {
      id: 'state',
      label: 'State',
      placeholder: 'e.g., OR',
      required: true,
      type: 'text',
    },
    {
      id: 'zip_code',
      label: 'ZIP Code',
      placeholder: 'e.g., 97201',
      required: true,
      type: 'text',
      validation: {
        pattern: '^\\d{5}(-\\d{4})?$',
        message: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
      },
    },
  ],
};

/**
 * Get composite field template by type
 */
export function getCompositeFieldTemplate(type: 'name' | 'address'): CompositeFieldConfig | null {
  switch (type) {
    case 'name':
      return NAME_FIELD_TEMPLATE;
    case 'address':
      return ADDRESS_FIELD_TEMPLATE;
    default:
      return null;
  }
}

/**
 * Generate subfields for a composite field
 * Creates subfields with unique IDs based on the parent field ID
 */
export function generateCompositeSubfields(
  parentFieldId: string,
  type: 'name' | 'address'
): FormSubField[] {
  const template = getCompositeFieldTemplate(type);
  if (!template) return [];

  return template.subfields.map((subfield) => ({
    ...subfield,
    id: `${parentFieldId}.${subfield.id}`,
  }));
}

/**
 * Check if a field type is composite
 */
export function isCompositeFieldType(type: string): type is 'name' | 'address' {
  return type === 'name' || type === 'address';
}

/**
 * Get display name for composite field types
 */
export function getCompositeFieldTypeLabel(type: 'name' | 'address'): string {
  switch (type) {
    case 'name':
      return 'Name (Full Name Fields)';
    case 'address':
      return 'Address (US Address)';
    default:
      return type;
  }
}
