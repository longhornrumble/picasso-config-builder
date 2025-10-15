/**
 * CTAForm Component
 * Modal form for creating and editing CTAs with conditional field rendering
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
  Textarea,
  Select,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { ctaDefinitionSchema } from '@/lib/schemas';
import type { CTADefinition, CTAActionType, CTAType, CTAStyle } from '@/types/config';
import type { SelectOption } from '@/components/ui/Select';
import { ZodError } from 'zod';

export interface CTAFormProps {
  /**
   * The CTA ID being edited (null for create mode)
   */
  ctaId: string | null;
  /**
   * The CTA being edited (null for create mode)
   */
  cta: CTADefinition | null;
  /**
   * Array of existing CTA IDs (for duplicate validation)
   */
  existingCtaIds: string[];
  /**
   * Record of available forms (for formId dropdown)
   */
  availableForms: Record<string, { form_id: string; title: string }>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (ctaId: string, cta: CTADefinition) => void;
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
  ctaId: string;
  label: string;
  action: CTAActionType;
  formId?: string;
  url?: string;
  query?: string;
  prompt?: string;
  type: CTAType;
  style: CTAStyle;
}

interface FormErrors {
  ctaId?: string;
  label?: string;
  action?: string;
  formId?: string;
  url?: string;
  query?: string;
  prompt?: string;
  type?: string;
  style?: string;
  form?: string;
}

// Action type options
const actionOptions: SelectOption[] = [
  { value: 'start_form', label: 'Start Form' },
  { value: 'external_link', label: 'External Link' },
  { value: 'send_query', label: 'Send Query' },
  { value: 'show_info', label: 'Show Information' },
];

// CTA type options
const typeOptions: SelectOption[] = [
  { value: 'form_trigger', label: 'Form Trigger' },
  { value: 'external_link', label: 'External Link' },
  { value: 'bedrock_query', label: 'Bedrock Query' },
  { value: 'info_request', label: 'Info Request' },
];

// Style options
const styleOptions: SelectOption[] = [
  { value: 'primary', label: 'Primary (Green)' },
  { value: 'secondary', label: 'Secondary (Blue)' },
  { value: 'info', label: 'Info (Gray)' },
];

/**
 * Generate CTA ID from label
 */
const generateCTAId = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Get the expected type for a given action
 */
const getTypeForAction = (action: CTAActionType): CTAType => {
  const typeMap: Record<CTAActionType, CTAType> = {
    start_form: 'form_trigger',
    external_link: 'external_link',
    send_query: 'bedrock_query',
    show_info: 'info_request',
  };
  return typeMap[action];
};

/**
 * CTAForm - Modal form for creating/editing CTAs
 *
 * @example
 * ```tsx
 * <CTAForm
 *   ctaId={editingCtaId}
 *   cta={editingCta}
 *   existingCtaIds={existingIds}
 *   availableForms={forms}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   open={isOpen}
 * />
 * ```
 */
