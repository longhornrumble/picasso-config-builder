/**
 * ActionChipsEditor Types
 * Extended types for Action Chips editor to work with generic CRUD framework
 */

import type { ActionChip } from '@/types/config';

/**
 * ActionChipEntity - ActionChip with explicit ID field
 *
 * The store uses Record<string, ActionChip> where the key is the ID.
 * This type adds the ID as a field to work with the generic framework.
 */
export interface ActionChipEntity extends ActionChip {
  chipId: string;
}
