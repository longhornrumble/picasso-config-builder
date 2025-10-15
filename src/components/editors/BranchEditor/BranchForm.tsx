/**
 * BranchForm Component
 * Modal form for creating and editing branches with validation
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
  Select,
  Alert,
  AlertDescription,
  Badge,
} from '@/components/ui';
import { conversationBranchSchema } from '@/lib/schemas';
import type { ConversationBranch, CTADefinition } from '@/types/config';
import type { SelectOption } from '@/components/ui/Select';
import { ZodError } from 'zod';

export interface BranchFormProps {
  /**
   * The branch ID being edited (null for create mode)
   */
  branchId: string | null;
  /**
   * The branch being edited (null for create mode)
   */
  branch: ConversationBranch | null;
  /**
   * Array of existing branch IDs (for duplicate validation)
   */
  existingBranchIds: string[];
  /**
   * Record of available CTAs
   */
  availableCTAs: Record<string, CTADefinition>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (branchId: string, branch: ConversationBranch) => void;
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
  branchId: string;
  detection_keywords: string[];
  primary_cta: string;
  secondary_ctas: string[];
}

interface FormErrors {
  branchId?: string;
  detection_keywords?: string;
  primary_cta?: string;
  secondary_ctas?: string;
  form?: string;
}

/**
 * BranchForm - Modal form for creating/editing branches
 *
 * @example
 * ```tsx
 * <BranchForm
 *   branchId={editingBranchId}
 *   branch={editingBranch}
 *   existingBranchIds={existingIds}
 *   availableCTAs={ctas}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   open={isOpen}
 * />
 * ```
 */
