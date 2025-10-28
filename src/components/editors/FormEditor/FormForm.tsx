/**
 * FormForm Component
 * Main modal form for creating and editing conversational forms
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  AlertDescription,
  Badge,
} from '@/components/ui';
import { conversationalFormSchema } from '@/lib/schemas';
import { FieldCollection, FieldCollectionRef } from './FieldCollection';
import { PostSubmissionSection } from './PostSubmissionSection';
import type { ConversationalForm, FormField, PostSubmissionConfig, Program } from '@/types/config';
import type { SelectOption } from '@/components/ui/Select';
import { ZodError } from 'zod';

export interface FormFormProps {
  /**
   * The form ID being edited (null for create mode)
   */
  formId: string | null;
  /**
   * The form being edited (null for create mode)
   */
  form: ConversationalForm | null;
  /**
   * Array of existing form IDs (for duplicate validation)
   */
  existingFormIds: string[];
  /**
   * Available programs
   */
  availablePrograms: Record<string, Program>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (formId: string, form: ConversationalForm) => void;
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
  formId: string;
  enabled: boolean;
  program: string;
  title: string;
  description: string;
  introduction?: string;
  cta_text?: string;
  trigger_phrases: string[];
  fields: FormField[];
  post_submission?: PostSubmissionConfig;
}

interface FormErrors {
  formId?: string;
  program?: string;
  title?: string;
  description?: string;
  introduction?: string;
  cta_text?: string;
  trigger_phrases?: string;
  fields?: string;
  confirmation_message?: string;
  form?: string;
}

/**
 * Generate form ID from title
 */
const generateFormId = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * FormForm - Modal form for creating/editing conversational forms
 *
 * @example
 * ```tsx
 * <FormForm
 *   formId={editingFormId}
 *   form={editingForm}
 *   existingFormIds={existingIds}
 *   availablePrograms={programs}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   open={isOpen}
 * />
 * ```
 */
