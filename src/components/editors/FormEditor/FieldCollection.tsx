/**
 * FieldCollection Component
 * Drag-and-drop enabled list of form fields with CRUD operations
 *
 * Uses @dnd-kit for modern, accessible drag-and-drop functionality
 */

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, AlertCircle, Plus } from 'lucide-react';
import { Button, Badge, Alert, AlertDescription } from '@/components/ui';
import { FieldEditor } from './FieldEditor';
import type { FormField } from '@/types/config';

export interface FieldCollectionProps {
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

export interface FieldCollectionRef {
  /**
   * Trigger the add field dialog
   */
  addField: () => void;
}

/**
 * Individual sortable field item
 */
interface SortableFieldItemProps {
  field: FormField;
  index: number;
  onEdit: (field: FormField, index: number) => void;
  onDelete: (index: number) => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  index,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get field type badge variant
  const getFieldTypeBadgeVariant = (type: string): 'primary' | 'secondary' | 'info' => {
    if (type === 'select') return 'primary';
    if (type === 'textarea') return 'info';
    return 'secondary';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

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
        {/* Edit button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(field, index)}
          className="flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>

        {/* Delete button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(index)}
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

/**
 * FieldCollection - Drag-and-drop enabled field list with CRUD operations
 *
 * Features:
 * - Drag-and-drop reordering with @dnd-kit
 * - Add, edit, delete fields
 * - Visual field type badges
 * - Required and eligibility gate indicators
 * - Empty state with call-to-action
 *
 * @example
 * ```tsx
 * <FieldCollection
 *   fields={formData.fields}
 *   onChange={(fields) => handleChange('fields', fields)}
 *   error={errors.fields}
 * />
 * ```
 */
export const FieldCollection = forwardRef<FieldCollectionRef, FieldCollectionProps>(
  ({ fields, onChange, error }, ref) => {
    const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

    // Set up drag sensors
    const sensors = useSensors(
      useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get existing field IDs for validation
  const existingFieldIds = fields.map((f) => f.id);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(fields, oldIndex, newIndex);
        onChange(reorderedFields);
      }
    }
  };

    // Handle add field
    const handleAddField = () => {
      setEditingField(null);
      setEditingFieldIndex(null);
      setIsFieldEditorOpen(true);
    };

    // Expose addField method to parent via ref
    useImperativeHandle(ref, () => ({
      addField: handleAddField,
    }));

  // Handle edit field
  const handleEditField = (field: FormField, index: number) => {
    setEditingField(field);
    setEditingFieldIndex(index);
    setIsFieldEditorOpen(true);
  };

  // Handle delete field
  const handleDeleteField = (index: number) => {
    if (window.confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      const updatedFields = fields.filter((_, i) => i !== index);
      onChange(updatedFields);
    }
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

  return (
    <div className="w-full">
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fields
          <span className="ml-1 text-red-500">*</span>
        </label>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Add and configure fields to collect information from users. Fields are presented in order during the conversation.
      </p>

      {/* Fields list with drag-and-drop */}
      {fields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mb-3">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  onEdit={handleEditField}
                  onDelete={handleDeleteField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
          shown. Drag the grip icon to reorder fields.
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
});
