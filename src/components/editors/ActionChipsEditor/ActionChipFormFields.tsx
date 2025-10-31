/**
 * ActionChipFormFields Component
 * Domain-specific form fields for editing Action Chips
 *
 * Action chips have read-only structure (label, value) but allow editing target_branch
 */

import React from 'react';
import { Input, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { ActionChipEntity } from './types';

export const ActionChipFormFields: React.FC<FormFieldsProps<ActionChipEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const branches = useConfigStore((state) => state.branches.getAllBranches());

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

      {/* Value/Query */}
      <Input
        label="Query"
        id="value"
        placeholder="e.g., Show me available resources"
        value={value.value}
        onChange={(e) => onChange({ ...value, value: e.target.value })}
        onBlur={() => onBlur('value')}
        error={touched.value ? errors.value : undefined}
        helperText="Query sent to AI when chip is clicked"
        required
      />

      {/* Target Branch - EDITABLE */}
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

      {/* Info callout about action chip routing */}
      <div className="w-full p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Tier 1 Routing:</strong> Action chips provide explicit routing to conversation branches.
          When users click a chip, they'll be routed to the selected branch immediately, bypassing keyword matching.
        </p>
      </div>
    </>
  );
};
