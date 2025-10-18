/**
 * CTAsEditor Types
 * Extended types for CTAs editor to work with generic CRUD framework
 */

import type { CTADefinition } from '@/types/config';

/**
 * CTAEntity - CTADefinition with explicit ID field
 *
 * The store uses Record<string, CTADefinition> where the key is the ID.
 * This type adds the ID as a field to work with the generic framework.
 */
export interface CTAEntity extends CTADefinition {
  ctaId: string;
}
