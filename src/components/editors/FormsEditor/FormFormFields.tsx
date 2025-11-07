/**
 * FormFormFields Component
 * Domain-specific form fields for creating/editing forms
 * Includes form metadata and field collection management
 */

import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import { FieldCollection } from './FieldCollection';
import { PostSubmissionConfig } from './PostSubmissionConfig';
import type { ConversationalForm } from '@/types/config';
import type { FormFieldsProps } from '@/lib/crud/types';

export const FormFormFields: React.FC<FormFieldsProps<ConversationalForm>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const programs = useConfigStore((state) => state.programs.getAllPrograms());

  // Program options for dropdown
  const programOptions = programs.map((p) => ({
    value: p.program_id,
    label: p.program_name,
  }));

  return (
    <>
      {/* Form ID */}
      <Input
        label="Form ID"
        id="form-id"
        placeholder="e.g., volunteer_application"
        value={value.form_id}
        onChange={(e) => onChange({ ...value, form_id: e.target.value })}
        onBlur={() => onBlur('form_id')}
        error={touched.form_id ? errors.form_id : undefined}
        helperText={
          isEditMode
            ? 'Form ID cannot be changed'
            : 'Lowercase letters, numbers, hyphens, and underscores only'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Title */}
      <Input
        label="Form Title"
        id="form-title"
        placeholder="e.g., Volunteer Application"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        onBlur={() => onBlur('title')}
        error={touched.title ? errors.title : undefined}
        helperText="Display name shown to users"
        required
        autoFocus={isEditMode}
      />

      {/* Program Assignment */}
      <div className="w-full">
        <Select
          label="Program"
          value={value.program}
          onValueChange={(newValue) => {
            onChange({ ...value, program: newValue });
          }}
          options={programOptions}
          error={touched.program ? errors.program : undefined}
          required
          disabled={programs.length === 0}
        />
        {programs.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            No programs available. Create a program first.
          </p>
        )}
        {!errors.program && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Assign this form to a program
          </p>
        )}
      </div>

      {/* Description */}
      <div className="w-full">
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description <span className="text-red-600">*</span>
        </label>
        <Textarea
          id="description"
          placeholder="Brief description of this form..."
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          onBlur={() => onBlur('description')}
          rows={2}
        />
        {touched.description && errors.description && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.description}
          </p>
        )}
        {!errors.description && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Internal description of what this form is for (not shown to users)
          </p>
        )}
      </div>

      {/* Introduction (user-facing) */}
      <div className="w-full">
        <label
          htmlFor="introduction"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Form Introduction (Optional)
        </label>
        <Textarea
          id="introduction"
          placeholder="e.g., This form will help us learn more about your interest in becoming a Love Box sponsor. It should take about 5 minutes to complete. If you have questions, email sponsors@example.com"
          value={value.introduction || ''}
          onChange={(e) => onChange({ ...value, introduction: e.target.value })}
          onBlur={() => onBlur('introduction')}
          rows={4}
        />
        {touched.introduction && errors.introduction && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.introduction}
          </p>
        )}
        {!errors.introduction && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Introduction message shown to users before the form begins. Include time estimate, expectations, and contact info. URLs will be automatically linked.
          </p>
        )}
      </div>

      {/* Note: Trigger phrases removed - forms are now triggered via explicit CTA routing in conversational branches */}

      {/* Enabled Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Form Enabled
          </span>
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Disabled forms won't be triggered)
        </p>
      </div>

      {/* Field Collection */}
      <div className="border-t pt-4">
        <FieldCollection
          fields={value.fields}
          onChange={(newFields) => onChange({ ...value, fields: newFields })}
          errors={errors.fields}
          touched={touched.fields}
        />
      </div>

      {/* Post-Submission Configuration */}
      <PostSubmissionConfig
        value={value.post_submission}
        onChange={(newConfig) => onChange({ ...value, post_submission: newConfig })}
        errors={errors.post_submission}
        touched={touched.post_submission}
        onBlur={() => onBlur('post_submission')}
      />
    </>
  );
};
