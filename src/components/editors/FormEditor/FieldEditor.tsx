/**
 * FieldEditor Component
 * Nested modal for creating and editing individual form fields
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { formFieldSchema } from '@/lib/schemas';
import type { FormField, FormFieldType, FormFieldOption } from '@/types/config';
import type { SelectOption } from '@/components/ui/Select';
import { ZodError } from 'zod';

export interface FieldEditorProps {
  /**
   * The field being edited (null for create mode)
   */
  field: FormField | null;
  /**
   * Field index (for update operations)
   */
  fieldIndex: number | null;
  /**
   * Existing field IDs for validation
   */
  existingFieldIds: string[];
  /**
   * Callback when field is saved
   */
  onSave: (field: FormField, fieldIndex: number | null) => void;
  /**
   * Callback when editor is cancelled
   */
  onCancel: () => void;
  /**
   * Whether the editor is open
   */
  open: boolean;
}

interface FormErrors {
  id?: string;
  type?: string;
  label?: string;
  prompt?: string;
  hint?: string;
  options?: string;
  failure_message?: string;
  form?: string;
}

// Field type options
const fieldTypeOptions: SelectOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'textarea', label: 'Textarea (Multi-line)' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

/**
 * Generate field ID from label
 */
const generateFieldId = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * FieldEditor - Modal for creating/editing form fields
 *
 * @example
 * ```tsx
 * <FieldEditor
 *   field={editingField}
 *   fieldIndex={editingFieldIndex}
 *   existingFieldIds={existingIds}
 *   onSave={handleSaveField}
 *   onCancel={handleCancelField}
 *   open={isFieldEditorOpen}
 * />
 * ```
 */
