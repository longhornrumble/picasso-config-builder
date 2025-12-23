/**
 * ProgramFormFields Component
 * Domain-specific form fields for creating/editing programs
 *
 * This component only handles rendering the fields - all validation,
 * state management, and form submission is handled by the generic EntityForm.
 */

import React from 'react';
import { Input, Textarea } from '@/components/ui';
import type { Program } from '@/types/config';
import type { FormFieldsProps } from '@/lib/crud/types';

export const ProgramFormFields: React.FC<FormFieldsProps<Program>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  return (
    <>
      {/* Program ID */}
      <Input
        label="Program ID"
        id="program-id"
        placeholder="e.g., volunteer_program"
        value={value.program_id}
        onChange={(e) => onChange({ ...value, program_id: e.target.value })}
        onBlur={() => onBlur('program_id')}
        error={touched.program_id ? errors.program_id : undefined}
        helperText="Lowercase letters, numbers, and underscores only"
        required
        autoFocus={!isEditMode}
      />

      {/* Program Name */}
      <Input
        label="Program Name"
        id="program-name"
        placeholder="e.g., Volunteer Programs"
        value={value.program_name}
        onChange={(e) => onChange({ ...value, program_name: e.target.value })}
        onBlur={() => onBlur('program_name')}
        error={touched.program_name ? errors.program_name : undefined}
        helperText="Display name shown to users"
        required
        autoFocus={isEditMode}
      />

      {/* Description */}
      <div className="w-full">
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Optional description of this program..."
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          onBlur={() => onBlur('description')}
          rows={3}
        />
        {touched.description && errors.description && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.description}
          </p>
        )}
        {!errors.description && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Max 500 characters
          </p>
        )}
      </div>
    </>
  );
};
