/**
 * Showcase Item Validators
 * Validation functions for Content Showcase items
 */

import type { ShowcaseItem } from '@/types/config';
import type { ValidationErrors } from '@/types/validation';
import type { ValidationContext } from '@/lib/crud/types';

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a showcase item entity
 *
 * Checks:
 * - Required fields (name, tagline, description, type, keywords)
 * - At least one keyword
 * - Valid URL format for image_url if provided
 * - Action configuration (if provided):
 *   - Label and type are required
 *   - For 'prompt' type: prompt text is required
 *   - For 'url' type: valid URL is required
 *   - For 'cta' type: valid CTA ID is required
 * - Duplicate ID check (only in create mode)
 */
export function validateShowcaseItem(
  data: ShowcaseItem,
  context: ValidationContext<ShowcaseItem>
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required field validation
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.tagline?.trim()) {
    errors.tagline = 'Tagline is required';
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!data.type) {
    errors.type = 'Type is required';
  }

  // Keywords validation
  if (!data.keywords || data.keywords.length === 0) {
    errors.keywords = 'At least one keyword is required';
  }

  // Image URL validation (optional, but must be valid if provided)
  if (data.image_url && data.image_url.trim() && !isValidUrl(data.image_url)) {
    errors.image_url = 'Must be a valid URL';
  }

  // Action configuration validation (optional, but must be complete if provided)
  if (data.action) {
    // Action label is required if action exists
    if (!data.action.label?.trim()) {
      errors['action.label'] = 'Action label is required';
    }

    // Action type is required if action exists
    if (!data.action.type) {
      errors['action.type'] = 'Action type is required';
    }

    // Type-specific validation
    if (data.action.type === 'prompt') {
      // Prompt action requires prompt text
      if (!data.action.prompt?.trim()) {
        errors['action.prompt'] = 'Bedrock prompt is required for prompt actions';
      }
    } else if (data.action.type === 'url') {
      // URL action requires valid URL
      if (!data.action.url?.trim()) {
        errors['action.url'] = 'URL is required for URL actions';
      } else if (!isValidUrl(data.action.url)) {
        errors['action.url'] = 'Must be a valid URL';
      }
    } else if (data.action.type === 'cta') {
      // CTA action requires valid CTA ID
      if (!data.action.cta_id) {
        errors['action.cta_id'] = 'CTA selection is required for CTA actions';
      } else if (context.availableCtaIds && !context.availableCtaIds.includes(data.action.cta_id)) {
        errors['action.cta_id'] = 'Selected CTA does not exist';
      }
    }
  }

  // Check for duplicate ID (only in create mode or if ID changed)
  if (
    data.id &&
    (!context.isEditMode || data.id !== context.originalEntity?.id) &&
    context.existingIds.includes(data.id)
  ) {
    errors.id = 'A showcase item with this ID already exists';
  }

  // ID format validation
  if (!data.id || !data.id.trim()) {
    errors.id = 'ID is required';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.id)) {
    errors.id = 'ID can only contain letters, numbers, hyphens, and underscores';
  }

  return errors;
}

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
