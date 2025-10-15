/**
 * ProgramForm Component
 * Modal form for creating and editing programs with validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { programSchema } from '@/lib/schemas';
import type { Program } from '@/types/config';
import { ZodError } from 'zod';

export interface ProgramFormProps {
  /**
   * The program being edited (null for create mode)
   */
  program: Program | null;
  /**
   * Array of existing program IDs (for duplicate validation)
   */
  existingProgramIds: string[];
  /**
   * Callback when form is submitted
   */
  onSubmit: (program: Program) => void;
  /**
   * Callback when form is cancelled
   */
  onCancel: () => void;
  /**
   * Whether the form is open
   */
  open: boolean;
}

interface FormData {
  program_id: string;
  program_name: string;
  description: string;
}

interface FormErrors {
  program_id?: string;
  program_name?: string;
  description?: string;
  form?: string;
}

/**
 * ProgramForm - Modal form for creating/editing programs
 *
 * @example
 * ```tsx
 * <ProgramForm
 *   program={editingProgram}
 *   existingProgramIds={existingIds}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   open={isOpen}
 * />
 * ```
 */
export const ProgramForm: React.FC<ProgramFormProps> = ({
  program,
  existingProgramIds,
  onSubmit,
  onCancel,
  open,
}) => {
  const isEditMode = program !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    program_id: program?.program_id || '',
    program_name: program?.program_name || '',
    description: program?.description || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when program changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        program_id: program?.program_id || '',
        program_name: program?.program_name || '',
        description: program?.description || '',
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [program, open]);

  // Validate form data
  const validate = useCallback(
    (data: FormData): FormErrors => {
      const newErrors: FormErrors = {};

      try {
        // Validate with Zod schema
        programSchema.parse({
          program_id: data.program_id,
          program_name: data.program_name,
          description: data.description || undefined,
        });

        // Check for duplicate program_id (only in create mode or if ID changed)
        if (
          (!isEditMode || data.program_id !== program?.program_id) &&
          existingProgramIds.includes(data.program_id)
        ) {
          newErrors.program_id = 'A program with this ID already exists';
        }
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const field = err.path[0] as keyof FormData;
            if (!newErrors[field]) {
              newErrors[field] = err.message;
            }
          });
        }
      }

      return newErrors;
    },
    [isEditMode, program?.program_id, existingProgramIds]
  );

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate this field
    const fieldErrors = validate(formData);
    if (fieldErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      program_id: true,
      program_name: true,
      description: true,
    });

    // Validate all fields
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create program object
      const programData: Program = {
        program_id: formData.program_id.trim(),
        program_name: formData.program_name.trim(),
        description: formData.description.trim() || undefined,
      };

      onSubmit(programData);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isValid = Object.keys(validate(formData)).length === 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEditMode ? `Edit Program: ${program.program_name}` : 'Create Program'}
            </ModalTitle>
            <ModalDescription>
              {isEditMode
                ? 'Update the program details below.'
                : 'Define a new organizational program that forms can be assigned to.'}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Program ID */}
            <Input
              label="Program ID"
              id="program_id"
              placeholder="e.g., volunteer_program"
              value={formData.program_id}
              onChange={(e) => handleChange('program_id', e.target.value)}
              onBlur={() => handleBlur('program_id')}
              error={touched.program_id ? errors.program_id : undefined}
              helperText={
                isEditMode
                  ? 'Program ID cannot be changed'
                  : 'Lowercase letters, numbers, and underscores only'
              }
              disabled={isEditMode}
              required
              autoFocus={!isEditMode}
            />

            {/* Program Name */}
            <Input
              label="Program Name"
              id="program_name"
              placeholder="e.g., Volunteer Programs"
              value={formData.program_name}
              onChange={(e) => handleChange('program_name', e.target.value)}
              onBlur={() => handleBlur('program_name')}
              error={touched.program_name ? errors.program_name : undefined}
              helperText="Display name shown to users"
              required
              autoFocus={isEditMode}
            />

            {/* Description */}
            <div className="w-full">
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                placeholder="Optional description of this program..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
              />
              {touched.description && errors.description && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.description}
                </p>
              )}
              {!errors.description && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  Max 500 characters
                </p>
              )}
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Program' : 'Create Program'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