export const BranchForm: React.FC<BranchFormProps> = ({
  branchId,
  branch,
  existingBranchIds,
  availableCTAs,
  onSubmit,
  onCancel,
  open,
}) => {
  const isEditMode = branchId !== null && branch !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    branchId: branchId || '',
    detection_keywords: branch?.detection_keywords || [],
    primary_cta: branch?.available_ctas.primary || '',
    secondary_ctas: branch?.available_ctas.secondary || [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert CTAs to SelectOptions
  const ctaOptions: SelectOption[] = Object.entries(availableCTAs).map(([id, cta]) => ({
    value: id,
    label: cta.label,
  }));

  // Add "None" option for secondary CTAs
  const secondaryCTAOptions: SelectOption[] = [
    { value: '', label: 'Select a CTA...' },
    ...ctaOptions,
  ];

  // Reset form when branch changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        branchId: branchId || '',
        detection_keywords: branch?.detection_keywords || [],
        primary_cta: branch?.available_ctas.primary || '',
        secondary_ctas: branch?.available_ctas.secondary || [],
      });
      setKeywordInput('');
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [branchId, branch, open]);

  // Validate form data
  const validate = useCallback(
    (data: FormData): FormErrors => {
      const newErrors: FormErrors = {};

      // Validate branch ID
      if (!data.branchId.trim()) {
        newErrors.branchId = 'Branch ID is required';
      } else if (!/^[a-z0-9_]+$/.test(data.branchId)) {
        newErrors.branchId = 'Branch ID must be lowercase alphanumeric with underscores';
      } else if (
        (!isEditMode || data.branchId !== branchId) &&
        existingBranchIds.includes(data.branchId)
      ) {
        newErrors.branchId = 'A branch with this ID already exists';
      }

      // Validate with Zod schema
      try {
        conversationBranchSchema.parse({
          detection_keywords: data.detection_keywords,
          available_ctas: {
            primary: data.primary_cta,
            secondary: data.secondary_ctas,
          },
        });
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const pathStr = err.path.join('.');
            if (pathStr.startsWith('detection_keywords')) {
              if (!newErrors.detection_keywords) {
                newErrors.detection_keywords = err.message;
              }
            } else if (pathStr.includes('primary')) {
              if (!newErrors.primary_cta) {
                newErrors.primary_cta = err.message;
              }
            } else if (pathStr.includes('secondary')) {
              if (!newErrors.secondary_ctas) {
                newErrors.secondary_ctas = err.message;
              }
            }
          });
        }
      }

      return newErrors;
    },
    [isEditMode, branchId, existingBranchIds]
  );

  // Handle keyword addition
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !formData.detection_keywords.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        detection_keywords: [...prev.detection_keywords, trimmed],
      }));
      setKeywordInput('');

      // Clear keyword error
      if (errors.detection_keywords) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.detection_keywords;
          return newErrors;
        });
      }
    }
  };

  // Handle keyword removal
  const handleRemoveKeyword = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      detection_keywords: prev.detection_keywords.filter((_, i) => i !== index),
    }));
  };

  // Handle keyword input key press
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // Handle secondary CTA addition
  const handleAddSecondaryCTA = (ctaId: string) => {
    if (ctaId && !formData.secondary_ctas.includes(ctaId)) {
      setFormData((prev) => ({
        ...prev,
        secondary_ctas: [...prev.secondary_ctas, ctaId],
      }));
    }
  };

  // Handle secondary CTA removal
  const handleRemoveSecondaryCTA = (ctaId: string) => {
    setFormData((prev) => ({
      ...prev,
      secondary_ctas: prev.secondary_ctas.filter((id) => id !== ctaId),
    }));
  };

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
      branchId: true,
      detection_keywords: true,
      primary_cta: true,
      secondary_ctas: true,
    });

    // Validate all fields
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create branch object
      const branchData: ConversationBranch = {
        detection_keywords: formData.detection_keywords,
        available_ctas: {
          primary: formData.primary_cta,
          secondary: formData.secondary_ctas,
        },
      };

      onSubmit(formData.branchId, branchData);
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
      <ModalContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEditMode ? `Edit Branch: ${branchId}` : 'Create Branch'}
            </ModalTitle>
            <ModalDescription>
              {isEditMode
                ? 'Update the branch details below.'
                : 'Define a new conversation branch with keywords and CTAs.'}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Form-level error */}
            {errors.form && (
              <Alert variant="error">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Branch ID */}
            <Input
              label="Branch ID"
              id="branch_id"
              placeholder="e.g., volunteer_branch"
              value={formData.branchId}
              onChange={(e) => handleChange('branchId', e.target.value)}
              onBlur={() => handleBlur('branchId')}
              error={touched.branchId ? errors.branchId : undefined}
              helperText={
                isEditMode
                  ? 'Branch ID cannot be changed'
                  : 'Lowercase letters, numbers, and underscores only'
              }
              disabled={isEditMode}
              required
              autoFocus={!isEditMode}
            />

            {/* Keywords */}
            <div className="w-full">
              <label
                htmlFor="keywords"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Detection Keywords
                <span className="ml-1 text-red-500">*</span>
              </label>

              {/* Keywords display */}
              {formData.detection_keywords.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  {formData.detection_keywords.map((keyword, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {keyword}
                      <X
                        className="w-3 h-3"
                        onClick={() => handleRemoveKeyword(idx)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Keyword input */}
              <Input
                id="keywords"
                placeholder="Type keyword and press Enter or comma"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyPress}
                onBlur={handleAddKeyword}
                error={touched.detection_keywords ? errors.detection_keywords : undefined}
                helperText="Add keywords that will trigger this branch. Press Enter or comma to add."
              />
            </div>

            {/* Primary CTA */}
            {ctaOptions.length > 0 ? (
              <Select
                label="Primary CTA"
                placeholder="Select primary CTA..."
                options={ctaOptions}
                value={formData.primary_cta}
                onValueChange={(value) => handleChange('primary_cta', value)}
                error={touched.primary_cta ? errors.primary_cta : undefined}
                helperText="The main call-to-action button for this branch"
                required
              />
            ) : (
              <Alert variant="warning">
                <AlertDescription>
                  No CTAs available. Please create CTAs first before creating branches.
                </AlertDescription>
              </Alert>
            )}

            {/* Secondary CTAs */}
            {ctaOptions.length > 0 && (
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary CTAs (Optional)
                </label>

                {/* Secondary CTAs display */}
                {formData.secondary_ctas.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                    {formData.secondary_ctas.map((ctaId) => {
                      const cta = availableCTAs[ctaId];
                      return (
                        <Badge
                          key={ctaId}
                          variant="info"
                          className="flex items-center gap-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          {cta?.label || ctaId}
                          <X
                            className="w-3 h-3"
                            onClick={() => handleRemoveSecondaryCTA(ctaId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Secondary CTA selector */}
                {formData.secondary_ctas.length < 2 && (
                  <Select
                    placeholder="Add secondary CTA..."
                    options={secondaryCTAOptions.filter(
                      (opt) =>
                        opt.value !== formData.primary_cta &&
                        !formData.secondary_ctas.includes(opt.value)
                    )}
                    value=""
                    onValueChange={handleAddSecondaryCTA}
                    error={touched.secondary_ctas ? errors.secondary_ctas : undefined}
                    helperText="Add up to 2 secondary CTAs for this branch"
                  />
                )}
              </div>
            )}

            {/* Info box */}
            <Alert variant="info">
              <AlertDescription>
                Branches route conversations based on keywords. When a user's message contains
                these keywords, the assigned CTAs will be presented to them.
              </AlertDescription>
            </Alert>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Branch' : 'Create Branch'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
