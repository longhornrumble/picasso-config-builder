/**
 * BranchesEditor Types
 * Extended types for branches editor to work with generic CRUD framework
 */

import type { ConversationBranch } from '@/types/config';

/**
 * BranchEntity - ConversationBranch with explicit ID field
 *
 * The store uses Record<string, ConversationBranch> where the key is the ID.
 * This type adds the ID as a field to work with the generic framework.
 */
export interface BranchEntity extends ConversationBranch {
  branchId: string;
}
