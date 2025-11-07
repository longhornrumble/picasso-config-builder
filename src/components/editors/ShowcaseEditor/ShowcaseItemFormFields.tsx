/**
 * ShowcaseItemFormFields Component
 * Domain-specific form fields for creating/editing showcase items
 */

import React, { useState } from 'react';
import { Input, Textarea, Select, Button, Badge } from '@/components/ui';
import { Plus, X, Tag, Sparkles } from 'lucide-react';
import { useConfigStore } from '@/store';
import { ShowcaseItemPreview } from './ShowcaseItemPreview';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { ShowcaseItemEntity } from './types';
import type { ShowcaseItemType } from '@/types/config';

export const ShowcaseItemFormFields: React.FC<FormFieldsProps<ShowcaseItemEntity>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const ctas = useConfigStore((state) => state.ctas.getAllCTAs());
  const programs = useConfigStore((state) => state.programs.getAllPrograms());

  // Type options for dropdown
  const typeOptions = [
    { value: 'program', label: 'Program' },
    { value: 'event', label: 'Event' },
    { value: 'initiative', label: 'Initiative' },
    { value: 'campaign', label: 'Campaign' },
  ];

  // Program options for dropdown
  const programOptions = programs.map((p) => ({
    value: p.program_id,
    label: p.program_name || p.program_id,
  }));

  // CTA options for dropdown
  const ctaOptions = [
    { value: '__none__', label: 'None (Optional)' },
    ...ctas.map((cta) => ({
      value: cta.id,
      label: cta.cta.label,
    })),
  ];

  // Add keyword to array
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !value.keywords.includes(keyword)) {
      onChange({
        ...value,
        keywords: [...value.keywords, keyword],
      });
      setKeywordInput('');
      onBlur('keywords');
    }
  };

  // Remove keyword from array
  const handleRemoveKeyword = (keyword: string) => {
    onChange({
      ...value,
      keywords: value.keywords.filter((k) => k !== keyword),
    });
  };

  // Add highlight to array
  const handleAddHighlight = () => {
    const highlight = highlightInput.trim();
    if (highlight && !value.highlights?.includes(highlight)) {
      onChange({
        ...value,
        highlights: [...(value.highlights || []), highlight],
      });
      setHighlightInput('');
    }
  };

  // Remove highlight from array
  const handleRemoveHighlight = (highlight: string) => {
    onChange({
      ...value,
      highlights: value.highlights?.filter((h) => h !== highlight) || [],
    });
  };

  return (
    <>
      {/* Item ID */}
      <Input
        label="Item ID"
        id="id"
        placeholder="e.g., volunteer_program_showcase"
        value={value.id}
        onChange={(e) => onChange({ ...value, id: e.target.value })}
        onBlur={() => onBlur('id')}
        error={touched.id ? errors.id : undefined}
        helperText={
          isEditMode
            ? 'Item ID cannot be changed'
            : 'Unique identifier (letters, numbers, hyphens, underscores)'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Type and Enabled - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <Select
          label="Type"
          value={value.type}
          onValueChange={(newValue) =>
            onChange({ ...value, type: newValue as ShowcaseItemType })
          }
          options={typeOptions}
          error={touched.type ? errors.type : undefined}
          required
        />

        <div className="flex items-center gap-2 pt-7">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enabled
            </span>
          </label>
        </div>
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
          helperText="Associate this showcase item with a specific program"
          disabled={programs.length === 0}
        />
        {programs.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            No programs available. Create a program first.
          </p>
        )}
      </div>

      {/* Name */}
      <Input
        label="Name"
        id="name"
        placeholder="e.g., Community Volunteer Program"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        onBlur={() => onBlur('name')}
        error={touched.name ? errors.name : undefined}
        helperText="Display name shown to users"
        required
        autoFocus={isEditMode}
      />

      {/* Tagline */}
      <Input
        label="Tagline"
        id="tagline"
        placeholder="e.g., Make a difference in your community"
        value={value.tagline}
        onChange={(e) => onChange({ ...value, tagline: e.target.value })}
        onBlur={() => onBlur('tagline')}
        error={touched.tagline ? errors.tagline : undefined}
        helperText="Short, catchy tagline"
        required
      />

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
          placeholder="Detailed description of this showcase item..."
          value={value.description}
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
            Full description of the showcase item
          </p>
        )}
      </div>

      {/* Image URL */}
      <Input
        label="Image URL"
        id="image_url"
        placeholder="https://example.com/image.jpg"
        value={value.image_url || ''}
        onChange={(e) => onChange({ ...value, image_url: e.target.value })}
        onBlur={() => onBlur('image_url')}
        error={touched.image_url ? errors.image_url : undefined}
        helperText="Optional image for this item"
      />

      {/* Stats */}
      <Input
        label="Stats"
        id="stats"
        placeholder="e.g., 2-3 hours/month"
        value={value.stats || ''}
        onChange={(e) => onChange({ ...value, stats: e.target.value })}
        onBlur={() => onBlur('stats')}
        helperText="Optional stat or time commitment"
      />

      {/* Testimonial */}
      <div className="w-full">
        <label
          htmlFor="testimonial"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Testimonial
        </label>
        <Textarea
          id="testimonial"
          placeholder="e.g., Best experience! - Sarah M."
          value={value.testimonial || ''}
          onChange={(e) => onChange({ ...value, testimonial: e.target.value })}
          onBlur={() => onBlur('testimonial')}
          rows={2}
        />
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Optional testimonial or quote
        </p>
      </div>

      {/* Highlights */}
      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Highlights
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            id="highlight-input"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHighlight();
              }
            }}
            placeholder="Add highlight..."
          />
          <Button
            type="button"
            onClick={handleAddHighlight}
            disabled={!highlightInput.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {value.highlights && value.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {value.highlights.map((highlight, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {highlight}
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(highlight)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Optional bullet points (tip: use even numbers for balanced two-column layout)
        </p>
      </div>

      {/* Keywords */}
      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Keywords <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            id="keyword-input"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddKeyword();
              }
            }}
            placeholder="Add keyword..."
          />
          <Button
            type="button"
            onClick={handleAddKeyword}
            disabled={!keywordInput.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {value.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {value.keywords.map((keyword, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                <Tag className="w-3 h-3" />
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {touched.keywords && errors.keywords && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.keywords}
          </p>
        )}
        {!errors.keywords && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Keywords that will trigger this showcase item
          </p>
        )}
      </div>

      {/* Action Configuration */}
      <div className="w-full space-y-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Card Action
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            (Optional)
          </span>
        </div>

        <Select
          label="Action Type"
          value={value.action?.type || '__none__'}
          onValueChange={(newType) => {
            if (newType === '__none__') {
              onChange({ ...value, action: undefined });
            } else {
              onChange({
                ...value,
                action: {
                  type: newType as 'prompt' | 'url' | 'cta',
                  label: value.action?.label || 'Learn More'
                }
              });
            }
          }}
          options={[
            { value: '__none__', label: 'No Action' },
            { value: 'prompt', label: 'Ask Bedrock' },
            { value: 'url', label: 'External Link' },
            { value: 'cta', label: 'Trigger CTA' },
          ]}
          helperText="What happens when user clicks the card button?"
        />

        {value.action && (
          <>
            <Input
              label="Button Label"
              value={value.action.label}
              onChange={(e) => onChange({
                ...value,
                action: { ...value.action!, label: e.target.value }
              })}
              placeholder="e.g., Learn More, Get Details"
              helperText="Text shown on the action button"
              required
            />

            {value.action.type === 'prompt' && (
              <div className="w-full">
                <label
                  htmlFor="action-prompt"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bedrock Prompt <span className="text-red-600">*</span>
                </label>
                <Textarea
                  id="action-prompt"
                  value={value.action.prompt || ''}
                  onChange={(e) => onChange({
                    ...value,
                    action: { ...value.action!, prompt: e.target.value }
                  })}
                  placeholder="e.g., Tell me about the golf tournament and how to register"
                  rows={2}
                />
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  This will appear as a user message and be sent to Bedrock
                </p>
              </div>
            )}

            {value.action.type === 'url' && (
              <>
                <Input
                  label="URL"
                  value={value.action.url || ''}
                  onChange={(e) => onChange({
                    ...value,
                    action: { ...value.action!, url: e.target.value }
                  })}
                  placeholder="https://example.com/event-details"
                  helperText="External link to open"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="open-new-tab"
                    checked={value.action.open_in_new_tab || false}
                    onChange={(e) => onChange({
                      ...value,
                      action: { ...value.action!, open_in_new_tab: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="open-new-tab"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Open in new tab
                  </label>
                </div>
              </>
            )}

            {value.action.type === 'cta' && (
              <div className="w-full">
                <Select
                  label="Select CTA"
                  value={value.action.cta_id || '__none__'}
                  onValueChange={(ctaId) => onChange({
                    ...value,
                    action: {
                      ...value.action!,
                      cta_id: ctaId === '__none__' ? undefined : ctaId
                    }
                  })}
                  options={ctaOptions}
                  helperText="CTA to trigger when button is clicked"
                  disabled={ctas.length === 0}
                  required
                />
                {ctas.length === 0 && (
                  <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
                    No CTAs available. CTAs can be created in the CTAs section.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Live Preview */}
      <div className="w-full mt-6">
        <ShowcaseItemPreview item={value} />
      </div>
    </>
  );
};
