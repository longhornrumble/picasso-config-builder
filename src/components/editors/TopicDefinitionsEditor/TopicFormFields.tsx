/**
 * TopicFormFields Component
 * Domain-specific form fields for creating and editing topic definitions.
 *
 * Implements FormFieldsProps<TopicEntity>. Handles:
 * - Topic Name (snake_case identifier, disabled in edit mode)
 * - Description (for the classifier — quality drives CTA accuracy)
 * - Tags (inline tag pill input — links topic to CTAs via selection_metadata)
 * - Role (optional audience filter axis)
 * - Depth Override (checkbox, only shown when tags are present)
 */

import React, { useRef, useState, useCallback, useId } from 'react';
import { X } from 'lucide-react';
import { Input, Textarea, Select } from '@/components/ui';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { TopicRole } from '@/types/config';
import type { TopicEntity } from './types';

// ============================================================================
// TAG INPUT SUB-COMPONENT
// ============================================================================

interface TagInputProps {
  /** Current tag array */
  tags: string[];
  /** Called when the tag array changes */
  onChange: (tags: string[]) => void;
  /** Whether to show the empty-tags helper message */
  showEmptyHelper?: boolean;
  /** id prefix for a11y label wiring */
  labelId?: string;
}

/**
 * Inline tag pill input.
 *
 * Keyboard behaviour:
 * - Enter or comma — commit the current input as a new tag
 * - Backspace on empty input — remove the last tag
 * - Tab — commits a non-empty input value then moves focus normally
 *
 * Tags are normalised to snake_case (spaces replaced with underscores, lowercased)
 * before being added to the list.
 */
const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  showEmptyHelper = false,
  labelId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const normalise = (raw: string): string =>
    raw.trim().toLowerCase().replace(/\s+/g, '_');

  const commit = useCallback(() => {
    const tag = normalise(inputValue);
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInputValue('');
  }, [inputValue, tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    // Commit any pending value when focus leaves the input
    if (inputValue.trim()) {
      commit();
    }
  };

  return (
    <div>
      {/* Pill list + text input combined container */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
          dark:border-gray-600 dark:bg-gray-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-0 focus-within:border-green-500"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={`${listId}-hint`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing tags as removable pills */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800
              dark:bg-emerald-900/40 dark:text-emerald-200"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5
                hover:bg-emerald-200 dark:hover:bg-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <X className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          </span>
        ))}

        {/* Text input for new tags */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
          aria-label="New tag input"
          className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>

      {/* Helper texts */}
      <p
        id={`${listId}-hint`}
        className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
      >
        {showEmptyHelper && tags.length === 0
          ? 'No tags = informational topic (no CTAs shown). Add tags to link this topic to CTAs.'
          : 'Enter snake_case tags matching CTA selection_metadata.topic_tags. Press Enter or , to add.'}
      </p>
    </div>
  );
};

// ============================================================================
// ROLE SELECT OPTIONS
// ============================================================================

/**
 * Sentinel used as the Select value for the "no role" option.
 * Radix UI forbids an empty-string value on SelectItem, so we use a
 * sentinel and translate it to undefined when calling onChange.
 */
const ROLE_NONE_SENTINEL = '__none__';

const ROLE_OPTIONS = [
  { value: ROLE_NONE_SENTINEL, label: 'None (no role filter)' },
  { value: 'give', label: 'give — donor / contributor audience' },
  { value: 'receive', label: 'receive — beneficiary / recipient audience' },
  { value: 'learn', label: 'learn — information-seeker (always passes role filter)' },
  { value: 'connect', label: 'connect — volunteer / partner audience' },
];

// ============================================================================
// MAIN FORM FIELDS COMPONENT
// ============================================================================

/**
 * TopicFormFields — domain-specific fields rendered inside the generic EntityForm modal.
 *
 * Field order follows the classifier mental model:
 * 1. Topic Name — the unique key
 * 2. Description — what the classifier reads
 * 3. Tags — which CTAs this topic surfaces
 * 4. Role — optional audience axis
 * 5. Depth Override — shown only when tags are present
 */
