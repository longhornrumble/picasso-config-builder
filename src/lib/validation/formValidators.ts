/**
 * Form-Level Validators
 * Simple validation functions for CRUD forms
 *
 * These validators wrap Zod schemas and add duplicate checking logic.
 * Used by the generic EntityForm component for field-level validation.
 */

import { ZodError } from 'zod';
import {
  programSchema,
  conversationalFormSchema,
  ctaDefinitionSchema,
  conversationBranchSchema,
} from '@/lib/schemas';
import type { Program, ConversationalForm, CTADefinition } from '@/types/config';
import type { BranchEntity } from '@/components/editors/BranchesEditor/types';
import type { CTAEntity } from '@/components/editors/CTAsEditor/types';
import type { ActionChipEntity } from '@/components/editors/ActionChipsEditor/types';
import type { ValidationErrors } from '@/types/validation';
import type { ValidationContext } from '@/lib/crud/types';

// ============================================================================
// PROGRAM VALIDATION
// ============================================================================

/**
 * Validate a program entity
 *
 * Checks:
 * - Zod schema validation (required fields, format, length)
 * - Duplicate program_id check (only in create mode)
 */
export function validateProgram(
  data: Program,
  context: ValidationContext<Program>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // Validate with Zod schema
    programSchema.parse({
      program_id: data.program_id,
      program_name: data.program_name,
      description: data.description || undefined,
    });

    // Check for duplicate program_id (only in create mode or if ID changed)
    if (
      (!context.isEditMode || data.program_id !== context.originalEntity?.program_id) &&
      context.existingIds.includes(data.program_id)
    ) {
      errors.program_id = 'A program with this ID already exists';
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
  }

  return errors;
}

// ============================================================================
// CTA VALIDATION
// ============================================================================

/**
 * Validate a CTA entity
 *
 * Checks:
 * - Zod schema validation
 * - CTA ID format validation
 * - Action-specific requirements (formId for start_form, url for external_link, etc.)
 * - Duplicate CTA ID check (only in create mode)
 */
export function validateCTA(
  data: CTAEntity,
  context: ValidationContext<CTAEntity>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // Validate CTA ID format
    if (!data.ctaId || !data.ctaId.trim()) {
      errors.ctaId = 'CTA ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.ctaId)) {
      errors.ctaId = 'CTA ID can only contain letters, numbers, hyphens, and underscores';
    }

    // Check for duplicate CTA ID (only in create mode or if ID changed)
    if (
      data.ctaId &&
      (!context.isEditMode || data.ctaId !== context.originalEntity?.ctaId) &&
      context.existingIds.includes(data.ctaId)
    ) {
      errors.ctaId = 'A CTA with this ID already exists';
    }

    // Validate with Zod schema (without ctaId, since it's not in CTADefinition)
    const ctaData: CTADefinition = {
      label: data.label,
      action: data.action,
      type: data.type,
      ...(data.formId && { formId: data.formId }),
      ...(data.url && { url: data.url }),
      ...(data.query && { query: data.query }),
      ...(data.prompt && { prompt: data.prompt }),
    };
    ctaDefinitionSchema.parse(ctaData);

    // Action-specific validation
    if (data.action === 'start_form' && !data.formId) {
      errors.formId = 'Form ID is required for start_form action';
    }

    if (data.action === 'external_link' && !data.url) {
      errors.url = 'URL is required for external_link action';
    }

    if (data.action === 'send_query' && !data.query) {
      errors.query = 'Query is required for send_query action';
    }

    if (data.action === 'show_info' && !data.prompt) {
      errors.prompt = 'Prompt is required for show_info action';
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
  }

  return errors;
}

// ============================================================================
// BRANCH VALIDATION
// ============================================================================

/**
 * Validate a conversation branch entity
 *
 * Checks:
 * - Zod schema validation
 * - Branch ID format validation
 * - Primary CTA is set
 * - Duplicate branch ID check (only in create mode)
 */
