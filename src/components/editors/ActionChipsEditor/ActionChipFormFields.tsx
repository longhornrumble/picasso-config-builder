/**
 * ActionChipFormFields Component
 * Domain-specific form fields for editing Action Chips
 *
 * Action chips have read-only structure (label, value) but allow editing target_branch
 */

import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { useConfigStore, useContentShowcase } from '@/store';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { ActionChipEntity } from './types';
import type { ActionChipActionType } from '@/types/config';

export const ActionChipFormFields: React.FC<FormFieldsProps<ActionChipEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const branches = useConfigStore((state) => state.branches.getAllBranches());
  const programs = useConfigStore((state) => state.programs.getAllPrograms());
  const { getShowcaseItems } = useContentShowcase();
  const showcaseItems = getShowcaseItems();

  // Action options
  const actionOptions = [
    { value: 'send_query', label: 'Send Query (to Bedrock)' },
    { value: 'show_info', label: 'Show Info (static message)' },
    { value: 'show_showcase', label: 'Show Showcase Item (bypass Bedrock)' },
  ];

  // Showcase item options for dropdown
  const showcaseOptions = showcaseItems.map((item) => ({
    value: item.id,
    label: item.name || item.id,
  }));

  // Program options for dropdown
  const programOptions = programs.map((p) => ({
    value: p.program_id,
    label: p.program_name || p.program_id,
  }));

  return (
    <>
      {/* Chip ID (read-only) */}
      <Input
        label="Chip ID"
        id="chipId"
        placeholder="e.g., help_me"
        value={value.chipId}
        onChange={(e) => onChange({ ...value, chipId: e.target.value })}
        onBlur={() => onBlur('chipId')}
        error={touched.chipId ? errors.chipId : undefined}
        helperText={
          isEditMode
            ? 'Chip ID cannot be changed'
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
        placeholder="e.g., Help me find resources"
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
        onBlur={() => onBlur('label')}
        error={touched.label ? errors.label : undefined}
        helperText="Display text shown to users"
        required
        autoFocus={isEditMode}
      />

      {/* Action */}
      <Select
        label="Action"
        value={value.action || 'send_query'}
        onValueChange={(newValue) => {
          const newAction = newValue as ActionChipActionType;
          // Clear conflicting fields when switching action type
          const updates: Partial<ActionChipEntity> = { action: newAction };
          if (newAction === 'show_showcase') {
            // Clear query-related fields, keep showcase
            updates.value = '';
            updates.target_branch = undefined;
          } else {
            // Clear showcase-related field
            updates.target_showcase_id = undefined;
          }
          onChange({ ...value, ...updates });
        }}
        options={actionOptions}
        helperText="Determines how the chip behaves when clicked"
        required
      />

      {/* Showcase Item - only shown when action = 'show_showcase' */}
      {value.action === 'show_showcase' && (
        <div className="w-full">
          <Select
            label="Showcase Item"
            value={value.target_showcase_id || ''}
            onValueChange={(newValue) =>
              onChange({ ...value, target_showcase_id: newValue || undefined })
            }
            options={showcaseOptions}
            placeholder="Select a showcase item..."
            helperText="The showcase card to display when this chip is clicked"
            required
            disabled={showcaseItems.length === 0}
          />
          {showcaseItems.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              No showcase items available. Create a showcase item first.
            </p>
          )}
        </div>
      )}

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
          helperText="Associate this action chip with a specific program"
          disabled={programs.length === 0}
        />
        {programs.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            No programs available. Create a program first.
          </p>
        )}
      </div>

      {/* Value/Query - Label changes based on action - Hidden for show_showcase */}
      {value.action !== 'show_showcase' && (
        <div className="w-full">
          <label
            htmlFor="value"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {value.action === 'show_info' ? 'Message' : 'Query'} <span className="text-red-600">*</span>
          </label>
          <Textarea
            id="value"
            placeholder={
              value.action === 'show_info'
                ? 'e.g., We have two programs available...'
                : 'e.g., Show me available resources'
            }
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            onBlur={() => onBlur('value')}
            rows={6}
            className="min-h-[120px]"
          />
          {touched.value && errors.value && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.value}
            </p>
          )}
          {!errors.value && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {value.action === 'show_info'
                ? 'Static message displayed to user (no Bedrock call). Supports multiple paragraphs.'
                : 'Query sent to AI when chip is clicked. Supports multiple paragraphs.'}
            </p>
          )}
        </div>
      )}

      {/* Target Branch - Hidden for show_showcase */}
      {value.action !== 'show_showcase' && (
        <div className="w-full">
          <Select
            label="Target Branch"
            value={value.target_branch || '__fallback__'}
            onValueChange={(newValue) =>
              onChange({
                ...value,
                target_branch: newValue === '__fallback__' ? undefined : newValue,
              })
            }
            options={[
              { value: '__fallback__', label: 'Use fallback routing' },
              ...branches.map((b) => ({
                value: b.id,
                label: b.id,
              })),
            ]}
            helperText="Branch to show when this chip is clicked (leave empty for fallback)"
            disabled={branches.length === 0}
          />
          {branches.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              No branches available. Create a branch first to enable explicit routing.
            </p>
          )}
        </div>
      )}

      {/* Info callout about action chip routing - context-aware */}
      <div className="w-full p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {value.action === 'show_showcase' ? (
            <>
              <strong>Direct Showcase:</strong> When users click this chip, the selected showcase item will display
              immediately as a "digital flyer" card with its embedded CTAs. Bypasses Bedrock entirely.
            </>
          ) : (
            <>
              <strong>Tier 1 Routing:</strong> Action chips provide explicit routing to conversation branches.
              When users click a chip, they'll be routed to the selected branch immediately, bypassing keyword matching.
            </>
          )}
        </p>
      </div>
    </>
  );
};