export const CTAForm: React.FC<CTAFormProps> = ({
  ctaId,
  cta,
  existingCtaIds,
  availableForms,
  onSubmit,
  onCancel,
  open,
}) => {
  const isEditMode = ctaId !== null && cta !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    ctaId: ctaId || '',
    label: cta?.label || '',
    action: cta?.action || 'start_form',
    formId: cta?.formId || '',
    url: cta?.url || '',
    query: cta?.query || '',
    prompt: cta?.prompt || '',
    type: cta?.type || 'form_trigger',
    style: cta?.style || 'primary',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert forms to SelectOptions
  const formOptions: SelectOption[] = Object.values(availableForms).map((form) => ({
    value: form.form_id,
    label: form.title,
  }));

  // Reset form when CTA changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        ctaId: ctaId || '',
        label: cta?.label || '',
        action: cta?.action || 'start_form',
        formId: cta?.formId || '',
        url: cta?.url || '',
        query: cta?.query || '',
        prompt: cta?.prompt || '',
        type: cta?.type || 'form_trigger',
        style: cta?.style || 'primary',
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [ctaId, cta, open]);

  // Auto-generate CTA ID from label (create mode only)
  useEffect(() => {
    if (!isEditMode && formData.label) {
      const generatedId = generateCTAId(formData.label);
      setFormData((prev) => ({
        ...prev,
        ctaId: generatedId,
      }));
    }
  }, [formData.label, isEditMode]);

  // Auto-populate type based on action
  useEffect(() => {
    if (formData.action) {
      const expectedType = getTypeForAction(formData.action);
      setFormData((prev) => ({
        ...prev,
        type: expectedType,
      }));
    }
  }, [formData.action]);

  // Validate form data
  const validate = useCallback(
    (data: FormData): FormErrors => {
      const newErrors: FormErrors = {};

      // Validate CTA ID
      if (!data.ctaId.trim()) {
        newErrors.ctaId = 'CTA ID is required';
      } else if (!/^[a-z0-9_]+$/.test(data.ctaId)) {
        newErrors.ctaId = 'CTA ID must be lowercase alphanumeric with underscores';
      } else if (
        (!isEditMode || data.ctaId !== ctaId) &&
        existingCtaIds.includes(data.ctaId)
      ) {
        newErrors.ctaId = 'A CTA with this ID already exists';
      }

      // Validate with Zod schema
      try {
        const ctaData: Partial<CTADefinition> = {
          label: data.label,
          action: data.action,
          type: data.type,
          style: data.style,
        };

        // Add action-specific fields
        if (data.action === 'start_form') {
          ctaData.formId = data.formId;
        } else if (data.action === 'external_link') {
          ctaData.url = data.url;
        } else if (data.action === 'send_query') {
          ctaData.query = data.query;
        } else if (data.action === 'show_info') {
          ctaData.prompt = data.prompt;
        }

        ctaDefinitionSchema.parse(ctaData);
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
    [isEditMode, ctaId, existingCtaIds]
  );

  // Handle field changes
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
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
      ctaId: true,
      label: true,
      action: true,
      formId: true,
      url: true,
      query: true,
      prompt: true,
      type: true,
      style: true,
    });

    // Validate all fields
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create CTA object
      const ctaData: CTADefinition = {
        label: formData.label,
        action: formData.action,
        type: formData.type,
        style: formData.style,
      };

      // Add action-specific fields
      if (formData.action === 'start_form' && formData.formId) {
        ctaData.formId = formData.formId;
      } else if (formData.action === 'external_link' && formData.url) {
        ctaData.url = formData.url;
      } else if (formData.action === 'send_query' && formData.query) {
        ctaData.query = formData.query;
      } else if (formData.action === 'show_info' && formData.prompt) {
        ctaData.prompt = formData.prompt;
      }

      onSubmit(formData.ctaId, ctaData);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };

  // Render conditional fields based on action
  const renderConditionalField = () => {
    switch (formData.action) {
      case 'start_form':
        return (
          <div className="w-full">
            {formOptions.length > 0 ? (
              <Select
                label="Form"
                placeholder="Select a form..."
                options={formOptions}
                value={formData.formId || ''}
                onValueChange={(value) => handleChange('formId', value)}
                error={touched.formId ? errors.formId : undefined}
                helperText="The form to trigger when this CTA is clicked"
                required
              />
            ) : (
              <Alert variant="warning">
                <AlertDescription>
                  No forms available. Please create a form first before creating a start_form CTA.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'external_link':
        return (
          <Input
            label="URL"
            id="url"
            type="url"
            placeholder="https://example.com"
            value={formData.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            onBlur={() => handleBlur('url')}
            error={touched.url ? errors.url : undefined}
            helperText="The URL to open when this CTA is clicked"
            required
          />
        );

      case 'send_query':
        return (
          <Textarea
            label="Query"
            id="query"
            placeholder="Enter the query to send to Bedrock..."
            value={formData.query || ''}
            onChange={(e) => handleChange('query', e.target.value)}
            onBlur={() => handleBlur('query')}
            error={touched.query ? errors.query : undefined}
            helperText="The query to send to Bedrock when this CTA is clicked"
            rows={4}
            required
          />
        );

      case 'show_info':
        return (
          <Textarea
            label="Information Prompt"
            id="prompt"
            placeholder="Enter the information to display..."
            value={formData.prompt || ''}
            onChange={(e) => handleChange('prompt', e.target.value)}
            onBlur={() => handleBlur('prompt')}
            error={touched.prompt ? errors.prompt : undefined}
            helperText="The information message to display when this CTA is clicked"
            rows={4}
            required
          />
        );

      default:
        return null;
    }
  };

  // Check if form is valid
  const isValid = Object.keys(validate(formData)).length === 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEditMode ? `Edit CTA: ${ctaId}` : 'Create CTA'}
            </ModalTitle>
            <ModalDescription>
              {isEditMode
                ? 'Update the CTA details below.'
                : 'Define a new call-to-action button with action-specific configuration.'}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* CTA ID */}
            <Input
              label="CTA ID"
              id="cta_id"
              placeholder="e.g., apply_now"
              value={formData.ctaId}
              onChange={(e) => handleChange('ctaId', e.target.value)}
              onBlur={() => handleBlur('ctaId')}
              error={touched.ctaId ? errors.ctaId : undefined}
              helperText={
                isEditMode
                  ? 'CTA ID cannot be changed'
                  : 'Auto-generated from label. Lowercase letters, numbers, and underscores only.'
              }
              disabled={isEditMode}
              required
            />

            {/* Label */}
            <Input
              label="Label"
              id="label"
              placeholder="e.g., Apply Now"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              onBlur={() => handleBlur('label')}
              error={touched.label ? errors.label : undefined}
              helperText="The text displayed on the button"
              required
              autoFocus={!isEditMode}
            />

            {/* Action */}
            <Select
              label="Action"
              placeholder="Select action type..."
              options={actionOptions}
              value={formData.action}
              onValueChange={(value) => handleChange('action', value as CTAActionType)}
              error={touched.action ? errors.action : undefined}
              helperText="What happens when this CTA is clicked"
              required
            />

            {/* Conditional field based on action */}
            {renderConditionalField()}

            {/* Type (auto-populated, read-only display) */}
            <Select
              label="CTA Type"
              placeholder="Select type..."
              options={typeOptions}
              value={formData.type}
              onValueChange={(value) => handleChange('type', value as CTAType)}
              error={touched.type ? errors.type : undefined}
              helperText="Auto-populated based on action type"
              disabled
              required
            />

            {/* Style */}
            <Select
              label="Style"
              placeholder="Select style..."
              options={styleOptions}
              value={formData.style}
              onValueChange={(value) => handleChange('style', value as CTAStyle)}
              error={touched.style ? errors.style : undefined}
              helperText="Visual style of the button"
              required
            />

            {/* Info box */}
            <Alert variant="info">
              <AlertDescription>
                CTAs are call-to-action buttons that can trigger forms, open links, send queries, or display information.
                Each action type requires specific configuration.
              </AlertDescription>
            </Alert>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update CTA' : 'Create CTA'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
