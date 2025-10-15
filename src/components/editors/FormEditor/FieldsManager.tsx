/**
 * FieldsManager Component
 * Manages the array of fields within a form with add/edit/delete/reorder functionality
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Button, Badge, Alert, AlertDescription } from '@/components/ui';
import { FieldEditor } from './FieldEditor';
import type { FormField } from '@/types/config';

export interface FieldsManagerProps {
  /**
   * Array of fields
   */
  fields: FormField[];
  /**
   * Callback when fields array changes
   */
  onChange: (fields: FormField[]) => void;
  /**
   * Error message for fields array
   */
  error?: string;
}

/**
 * FieldsManager - Manages form fields with CRUD operations
 *
 * @example
 * ```tsx
 * <FieldsManager
 *   fields={formData.fields}
 *   onChange={(fields) => handleChange('fields', fields)}
 *   error={errors.fields}
 * />
 * ```
 */
export const FieldsManager: React.FC<FieldsManagerProps> = ({
  fields,
  onChange,
  error,
}) => {
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // Get existing field IDs for validation
  const existingFieldIds = fields.map((f) => f.id);

  // Handle add field
  const handleAddField = () => {
    setEditingField(null);
    setEditingFieldIndex(null);
    setIsFieldEditorOpen(true);
  };

  // Handle edit field
  const handleEditField = (field: FormField, index: number) => {
    setEditingField(field);
    setEditingFieldIndex(index);
    setIsFieldEditorOpen(true);
  };

  // Handle delete field
  const handleDeleteField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange(updatedFields);
  };

  // Handle move field up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedFields = [...fields];
    [updatedFields[index - 1], updatedFields[index]] = [
      updatedFields[index],
      updatedFields[index - 1],
    ];
    onChange(updatedFields);
  };

  // Handle move field down
  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const updatedFields = [...fields];
    [updatedFields[index], updatedFields[index + 1]] = [
      updatedFields[index + 1],
      updatedFields[index],
    ];
    onChange(updatedFields);
  };

  // Handle save field
  const handleSaveField = (field: FormField, fieldIndex: number | null) => {
    if (fieldIndex !== null) {
      // Update existing field
      const updatedFields = [...fields];
      updatedFields[fieldIndex] = field;
      onChange(updatedFields);
    } else {
      // Add new field
      onChange([...fields, field]);
    }
    setIsFieldEditorOpen(false);
    setEditingField(null);
    setEditingFieldIndex(null);
  };

  // Handle cancel field editor
  const handleCancelFieldEditor = () => {
    setIsFieldEditorOpen(false);
    setEditingField(null);
    setEditingFieldIndex(null);
  };

  // Get field type badge variant
  const getFieldTypeBadgeVariant = (type: string): 'primary' | 'secondary' | 'info' => {
    if (type === 'select') return 'primary';
    if (type === 'textarea') return 'info';
    return 'secondary';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fields
          <span className="ml-1 text-red-500">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddField}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Define the fields that will be collected in this form
      </p>

      {/* Fields list */}
      {fields.length > 0 ? (
        <div className="space-y-2 mb-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
            >
              {/* Field info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getFieldTypeBadgeVariant(field.type)} className="text-xs">
                    {field.type}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {field.label}
                  </span>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {field.eligibility_gate && (
                    <Badge variant="warning" className="text-xs">
                      Eligibility Gate
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {field.prompt}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Reorder buttons */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditField(field, index)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>

                {/* Delete button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteField(index)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md mb-3">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            No fields added yet. Click "Add Field" to create the first field.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddField}
            className="flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add First Field
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="error" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info box */}
      <Alert variant="info">
        <AlertDescription className="text-xs">
          At least one required field is needed. Fields will be presented to users in the order
          shown. Use the arrows to reorder fields.
        </AlertDescription>
      </Alert>

      {/* Field Editor Modal */}
      <FieldEditor
        field={editingField}
        fieldIndex={editingFieldIndex}
        existingFieldIds={
          editingFieldIndex !== null
            ? existingFieldIds.filter((_, i) => i !== editingFieldIndex)
            : existingFieldIds
        }
        onSave={handleSaveField}
        onCancel={handleCancelFieldEditor}
        open={isFieldEditorOpen}
      />
    </div>
  );
};