export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  fieldIndex,
  existingFieldIds,
  onSave,
  onCancel,
  open,
}) => {
  const isEditMode = field !== null && fieldIndex !== null;

  // Form state
  const [fieldData, setFieldData] = useState<FormField>({
    id: field?.id || '',
    type: field?.type || 'text',
    label: field?.label || '',
    prompt: field?.prompt || '',
    hint: field?.hint || '',
    required: field?.required ?? true,
    options: field?.options || [],
    eligibility_gate: field?.eligibility_gate ?? false,
    failure_message: field?.failure_message || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when field changes or modal opens
  useEffect(() => {
    if (open) {
      setFieldData({
        id: field?.id || '',
        type: field?.type || 'text',
        label: field?.label || '',
        prompt: field?.prompt || '',
        hint: field?.hint || '',
        required: field?.required ?? true,
        options: field?.options || [],
        eligibility_gate: field?.eligibility_gate ?? false,
        failure_message: field?.failure_message || '',
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [field, fieldIndex, open]);

  // Auto-generate field ID from label (create mode only)
  useEffect(() => {
    if (!isEditMode && fieldData.label) {
      const generatedId = generateFieldId(fieldData.label);
      setFieldData((prev) => ({
        ...prev,
        id: generatedId,
      }));
    }
  }, [fieldData.label, isEditMode]);

  // Validate field data
  const validate = useCallback(
    (data: FormField): FormErrors => {
      const newErrors: FormErrors = {};

      // Validate field ID uniqueness
      if (!data.id.trim()) {
        newErrors.id = 'Field ID is required';
      } else if (
        (!isEditMode || data.id !== field?.id) &&
        existingFieldIds.includes(data.id)
      ) {
        newErrors.id = 'A field with this ID already exists';
      }

      // Validate with Zod schema
      try {
        formFieldSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const path = err.path[0] as string;
            if (!newErrors[path as keyof FormErrors]) {
              newErrors[path as keyof FormErrors] = err.message;
            }
          });
        }
      }

      return newErrors;
    },
    [isEditMode, field?.id, existingFieldIds]
  );

  // Handle field changes
  const handleChange = <K extends keyof FormField>(field: K, value: FormField[K]) => {
    setFieldData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof FormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const fieldErrors = validate(fieldData);
    if (fieldErrors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field as keyof FormErrors] }));
    }
  };

  // Handle option changes
  const handleOptionChange = (index: number, key: 'value' | 'label', value: string) => {
    const updatedOptions = [...(fieldData.options || [])];
    updatedOptions[index] = { ...updatedOptions[index], [key]: value };
    handleChange('options', updatedOptions);
  };

  // Add option
  const handleAddOption = () => {
    const newOption: FormFieldOption = { value: '', label: '' };
    handleChange('options', [...(fieldData.options || []), newOption]);
  };

  // Remove option
  const handleRemoveOption = (index: number) => {
    const updatedOptions = (fieldData.options || []).filter((_, i) => i !== index);
    handleChange('options', updatedOptions);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      id: true,
      type: true,
      label: true,
      prompt: true,
      hint: true,
      options: true,
      failure_message: true,
    });

    // Validate all fields
    const validationErrors = validate(fieldData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up the field data based on type
      const cleanedField: FormField = {
        ...fieldData,
      };

      // Remove options if not a select field
      if (cleanedField.type !== 'select') {
        delete cleanedField.options;
      }

      // Remove failure_message if not an eligibility gate
      if (!cleanedField.eligibility_gate) {
        delete cleanedField.failure_message;
      }

      onSave(cleanedField, fieldIndex);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isValid = Object.keys(validate(fieldData)).length === 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEditMode ? `Edit Field: ${field?.label}` : 'Create Field'}
            </ModalTitle>
            <ModalDescription>
              {isEditMode
                ? 'Update the field details below.'
                : 'Define a new form field with type-specific configuration.'}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Field ID */}
            <Input
              label="Field ID"
              id="field_id"
              placeholder="e.g., full_name"
              value={fieldData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              onBlur={() => handleBlur('id')}
              error={touched.id ? errors.id : undefined}
              helperText={
                isEditMode
                  ? 'Field ID cannot be changed'
                  : 'Auto-generated from label. Lowercase letters, numbers, and underscores only.'
              }
              disabled={isEditMode}
              required
            />

            {/* Field Type */}
            <Select
              label="Field Type"
              placeholder="Select field type..."
              options={fieldTypeOptions}
              value={fieldData.type}
              onValueChange={(value) => handleChange('type', value as FormFieldType)}
              error={touched.type ? errors.type : undefined}
              helperText="The type of input for this field"
              required
            />

            {/* Label */}
            <Input
              label="Label"
              id="label"
              placeholder="e.g., Full Name"
              value={fieldData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              onBlur={() => handleBlur('label')}
              error={touched.label ? errors.label : undefined}
              helperText="The label displayed for this field"
              required
              autoFocus={!isEditMode}
            />

            {/* Prompt */}
            <Textarea
              label="Prompt"
              id="prompt"
              placeholder="e.g., What is your full name?"
              value={fieldData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              onBlur={() => handleBlur('prompt')}
              error={touched.prompt ? errors.prompt : undefined}
              helperText="The question the AI will ask to collect this field"
              rows={3}
              required
            />

            {/* Hint */}
            <Textarea
              label="Hint (Optional)"
              id="hint"
              placeholder="e.g., Please provide your first and last name"
              value={fieldData.hint || ''}
              onChange={(e) => handleChange('hint', e.target.value)}
              onBlur={() => handleBlur('hint')}
              error={touched.hint ? errors.hint : undefined}
              helperText="Additional guidance shown to the user"
              rows={2}
            />

            {/* Required checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={fieldData.required}
                onChange={(e) => handleChange('required', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor="required"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Required field
              </label>
            </div>

            {/* Options for select type */}
            {fieldData.type === 'select' && (
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Options
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Define the dropdown options for this select field
                </p>

                <div className="space-y-2">
                  {(fieldData.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
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
                  Add Option
                </Button>

                {touched.options && errors.options && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.options}</p>
                )}
              </div>
            )}

            {/* Eligibility gate checkbox */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="eligibility_gate"
                  checked={fieldData.eligibility_gate ?? false}
                  onChange={(e) => {
                    if (fieldData.type === 'select') {
                      handleChange('eligibility_gate', e.target.checked);
                    }
                  }}
                  disabled={fieldData.type !== 'select'}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                />
                <label
                  htmlFor="eligibility_gate"
                  className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${fieldData.type !== 'select' ? 'opacity-60' : ''}`}
                >
                  Eligibility Gate
                </label>
              </div>
              {fieldData.type === 'select' ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Stop form if user selects a disqualifying option (e.g., "No" for age confirmation)
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 ml-6">
                  Eligibility gates are only available for Select (Dropdown) fields. Use a dropdown with Yes/No options for binary requirements.
                </p>
              )}
            </div>

            {/* Failure message for eligibility gates */}
            {fieldData.eligibility_gate && fieldData.type === 'select' && (
              <Textarea
                label="Failure Message"
                id="failure_message"
                placeholder="e.g., Unfortunately, you must be 18 or older to apply for this program."
                value={fieldData.failure_message || ''}
                onChange={(e) => handleChange('failure_message', e.target.value)}
                onBlur={() => handleBlur('failure_message')}
                error={touched.failure_message ? errors.failure_message : undefined}
                helperText="Message shown when user selects a disqualifying option"
                rows={3}
                required
              />
            )}

            {/* Info box */}
            <Alert variant="info">
              <AlertDescription>
                Fields are presented to users in a conversational format. The AI will use the
                prompt to ask for this information naturally.
              </AlertDescription>
            </Alert>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Field' : 'Create Field'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
