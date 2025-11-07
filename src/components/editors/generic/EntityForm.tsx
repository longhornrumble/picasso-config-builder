/**
 * EntityForm - Generic Form Modal Component
 *
 * Handles form state, validation, and submission for any entity type.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  Button,
  Alert,
  AlertDescription,
  Badge,
  Tooltip,
} from '@/components/ui';
import { useSaveShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts';
import { ValidationAlert } from '@/components/validation/ValidationAlert';
import type {
  BaseEntity,
  FormFieldsProps,
  ValidationFunction,
  ValidationContext,
} from '@/lib/crud/types';
import type { ValidationErrors } from '@/types/validation';

export interface EntityFormProps<T extends BaseEntity> {
  open: boolean;
  entity: T | null;
  entityName: string;
  FormFields: React.ComponentType<FormFieldsProps<T>>;
  validation: ValidationFunction<T>;
  existingIds: string[];
  onSubmit: (entity: T) => void;
  onCancel: () => void;
  initialValue?: Partial<T>;
  footerActions?: React.ReactNode | ((formData: T, onChange: (data: T) => void) => React.ReactNode);
  /**
   * Function to extract entity ID from entity (for inline validation display)
   */
  getId?: (entity: T) => string;
}

export function EntityForm<T extends BaseEntity>({
  open,
  entity,
  entityName,
  FormFields,
  validation,
  existingIds,
  onSubmit,
  onCancel,
  initialValue = {} as Partial<T>,
  footerActions,
  getId,
}: EntityFormProps<T>): React.ReactElement {
  const isEditMode = entity !== null;

  // Get entity ID for inline validation display
  const entityId = entity && getId ? getId(entity) : null;

  // Form state
  const [formData, setFormData] = useState<T>((entity || initialValue) as T);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form data
  const validate = useCallback(
    (data: T): ValidationErrors => {
      const context: ValidationContext<T> = {
        isEditMode,
        existingIds,
        existingEntities: {},
        originalEntity: entity || undefined,
      };
      return validation(data, context);
    },
    [isEditMode, existingIds, validation, entity]
  );

  // Reset form when modal opens or entity changes
  useEffect(() => {
    if (open) {
      const initialData = (entity || initialValue) as T;
      setFormData(initialData);
      setTouched({});
      setIsSubmitting(false);

      // Run initial validation to determine button state
      // But don't show errors until user interacts
      const initialErrors = validate(initialData);
      setErrors(initialErrors);
    }
  }, [entity, open, initialValue, validate]);

  // Handle field change
  const handleChange = useCallback((value: T) => {
    setFormData(value);
    // Validate immediately to enable/disable submit button
    const validationErrors = validate(value);
    setErrors(validationErrors);
  }, [validate]);

  // Handle field blur
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      // Note: We don't validate here because handleChange already validates
      // with the updated data. Validating here with formData would use stale data
      // since React state updates are async.
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit(formData);
    } catch (error) {
      console.error('[EntityForm] onSubmit error', error);
      setErrors({
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };

  // Check if form is valid based on current errors state
  const isValid = Object.keys(errors).length === 0 || Object.keys(errors).every(key => !errors[key]);

  // Debug logging to see validation state
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('🔍 Form validation errors:', errors);
      console.log('✅ isValid:', isValid);
      console.log('📝 Form data:', formData);
    }
  }, [errors, isValid, formData]);

  // Register Ctrl/Cmd+S keyboard shortcut for save
  useSaveShortcut(
    () => {
      if (isValid && !isSubmitting && open) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    },
    { disabled: !isValid || isSubmitting || !open }
  );

  // Get the save shortcut display text
  const saveShortcut = formatShortcut({ key: 'S', ctrl: true, meta: true, description: 'Save' });

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-start justify-between">
              <div>
                <ModalTitle>
                  {isEditMode ? `Edit ${entityName}` : `Create ${entityName}`}
                </ModalTitle>
                <ModalDescription>
                  {isEditMode
                    ? `Update the ${entityName.toLowerCase()} details below.`
                    : `Define a new ${entityName.toLowerCase()}.`}
                </ModalDescription>
              </div>
              <Tooltip content={`Press ${saveShortcut} to save`}>
                <Badge variant="secondary" className="font-mono text-xs">
                  {saveShortcut}
                </Badge>
              </Tooltip>
            </div>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Inline validation from global validation store */}
            {entityId && <ValidationAlert entityId={entityId} className="mb-4" />}

            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Domain-specific form fields */}
            <FormFields
              value={formData}
              onChange={handleChange}
              errors={errors}
              touched={touched}
              onBlur={handleBlur}
              isEditMode={isEditMode}
              existingIds={existingIds}
            />
          </div>

          <div className={`flex items-center ${footerActions ? 'justify-between' : 'justify-end'} gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800`}>
            {footerActions && (
              <div className="flex items-center gap-2">
                {typeof footerActions === 'function'
                  ? footerActions(formData, handleChange)
                  : footerActions}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? `Update ${entityName}` : `Create ${entityName}`}
              </Button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
