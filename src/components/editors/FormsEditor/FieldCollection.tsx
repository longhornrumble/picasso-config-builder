/**
 * FieldCollection Component
 * Manages the array of form fields with add/edit/delete/reorder operations
 */

import React from 'react';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { Plus, AlertCircle } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import type { FormField } from '@/types/config';

export interface FieldCollectionProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  errors?: string;
  touched?: boolean;
  onAddField?: () => void;
}

export const FieldCollection: React.FC<FieldCollectionProps> = ({
  fields,
  onChange,
  errors,
  touched,
  onAddField,
}) => {
  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      prompt: '',
      required: false,
    };
    onChange([...fields, newField]);
  };

  // Use onAddField callback if provided, otherwise use local handler
  const triggerAddField = onAddField || handleAddField;

  const handleUpdateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    onChange(newFields);
  };

  const handleDeleteField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleDuplicateField = (index: number) => {
    const fieldToDuplicate = fields[index];
    const duplicatedField: FormField = {
      ...fieldToDuplicate,
      id: `${fieldToDuplicate.id}_copy_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Copy)`,
    };
    const newFields = [...fields];
    newFields.splice(index + 1, 0, duplicatedField);
    onChange(newFields);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    onChange(newFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Form Fields <span className="text-red-600">*</span>
        </label>
        <Button type="button" onClick={triggerAddField} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Error Display */}
      {touched && errors && (
        <Alert variant="error">
          <AlertDescription>{errors}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {fields.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No fields added yet. Click "Add Field" to create your first form field.
          </p>
          <Button type="button" onClick={triggerAddField} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add First Field
          </Button>
        </div>
      )}

      {/* Fields List */}
      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              field={field}
              index={index}
              totalFields={fields.length}
              onChange={(updatedField) => handleUpdateField(index, updatedField)}
              onDelete={() => handleDeleteField(index)}
              onDuplicate={() => handleDuplicateField(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Add and configure fields to collect information from users. Fields are presented in order during the conversation.
      </p>
    </div>
  );
};