export const TopicFormFields: React.FC<FormFieldsProps<TopicEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const descriptionLabelId = useId();
  const tagsLabelId = useId();
  const hasTags = Array.isArray(value.tags) && value.tags.length > 0;

  return (
    <>
      {/* -----------------------------------------------------------------
          Topic Name (= name field; acts as the unique key)
          Disabled in edit mode — changing the key would break references.
      ------------------------------------------------------------------ */}
      <Input
        label="Topic Name"
        id="topic-name"
        placeholder="e.g., donating"
        value={value.topicName}
        onChange={(e) => {
          const v = e.target.value;
          onChange({ ...value, topicName: v, name: v });
        }}
        onBlur={() => onBlur('topicName')}
        error={touched.topicName ? errors.topicName : undefined}
        helperText={
          isEditMode
            ? 'Topic name cannot be changed after creation'
            : 'Lowercase letters and underscores only (snake_case). Used in logs and analytics.'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* -----------------------------------------------------------------
          Description
          This is what the classifier reads — quality matters enormously.
      ------------------------------------------------------------------ */}
      <div className="w-full">
        <label
          id={descriptionLabelId}
          htmlFor="topic-description"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description <span className="text-red-600" aria-hidden="true">*</span>
        </label>
        <Textarea
          id="topic-description"
          placeholder="Describe what this topic covers in plain language. Include specific KB terms and NOT statements to disambiguate from similar topics."
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          onBlur={() => onBlur('description')}
          rows={6}
          aria-labelledby={descriptionLabelId}
          aria-required="true"
          aria-invalid={touched.description && !!errors.description}
          aria-describedby={
            touched.description && errors.description
              ? 'description-error'
              : 'description-hint'
          }
          autoFocus={isEditMode}
        />
        {touched.description && errors.description ? (
          <p id="description-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.description}
          </p>
        ) : (
          <p id="description-hint" className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Write for the classifier. Include specific KB terms and NOT statements to
            disambiguate. Minimum 20 characters.
          </p>
        )}
      </div>

      {/* -----------------------------------------------------------------
          Tags
          Tags drive CTA pool selection — empty = informational topic.
      ------------------------------------------------------------------ */}
      <div className="w-full">
        <label
          id={tagsLabelId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Tags
        </label>
        <TagInput
          tags={value.tags ?? []}
          onChange={(tags) => onChange({ ...value, tags })}
          showEmptyHelper
          labelId={tagsLabelId}
        />
        {touched.tags && errors.tags && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.tags}
          </p>
        )}
      </div>

      {/* -----------------------------------------------------------------
          Role
          Filters CTAs by selection_metadata.role_axis.
          'learn' always passes the filter.
      ------------------------------------------------------------------ */}
      <div className="w-full">
        <Select
          label="Role"
          value={value.role ?? ROLE_NONE_SENTINEL}
          onValueChange={(v) =>
            onChange({
              ...value,
              role: v === ROLE_NONE_SENTINEL ? undefined : (v as TopicRole),
            })
          }
          options={ROLE_OPTIONS}
          helperText='"learn" always passes the role filter regardless of CTA role_axis. Leave as None if no audience segmentation is needed.'
        />
      </div>

      {/* -----------------------------------------------------------------
          Depth Override
          Only relevant when the topic has tags (i.e., it surfaces CTAs).
          Bypasses the learn-first phase and shows action CTAs immediately.
      ------------------------------------------------------------------ */}
      {hasTags && (
        <div className="w-full">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="depth-override"
              checked={value.depth_override === 'action'}
              onChange={(e) =>
                onChange({
                  ...value,
                  depth_override: e.target.checked ? 'action' : undefined,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600
                focus:ring-2 focus:ring-green-500 focus:ring-offset-0
                dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-green-500"
              aria-describedby="depth-override-hint"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                Always show action CTAs (skip learn phase)
              </span>
              <span
                id="depth-override-hint"
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                When checked, sets depth_override to "action". Use for "I'm ready NOW" intents
                where the user is clearly ready to act, not just learning.
              </span>
            </span>
          </label>
        </div>
      )}
    </>
  );
};
