/**
 * FieldEditor Component
 * Editor for individual form field with all properties
 */

import React from 'react';
import { Input, Textarea, Select, Button, Badge } from '@/components/ui';
import { X, Plus, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import type { FormField, FormFieldType, FormFieldOption } from '@/types/config';

export interface FieldEditorProps {
  field: FormField;
  index: number;
  totalFields: number;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  index,
  totalFields,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'textarea', label: 'Textarea (Long Text)' },
  ];

  const handleOptionChange = (index: number, key: 'value' | 'label', value: string) => {
    const updatedOptions = [...(field.options || [])];
    updatedOptions[index] = { ...updatedOptions[index], [key]: value };
    onChange({ ...field, options: updatedOptions });
  };

  const handleAddOption = () => {
    const newOption: FormFieldOption = { value: '', label: '' };
    onChange({ ...field, options: [...(field.options || []), newOption] });
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = (field.options || []).filter((_, i) => i !== index);
    onChange({ ...field, options: updatedOptions });
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-white dark:bg-gray-800">
      {/* Header with field number and actions */}
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Field {index + 1}</Badge>
          {field.required && <Badge variant="secondary">Required</Badge>}
          {field.eligibility_gate && <Badge variant="warning">Gate</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalFields - 1}
            title="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            title="Duplicate field"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete field"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Field ID */}
      <Input
        label="Field ID"
        id={`field-${index}-id`}
        value={field.id}
        onChange={(e) => onChange({ ...field, id: e.target.value })}
        placeholder="e.g., full_name"
        helperText="Unique identifier within this form"
        required
      />

      {/* Field Type and Required */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Field Type"
          value={field.type}
          onValueChange={(value) => onChange({ ...field, type: value as FormFieldType })}
          options={fieldTypeOptions}
          required
        />
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required Field
            </span>
          </label>
        </div>
      </div>

      {/* Label and Prompt */}
      <Input
        label="Label"
        id={`field-${index}-label`}
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
        placeholder="e.g., Full Name"
        helperText="Short label shown to users"
        required
      />

      <Textarea
        label="Prompt"
        id={`field-${index}-prompt`}
        value={field.prompt}
        onChange={(e) => onChange({ ...field, prompt: e.target.value })}
        placeholder="e.g., What's your full name?"
        rows={2}
      />
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Conversational prompt for collecting this field
      </p>

      {/* Hint */}
      <Input
        label="Hint (Optional)"
        id={`field-${index}-hint`}
        value={field.hint || ''}
        onChange={(e) => onChange({ ...field, hint: e.target.value })}
        placeholder="e.g., Enter your first and last name"
        helperText="Additional guidance for users"
      />

      {/* Options for select field type */}
      {field.type === 'select' && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dropdown Options <span className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Define value and label for each option. Value is used internally (e.g., "yes", "no"), Label is shown to users.
          </p>

          <div className="space-y-2">
            {(field.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="flex gap-2">
                <Input
                  placeholder="Value (e.g., yes)"
                  value={option.value}
                  onChange={(e) => handleOptionChange(optionIndex, 'value', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Label (e.g., Yes, I am 22 or older)"
                  value={option.label}
                  onChange={(e) => handleOptionChange(optionIndex, 'label', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOption(optionIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </Button>
        </div>
      )}

      {/* Eligibility Gate */}
      <div className="border-t pt-4 space-y-3">
        <label className={`flex items-center gap-2 ${field.type === 'select' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
          <input
            type="checkbox"
            checked={field.eligibility_gate || false}
            onChange={(e) => {
              if (field.type === 'select') {
                onChange({ ...field, eligibility_gate: e.target.checked });
              }
            }}
            disabled={field.type !== 'select'}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Use as Eligibility Gate
          </span>
        </label>
        {field.type === 'select' ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
            Stop form if user selects a disqualifying option (e.g., "No" for age confirmation)
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400 ml-6">
            Eligibility gates are only available for Select (Dropdown) fields. Use a dropdown with Yes/No options for binary requirements.
          </p>
        )}

        {field.eligibility_gate && field.type === 'select' && (
          <Input
            label="Failure Message"
            id={`field-${index}-failure-message`}
            value={field.failure_message || ''}
            onChange={(e) => onChange({ ...field, failure_message: e.target.value })}
            placeholder="e.g., Sorry, you must be 18 or older to apply"
            helperText="Message shown when user selects a disqualifying option"
            required
          />
        )}
      </div>
    </div>
  );
};