export function validateBranch(
  data: BranchEntity,
  context: ValidationContext<BranchEntity>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // Validate branch ID format
    if (!data.branchId || !data.branchId.trim()) {
      errors.branchId = 'Branch ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.branchId)) {
      errors.branchId = 'Branch ID can only contain letters, numbers, hyphens, and underscores';
    }

    // Check for duplicate branch ID (only in create mode or if ID changed)
    if (
      data.branchId &&
      (!context.isEditMode || data.branchId !== context.originalEntity?.branchId) &&
      context.existingIds.includes(data.branchId)
    ) {
      errors.branchId = 'A branch with this ID already exists';
    }

    // Filter out null/undefined/empty secondary CTAs before validation
    const cleanedData = {
      available_ctas: {
        primary: data.available_ctas.primary,
        secondary: data.available_ctas.secondary.filter((cta) => cta != null && cta !== ''),
      },
    };

    // Validate with Zod schema (without branchId, since it's not in ConversationBranch)
    conversationBranchSchema.parse(cleanedData);

    // Check for primary CTA
    if (!cleanedData.available_ctas?.primary) {
      errors['available_ctas.primary'] = 'Primary CTA is required';
    }

    // Check total CTA count against global max_ctas_per_response setting
    const totalCTAs = 1 + cleanedData.available_ctas.secondary.length;
    const maxCtas = context.maxCtasPerResponse || 10; // Default to 10 if not set
    if (totalCTAs > maxCtas) {
      errors['available_ctas.secondary'] = `Total CTAs (${totalCTAs}) exceeds max limit of ${maxCtas} set in Settings`;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
  }

  return errors;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Validate a conversational form entity
 *
 * Checks:
 * - Zod schema validation
 * - Required fields (form_id, program, title, fields)
 * - At least one field
 * - At least one trigger phrase
 * - Duplicate form_id check (only in create mode)
 */
export function validateForm(
  data: ConversationalForm,
  context: ValidationContext<ConversationalForm>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // Validate with Zod schema
    conversationalFormSchema.parse(data);

    // Check for duplicate form_id (only in create mode or if ID changed)
    if (
      (!context.isEditMode || data.form_id !== context.originalEntity?.form_id) &&
      context.existingIds.includes(data.form_id)
    ) {
      errors.form_id = 'A form with this ID already exists';
    }

    // Note: Field and trigger phrase validation is handled by Zod schema
    // No need to duplicate validation logic here

    // Check that program exists (if programs are provided in context)
    // Note: Full cross-entity validation is handled by the main validation engine
    // This is just a basic check for the form level
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
  }

  return errors;
}

// ============================================================================
// ACTION CHIP VALIDATION
// ============================================================================

/**
 * Validate an action chip entity
 *
 * Checks:
 * - Chip ID format validation
 * - Required fields (label, value)
 * - Duplicate chip ID check (only in create mode)
 */
export function validateActionChip(
  data: ActionChipEntity,
  context: ValidationContext<ActionChipEntity>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // Validate chip ID format
    if (!data.chipId || !data.chipId.trim()) {
      errors.chipId = 'Chip ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.chipId)) {
      errors.chipId = 'Chip ID can only contain letters, numbers, hyphens, and underscores';
    }

    // Check for duplicate chip ID (only in create mode or if ID changed)
    if (
      data.chipId &&
      (!context.isEditMode || data.chipId !== context.originalEntity?.chipId) &&
      context.existingIds.includes(data.chipId)
    ) {
      errors.chipId = 'An action chip with this ID already exists';
    }

    // Validate label
    if (!data.label || !data.label.trim()) {
      errors.label = 'Label is required';
    } else if (data.label.length > 50) {
      errors.label = 'Label must be 50 characters or less';
    }

    // Validate value/query (required for send_query and show_info, not for show_showcase)
    if (data.action !== 'show_showcase') {
      if (!data.value || !data.value.trim()) {
        errors.value = 'Query is required';
      } else if (data.value.length > 200) {
        errors.value = 'Query must be 200 characters or less';
      }
    }

    // Validate target_showcase_id (required for show_showcase action)
    if (data.action === 'show_showcase') {
      if (!data.target_showcase_id || !data.target_showcase_id.trim()) {
        errors.target_showcase_id = 'Showcase item is required for this action';
      }
    }

    // target_branch is optional, no validation needed
  } catch (error) {
    // Handle any unexpected errors
    console.error('Validation error:', error);
  }

  return errors;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if validation errors object has any errors
 */
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).some((key) => errors[key] !== undefined);
}

/**
 * Get count of validation errors
 */
export function getErrorCount(errors: ValidationErrors): number {
  return Object.keys(errors).filter((key) => errors[key] !== undefined).length;
}

/**
 * Clear specific error from validation errors object
 */
export function clearError(errors: ValidationErrors, field: string): ValidationErrors {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}