export const FormForm: React.FC<FormFormProps> = ({
  formId,
  form,
  existingFormIds,
  availablePrograms,
  onSubmit,
  onCancel,
  open,
}) => {
  const isEditMode = formId !== null && form !== null;

  // Ref for FieldCollection to trigger add field
  const fieldCollectionRef = useRef<FieldCollectionRef>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    formId: formId || '',
    enabled: form?.enabled ?? true,
    program: form?.program || '',
    title: form?.title || '',
    description: form?.description || '',
    introduction: form?.introduction || '',
    cta_text: form?.cta_text || '',
    trigger_phrases: form?.trigger_phrases || [],
    fields: form?.fields || [],
    post_submission: form?.post_submission,
  });

  const [phraseInput, setPhraseInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert programs to SelectOptions
  const programOptions: SelectOption[] = Object.values(availablePrograms).map((program) => ({
    value: program.program_id,
    label: program.program_name,
  }));

  // Reset form when form changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        formId: formId || '',
        enabled: form?.enabled ?? true,
        program: form?.program || '',
        title: form?.title || '',
        description: form?.description || '',
        introduction: form?.introduction || '',
        cta_text: form?.cta_text || '',
        trigger_phrases: form?.trigger_phrases || [],
        fields: form?.fields || [],
        post_submission: form?.post_submission,
      });
      setPhraseInput('');
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [formId, form, open]);

  // Auto-generate form ID from title (create mode only)
  useEffect(() => {
    if (!isEditMode && formData.title) {
      const generatedId = generateFormId(formData.title);
      setFormData((prev) => ({
        ...prev,
        formId: generatedId,
      }));
    }
  }, [formData.title, isEditMode]);

  // Validate form data
  const validate = useCallback(
    (data: FormData): FormErrors => {
      const newErrors: FormErrors = {};

      // Validate form ID
      if (!data.formId.trim()) {
        newErrors.formId = 'Form ID is required';
      } else if (!/^[a-z][a-z0-9_]*$/.test(data.formId)) {
        newErrors.formId =
          'Form ID must start with a letter and contain only lowercase letters, numbers, and underscores';
      } else if (
        (!isEditMode || data.formId !== formId) &&
        existingFormIds.includes(data.formId)
      ) {
        newErrors.formId = 'A form with this ID already exists';
      }

      // Validate with Zod schema
      try {
        conversationalFormSchema.parse({
          enabled: data.enabled,
          form_id: data.formId,
          program: data.program,
          title: data.title,
          description: data.description,
          cta_text: data.cta_text,
          trigger_phrases: data.trigger_phrases.filter((phrase) => phrase != null && phrase !== ''),
          fields: data.fields,
          post_submission: data.post_submission,
        });
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
    [isEditMode, formId, existingFormIds]
  );

  // Handle field changes
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate this field
    const fieldErrors = validate(formData);
    if (fieldErrors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field as keyof FormErrors] }));
    }
  };

  // Handle trigger phrase addition
  const handleAddPhrase = () => {
    const trimmed = phraseInput.trim().toLowerCase();
    if (trimmed && !formData.trigger_phrases.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        trigger_phrases: [...prev.trigger_phrases, trimmed],
      }));
      setPhraseInput('');

      // Clear trigger phrases error
      if (errors.trigger_phrases) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.trigger_phrases;
          return newErrors;
        });
      }
    }
  };

  // Handle trigger phrase removal
  const handleRemovePhrase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      trigger_phrases: prev.trigger_phrases.filter((_, i) => i !== index),
    }));
  };

  // Handle trigger phrase input key press
  const handlePhraseKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPhrase();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      formId: true,
      program: true,
      title: true,
      description: true,
      cta_text: true,
      trigger_phrases: true,
      fields: true,
    });

    // Validate all fields
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create form object
      const formDataToSubmit: ConversationalForm = {
        enabled: formData.enabled,
        form_id: formData.formId,
        program: formData.program,
        title: formData.title,
        description: formData.description,
        cta_text: formData.cta_text || undefined,
        trigger_phrases: formData.trigger_phrases,
        fields: formData.fields,
        post_submission: formData.post_submission,
      };

      onSubmit(formData.formId, formDataToSubmit);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const validationErrors = validate(formData);
  const isValid = Object.keys(validationErrors).length === 0;

  // Debug: Log validation errors
  React.useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      console.log('🔴 Form validation errors:', validationErrors);
    } else {
      console.log('✅ Form is valid');
    }
  }, [validationErrors]);

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEditMode ? `Edit Form: ${formId}` : 'Create Conversational Form'}
            </ModalTitle>
            <ModalDescription>
              {isEditMode
                ? 'Update the form details below.'
                : 'Define a new conversational form for data collection.'}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Form ID */}
            <Input
              label="Form ID"
              id="form_id"
              placeholder="e.g., volunteer_application"
              value={formData.formId}
              onChange={(e) => handleChange('formId', e.target.value)}
              onBlur={() => handleBlur('formId')}
              error={touched.formId ? errors.formId : undefined}
              helperText={
                isEditMode
                  ? 'Form ID cannot be changed'
                  : 'Auto-generated from title. Lowercase letters, numbers, and underscores only.'
              }
              disabled={isEditMode}
              required
            />

            {/* Enabled checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor="enabled"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Form enabled
              </label>
            </div>

            {/* Program selection */}
            {programOptions.length > 0 ? (
              <Select
                label="Program"
                placeholder="Select a program..."
                options={programOptions}
                value={formData.program}
                onValueChange={(value) => handleChange('program', value)}
                error={touched.program ? errors.program : undefined}
                helperText="The program this form belongs to (required in v1.3+)"
                required
              />
            ) : (
              <Alert variant="warning">
                <AlertDescription>
                  No programs available. Please create a program first before creating forms.
                </AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <Input
              label="Title"
              id="title"
              placeholder="e.g., Volunteer Application Form"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              error={touched.title ? errors.title : undefined}
              helperText="The display title for this form"
              required
              autoFocus={!isEditMode}
            />

            {/* Description */}
            <Textarea
              label="Description"
              id="description"
              placeholder="e.g., Apply to become a volunteer with our organization"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              error={touched.description ? errors.description : undefined}
              helperText="Internal description of what this form is for (not shown to users)"
              rows={2}
              required
            />

            {/* Introduction (user-facing) */}
            <Textarea
              label="Form Introduction (Optional)"
              id="introduction"
              placeholder="e.g., This form will help us learn more about your interest in becoming a Love Box sponsor. It should take about 5 minutes to complete. If you have questions, email sponsors@example.com"
              value={formData.introduction || ''}
              onChange={(e) => handleChange('introduction', e.target.value)}
              onBlur={() => handleBlur('introduction')}
              error={touched.introduction ? errors.introduction : undefined}
              helperText="Introduction message shown to users before the form begins. Include time estimate, expectations, and contact info. URLs will be automatically linked."
              rows={4}
            />

            {/* CTA Text (optional) */}
            <Input
              label="CTA Text (Optional)"
              id="cta_text"
              placeholder="e.g., Start Application"
              value={formData.cta_text || ''}
              onChange={(e) => handleChange('cta_text', e.target.value)}
              onBlur={() => handleBlur('cta_text')}
              error={touched.cta_text ? errors.cta_text : undefined}
              helperText="Custom button text for starting this form"
            />

            {/* Trigger Phrases */}
            <div className="w-full">
              <label
                htmlFor="trigger_phrases"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Trigger Phrases
                <span className="ml-1 text-red-500">*</span>
              </label>

              {/* Phrases display */}
              {formData.trigger_phrases.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  {formData.trigger_phrases.filter((phrase) => phrase != null && phrase !== '').map((phrase, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {phrase}
                      <X className="w-3 h-3" onClick={() => handleRemovePhrase(idx)} />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Phrase input */}
              <Input
                id="trigger_phrases"
                placeholder="Type phrase and press Enter or comma"
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                onKeyDown={handlePhraseKeyPress}
                onBlur={handleAddPhrase}
                error={touched.trigger_phrases ? errors.trigger_phrases : undefined}
                helperText="Phrases that will trigger this form in conversations. Press Enter or comma to add."
              />
            </div>

            {/* Fields Collection with Drag-Drop */}
            <FieldCollection
              ref={fieldCollectionRef}
              fields={formData.fields}
              onChange={(fields) => handleChange('fields', fields)}
              error={touched.fields ? errors.fields : undefined}
            />

            {/* Post-Submission Section */}
            <PostSubmissionSection
              postSubmission={formData.post_submission}
              onChange={(config) => handleChange('post_submission', config)}
              errors={errors}
              touched={touched}
            />

            {/* Info box */}
            <Alert variant="info">
              <AlertDescription>
                Conversational forms collect data through natural conversation. Users will be
                prompted for each field in sequence. At least one required field is needed.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex items-center justify-between w-full pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => fieldCollectionRef.current?.addField()}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSubmitting || programOptions.length === 0}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Form' : 'Create Form'}
              </Button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};

