/**
 * AvailableActionsEditor Types
 * Extended types for vocabulary editor to work with generic CRUD framework
 */

import type { AvailableActionEntry } from '@/types/config';

/**
 * AvailableActionEntity - AvailableActionEntry with explicit ID field
 *
 * The store uses Record<string, AvailableActionEntry> where the key is the ID.
 * This type adds the ID as a field to work with the generic framework.
 */
export interface AvailableActionEntity extends AvailableActionEntry {
  actionId: string;
}
