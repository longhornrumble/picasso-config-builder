/**
 * Content Showcase Editor Types
 */

import type { ShowcaseItem } from '@/types/config';

/**
 * Extended ShowcaseItem type for form handling
 * (Same as ShowcaseItem, but here for consistency with other editors)
 */
export type ShowcaseItemEntity = ShowcaseItem;

/**
 * Validation context extension for showcase items
 * Provides list of available CTA IDs for validation
 */
export interface ShowcaseItemValidationContext {
  availableCtaIds?: string[];
}
