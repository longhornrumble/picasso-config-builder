/**
 * CTAFormFields Component
 * Domain-specific form fields for creating/editing CTAs
 *
 * This component handles conditional field rendering based on action type.
 * All validation, state management, and form submission is handled by the generic EntityForm.
 */

import React, { useState } from 'react';
import { Input, Textarea, Select, Badge, Button } from '@/components/ui';
import { Tag, X, Plus } from 'lucide-react';
import { useConfigStore } from '@/store';
import { CTAPreview } from './CTAPreview';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { CTAEntity } from './types';
import type { CTAActionType, CTAType, DepthLevel, TopicRole } from '@/types/config';

export const CTAFormFields: React.FC<FormFieldsProps<CTAEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const forms = useConfigStore((state) => state.forms.getAllForms());
  const branches = useConfigStore((state) => state.branches.getAllBranches());
  const programs = useConfigStore((state) => state.programs.getAllPrograms());

  const [tagInput, setTagInput] = useState('');

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

  const formOptions = forms.map((f) => ({
    value: f.form_id,
    label: f.title,
  }));

  const programOptions = programs.map((p) => ({
    value: p.program_id,
    label: p.program_name || p.program_id,
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

      {/* Action & Type - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* Action */}
        <Select
          label="Action"
          value={value.action || ''}
          onValueChange={(newValue) => {
            const newAction = newValue as CTAActionType;

            // Map action to corresponding type
            const actionToTypeMap: Record<CTAActionType, CTAType> = {
              start_form: 'form_trigger',
              external_link: 'external_link',
              send_query: 'bedrock_query',
              show_info: 'info_request',
            };

            // Update action, type, and clear conditional fields
            const updated = {
              ...value,
              action: newAction,
              type: actionToTypeMap[newAction], // Auto-update type to match action
            };
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
          value={value.type || ''}
          onValueChange={(newValue) =>
            onChange({ ...value, type: newValue as CTAType })
          }
          options={typeOptions}
          error={touched.type ? errors.type : undefined}
          required
        />
      </div>

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
          helperText="Associate this CTA with a specific program"
          disabled={programs.length === 0}
        />
        {programs.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            No programs available. Create a program first.
          </p>
        )}
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
            rows={6}
            className="min-h-[120px]"
          />
          {touched.query && errors.query && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.query}
            </p>
          )}
          {!errors.query && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Query sent to AI when button is clicked. Supports multiple paragraphs.
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
            Message <span className="text-red-600">*</span>
          </label>
          <Textarea
            id="prompt"
            placeholder="Enter information to display..."
            value={value.prompt || ''}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
            onBlur={() => onBlur('prompt')}
            rows={6}
            className="min-h-[120px]"
          />
          {touched.prompt && errors.prompt && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.prompt}
            </p>
          )}
          {!errors.prompt && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Static message displayed to user (no Bedrock call). Supports multiple paragraphs.
            </p>
          )}
        </div>
      )}

      {/* Target Branch - Only when NOT using V4.1 pool selection */}
      {!value.ai_available && (value.action === 'show_info' || value.action === 'send_query') && (
        <div className="w-full">
          <Select
            label="Target Branch"
            value={value.target_branch || '__auto__'}
            onValueChange={(newValue) =>
              onChange({ ...value, target_branch: newValue === '__auto__' ? undefined : newValue })
            }
            options={[
              { value: '__auto__', label: 'Auto-detect from keywords' },
              ...branches.map((b) => ({
                value: b.id,
                label: b.id,
              })),
            ]}
            helperText="Branch to show after clicking this CTA (leave empty for auto-detect via keywords)"
            disabled={branches.length === 0}
          />
          {branches.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              No branches available. Branch routing will use keyword detection.
            </p>
          )}
        </div>
      )}

      {/* AI Available */}
      <div className="flex items-center gap-2 w-full">
        <input
          type="checkbox"
          id="ai_available"
          checked={value.ai_available || false}
          onChange={(e) => onChange({ ...value, ai_available: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label
          htmlFor="ai_available"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          Include in AI selection pool
        </label>
      </div>

      {/* Pool Selection (V4.1) — only shown when ai_available is checked */}
      {value.ai_available && (() => {
        const currentTags = value.selection_metadata?.topic_tags ?? [];

        const handleAddTag = () => {
          const tag = tagInput.trim();
          if (tag && !currentTags.includes(tag)) {
            onChange({
              ...value,
              selection_metadata: {
                topic_tags: [...currentTags, tag],
                depth_level: value.selection_metadata?.depth_level ?? 'info',
                role_axis: value.selection_metadata?.role_axis,
                core_learning: value.selection_metadata?.core_learning,
                priority: value.selection_metadata?.priority,
              },
            });
            setTagInput('');
          }
        };

        const handleRemoveTag = (tag: string) => {
          onChange({
            ...value,
            selection_metadata: {
              topic_tags: currentTags.filter((t) => t !== tag),
              depth_level: value.selection_metadata?.depth_level ?? 'info',
              role_axis: value.selection_metadata?.role_axis,
              core_learning: value.selection_metadata?.core_learning,
              priority: value.selection_metadata?.priority,
            },
          });
        };

        const updateMeta = (patch: Record<string, any>) => {
          onChange({
            ...value,
            selection_metadata: {
              topic_tags: currentTags,
              depth_level: value.selection_metadata?.depth_level ?? 'info',
              role_axis: value.selection_metadata?.role_axis,
              core_learning: value.selection_metadata?.core_learning,
              priority: value.selection_metadata?.priority,
              ...patch,
            },
          });
        };

        return (
          <div className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pool Selection (V4.1)
            </h4>

            {/* Topic Tags */}
            <div className="w-full">
              <label htmlFor="topic-tag-input" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Topic Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="topic-tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="e.g., volunteering, food-assistance..."
                />
                <Button type="button" onClick={handleAddTag} disabled={!tagInput.trim()} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentTags.map((tag) => (
                    <Badge key={tag} variant="success" className="gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tags that link this CTA to classifier topics. Press Enter or click + to add.
              </p>
            </div>

            {/* Depth Level */}
            <Select
              label="Depth Level"
              value={value.selection_metadata?.depth_level ?? 'info'}
              onValueChange={(v) => updateMeta({ depth_level: v as DepthLevel })}
              options={[
                { value: 'info', label: 'Info — learning / exploring phase' },
                { value: 'action', label: 'Action — ready to act now' },
                { value: 'lateral', label: 'Lateral — cross-cutting, always eligible' },
              ]}
              helperText="Controls when this CTA surfaces relative to the user's readiness"
            />

            {/* Role Axis */}
            <Select
              label="Role Axis"
              value={value.selection_metadata?.role_axis ?? '__none__'}
              onValueChange={(v) => updateMeta({ role_axis: v === '__none__' ? undefined : v as TopicRole })}
              options={[
                { value: '__none__', label: 'None (no role filter)' },
                { value: 'give', label: 'Give — donor / volunteer' },
                { value: 'receive', label: 'Receive — client / recipient' },
                { value: 'learn', label: 'Learn — passes all role filters' },
                { value: 'connect', label: 'Connect — partnership / community' },
              ]}
              helperText="Restrict this CTA to a specific audience role (optional)"
            />

            {/* Core Learning */}
            <div className="flex items-center gap-2 w-full">
              <input
                type="checkbox"
                id="core_learning"
                checked={value.selection_metadata?.core_learning ?? false}
                onChange={(e) => updateMeta({ core_learning: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="core_learning" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Hide when AI just answered this topic
              </label>
            </div>

            {/* Priority */}
            <Input
              label="Priority"
              id="priority"
              type="number"
              min={0}
              max={100}
              value={String(value.selection_metadata?.priority ?? 50)}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10);
                const clamped = isNaN(raw) ? 50 : Math.max(0, Math.min(100, raw));
                updateMeta({ priority: clamped });
              }}
              helperText="0 = highest priority, 100 = lowest. Default is 50."
            />
          </div>
        );
      })()}

      {/* Live Preview */}
      <div className="w-full mt-6">
        <CTAPreview cta={value} />
      </div>
    </>
  );
};
