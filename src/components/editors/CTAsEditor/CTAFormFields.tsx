/**
 * CTAFormFields Component
 * Domain-specific form fields for creating/editing CTAs
 *
 * This component handles conditional field rendering based on action type.
 * All validation, state management, and form submission is handled by the generic EntityForm.
 */

import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import { CTAPreview } from './CTAPreview';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { CTAEntity } from './types';
import type { CTAActionType, CTAType, CTAStyle } from '@/types/config';

export const CTAFormFields: React.FC<FormFieldsProps<CTAEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const forms = useConfigStore((state) => state.forms.getAllForms());

  // Options for dropdowns
  const actionOptions = [
    { value: 'start_form', label: 'Start Form' },
    { value: 'external_link', label: 'External Link' },
    { value: 'send_query', label: 'Send Query' },
    { value: 'show_info', label: 'Show Info' },
  ];

  const typeOptions = [
    { value: 'form_trigger', label: 'Form Trigger' },
    { value: 'external_link', label: 'External Link' },
    { value: 'bedrock_query', label: 'Bedrock Query' },
    { value: 'info_request', label: 'Info Request' },
  ];

  const styleOptions = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'info', label: 'Info' },
  ];

  const formOptions = forms.map((f) => ({
    value: f.form_id,
    label: f.title,
  }));

  return (
    <>
      {/* CTA ID */}
      <Input
        label="CTA ID"
        id="ctaId"
        placeholder="e.g., apply_now_btn"
        value={value.ctaId}
        onChange={(e) => onChange({ ...value, ctaId: e.target.value })}
        onBlur={() => onBlur('ctaId')}
        error={touched.ctaId ? errors.ctaId : undefined}
        helperText={
          isEditMode
            ? 'CTA ID cannot be changed'
            : 'Unique identifier (letters, numbers, hyphens, underscores)'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Label */}
      <Input
        label="Label"
        id="label"
        placeholder="e.g., Apply Now"
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
        onBlur={() => onBlur('label')}
        error={touched.label ? errors.label : undefined}
        helperText="Button text displayed to users"
        required
        autoFocus={isEditMode}
      />

      {/* Action, Type, Style - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Action */}
        <Select
          label="Action"
          value={value.action}
          onValueChange={(newValue) => {
            const newAction = newValue as CTAActionType;
            // Clear conditional fields when action changes
            const updated = { ...value, action: newAction };
            // Clear all conditional fields
            updated.formId = '';
            updated.url = '';
            updated.query = '';
            updated.prompt = '';
            onChange(updated);
          }}
          options={actionOptions}
          error={touched.action ? errors.action : undefined}
          required
        />

        {/* Type */}
        <Select
          label="Type"
          value={value.type}
          onValueChange={(newValue) =>
            onChange({ ...value, type: newValue as CTAType })
          }
          options={typeOptions}
          error={touched.type ? errors.type : undefined}
          required
        />

        {/* Style */}
        <Select
          label="Style"
          value={value.style}
          onValueChange={(newValue) =>
            onChange({ ...value, style: newValue as CTAStyle })
          }
          options={styleOptions}
          error={touched.style ? errors.style : undefined}
          required
        />
      </div>

      {/* Conditional Fields Based on Action */}

      {/* start_form action → formId field */}
      {value.action === 'start_form' && (
        <div className="w-full">
          <Select
            label="Form"
            value={value.formId || ''}
            onValueChange={(newValue) =>
              onChange({ ...value, formId: newValue })
            }
            options={formOptions}
            placeholder="Select a form..."
            error={touched.formId ? errors.formId : undefined}
            helperText="Form to start when button is clicked"
            required
            disabled={forms.length === 0}
          />
          {forms.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              No forms available. Create a form first.
            </p>
          )}
        </div>
      )}

      {/* external_link action → url field */}
      {value.action === 'external_link' && (
        <Input
          label="URL"
          id="url"
          placeholder="https://example.com"
          value={value.url || ''}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          onBlur={() => onBlur('url')}
          error={touched.url ? errors.url : undefined}
          helperText="External link to open"
          required
        />
      )}

      {/* send_query action → query field */}
      {value.action === 'send_query' && (
        <div className="w-full">
          <label
            htmlFor="query"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Query <span className="text-red-600">*</span>
          </label>
          <Textarea
            id="query"
            placeholder="Enter the query to send to Bedrock..."
            value={value.query || ''}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            onBlur={() => onBlur('query')}
            rows={3}
          />
          {touched.query && errors.query && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.query}
            </p>
          )}
          {!errors.query && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Query sent to AI when button is clicked
            </p>
          )}
        </div>
      )}

      {/* show_info action → prompt field */}
      {value.action === 'show_info' && (
        <div className="w-full">
          <label
            htmlFor="prompt"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt <span className="text-red-600">*</span>
          </label>
          <Textarea
            id="prompt"
            placeholder="Enter information to display..."
            value={value.prompt || ''}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
            onBlur={() => onBlur('prompt')}
            rows={3}
          />
          {touched.prompt && errors.prompt && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.prompt}
            </p>
          )}
          {!errors.prompt && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Information shown when button is clicked
            </p>
          )}
        </div>
      )}

      {/* Live Preview */}
      <div className="w-full mt-6">
        <CTAPreview cta={value} />
      </div>
    </>
  );
};
