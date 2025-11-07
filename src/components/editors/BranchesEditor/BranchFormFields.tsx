/**
 * BranchFormFields Component
 * Domain-specific form fields for creating/editing branches
 *
 * This component only handles rendering the fields - all validation,
 * state management, and form submission is handled by the generic EntityForm.
 */

import React from 'react';
import { Input, Select, Badge } from '@/components/ui';
import { X } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { BranchEntity } from './types';

export const BranchFormFields: React.FC<FormFieldsProps<BranchEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const ctas = useConfigStore((state) => Object.entries(state.ctas.ctas));
  const programs = useConfigStore((state) => state.programs.getAllPrograms());

  // CTA options for dropdowns
  const ctaOptions = ctas.map(([id, cta]) => ({
    value: id,
    label: cta.label,
  }));

  // Program options for dropdown
  const programOptions = programs.map((p) => ({
    value: p.program_id,
    label: p.program_name || p.program_id,
  }));

  // Add secondary CTA
  const handleAddSecondaryCTA = (ctaId: string) => {
    if (ctaId && ctaId !== '__placeholder__' && !value.available_ctas.secondary.includes(ctaId)) {
      onChange({
        ...value,
        available_ctas: {
          ...value.available_ctas,
          secondary: [...value.available_ctas.secondary, ctaId],
        },
      });
    }
  };

  // Remove secondary CTA
  const handleRemoveSecondaryCTA = (ctaId: string) => {
    onChange({
      ...value,
      available_ctas: {
        ...value.available_ctas,
        secondary: value.available_ctas.secondary.filter((id) => id !== ctaId),
      },
    });
  };

  // Get CTA label by ID
  const getCTALabel = (ctaId: string): string => {
    const cta = ctas.find(([id]) => id === ctaId);
    return cta ? cta[1].label : ctaId;
  };

  return (
    <>
      {/* Branch ID */}
      <Input
        label="Branch ID"
        id="branchId"
        placeholder="e.g., volunteer_inquiry"
        value={value.branchId}
        onChange={(e) => onChange({ ...value, branchId: e.target.value })}
        onBlur={() => onBlur('branchId')}
        error={touched.branchId ? errors.branchId : undefined}
        helperText={
          isEditMode
            ? 'Branch ID cannot be changed'
            : 'Lowercase letters, numbers, hyphens, and underscores only'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Program */}
      <div className="w-full">
        <Select
          label="Program"
          value={value.program_id || ''}
          onValueChange={(newValue) =>
            onChange({ ...value, program_id: newValue || undefined })
          }
          options={programOptions}
          placeholder="Select a program (optional)..."
          helperText="Associate this branch with a specific program"
          disabled={programs.length === 0}
        />
        {programs.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            No programs available. Create a program first.
          </p>
        )}
      </div>

      {/* Primary CTA */}
      <div className="w-full">
        <Select
          label="Primary CTA"
          value={value.available_ctas.primary}
          onValueChange={(newValue) =>
            onChange({
              ...value,
              available_ctas: { ...value.available_ctas, primary: newValue },
            })
          }
          options={ctaOptions}
          error={touched['available_ctas.primary'] ? errors['available_ctas.primary'] : undefined}
          required
          disabled={ctas.length === 0}
        />
        {!errors['available_ctas.primary'] && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Main call-to-action shown when this branch is triggered
          </p>
        )}
      </div>

      {/* Secondary CTAs */}
      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Secondary CTAs
        </label>
        <Select
          value="__placeholder__"
          onValueChange={handleAddSecondaryCTA}
          options={[
            { value: '__placeholder__', label: 'Add secondary CTA...' },
            ...ctaOptions.filter(
              (opt) =>
                opt.value !== value.available_ctas.primary &&
                !value.available_ctas.secondary.includes(opt.value)
            ),
          ]}
          disabled={ctas.length === 0 || ctaOptions.length <= 1}
        />
        {value.available_ctas.secondary.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {value.available_ctas.secondary.map((ctaId) => (
              <Badge key={ctaId} variant="outline" className="gap-1">
                {getCTALabel(ctaId)}
                <button
                  type="button"
                  onClick={() => handleRemoveSecondaryCTA(ctaId)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Additional CTAs available in this conversation branch
        </p>
      </div>
    </>
  );
};
