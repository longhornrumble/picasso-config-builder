/**
 * AvailableActionsFormFields Component
 * Domain-specific form fields for creating/editing vocabulary entries
 *
 * Renders conditional fields based on type (form vs link).
 */

import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { AvailableActionEntity } from './types';
import type { AvailableActionType } from '@/types/config';

export const AvailableActionsFormFields: React.FC<FormFieldsProps<AvailableActionEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const branches = useConfigStore((state) => state.branches.getAllBranches());

  const typeOptions = [
    { value: 'form', label: 'Form' },
    { value: 'link', label: 'Link' },
  ];

  return (
    <>
      {/* Action ID */}
      <Input
        label="Action ID"
        id="actionId"
        placeholder="e.g., lb_apply or donate"
        value={value.actionId}
        onChange={(e) => onChange({ ...value, actionId: e.target.value })}
        onBlur={() => onBlur('actionId')}
        error={touched.actionId ? errors.actionId : undefined}
        helperText={
          isEditMode
            ? 'Action ID cannot be changed'
            : 'Unique identifier used in AI vocabulary tags (e.g., apply:lb_apply or link:donate)'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Type */}
      <Select
        label="Type"
        value={value.type || 'form'}
        onValueChange={(newValue) => {
          const newType = newValue as AvailableActionType;
          // Clear type-specific fields when switching
          const updated: AvailableActionEntity = {
            ...value,
            type: newType,
            // Clear form-specific fields
            description: newType === 'link' ? undefined : value.description,
            direct_cta: newType === 'link' ? undefined : value.direct_cta,
            show_info: newType === 'link' ? undefined : value.show_info,
            prompt: newType === 'link' ? undefined : value.prompt,
            target_branch: newType === 'link' ? undefined : value.target_branch,
            // Clear link-specific fields
            url: newType === 'form' ? undefined : value.url,
          };
          onChange(updated);
        }}
        options={typeOptions}
        error={touched.type ? errors.type : undefined}
        required
      />

      {/* Label */}
      <Input
        label="Label"
        id="label"
        placeholder={value.type === 'form' ? 'e.g., Apply to Love Box' : 'e.g., Make a Donation'}
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
        onBlur={() => onBlur('label')}
        error={touched.label ? errors.label : undefined}
        helperText="Display name shown on the CTA button"
        required
        autoFocus={isEditMode}
      />

      {/* === FORM-SPECIFIC FIELDS === */}
      {value.type === 'form' && (
        <>
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
              placeholder="Brief description for the AI vocabulary context..."
              value={value.description || ''}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              onBlur={() => onBlur('description')}
              rows={3}
            />
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Helps the AI understand when to offer this form
            </p>
          </div>

          {/* Direct CTA */}
          <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                Direct CTA
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Show as a prominent button in AI responses
              </p>
            </div>
            <input
              type="checkbox"
              checked={value.direct_cta || false}
              onChange={(e) => onChange({ ...value, direct_cta: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Show Info */}
          <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                Show Info First
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Display informational text instead of starting the form immediately
              </p>
            </div>
            <input
              type="checkbox"
              checked={value.show_info || false}
              onChange={(e) => onChange({ ...value, show_info: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Show Info sub-fields */}
          {value.show_info && (
            <>
              {/* Info Prompt */}
              <div className="w-full">
                <label
                  htmlFor="prompt"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Info Prompt <span className="text-red-600">*</span>
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Text displayed when user clicks the CTA..."
                  value={value.prompt || ''}
                  onChange={(e) => onChange({ ...value, prompt: e.target.value })}
                  onBlur={() => onBlur('prompt')}
                  rows={4}
                  className="min-h-[100px]"
                />
                {touched.prompt && errors.prompt && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.prompt}
                  </p>
                )}
                {!errors.prompt && (
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Static content shown to the user (no Bedrock call). Max 1000 characters.
                  </p>
                )}
              </div>

              {/* Target Branch */}
              <div className="w-full">
                <Select
                  label="Target Branch"
                  value={value.target_branch || ''}
                  onValueChange={(newValue) =>
                    onChange({ ...value, target_branch: newValue || undefined })
                  }
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.id,
                  }))}
                  placeholder="Select a branch..."
                  helperText="Branch CTAs to show after displaying the info prompt"
                  disabled={branches.length === 0}
                />
                {branches.length === 0 && (
                  <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
                    No branches available. Create a branch first.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* === LINK-SPECIFIC FIELDS === */}
      {value.type === 'link' && (
        <Input
          label="URL"
          id="url"
          placeholder="https://example.com/donate"
          value={value.url || ''}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          onBlur={() => onBlur('url')}
          error={touched.url ? errors.url : undefined}
          helperText="External link to open when the AI offers this action"
          required
        />
      )}
    </>
  );
};
