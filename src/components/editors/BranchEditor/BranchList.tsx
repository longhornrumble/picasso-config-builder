/**
 * BranchList Component
 * Responsive grid display of branch cards
 */

import React from 'react';
import { BranchCard } from './BranchCard';
import type { ConversationBranch, CTADefinition } from '@/types/config';

export interface BranchListProps {
  /**
   * Array of branches to display
   */
  branches: Array<{ id: string; branch: ConversationBranch }>;
  /**
   * Record of available CTAs for display
   */
  ctas: Record<string, CTADefinition>;
  /**
   * Callback when edit button is clicked
   */
  onEdit: (branchId: string, branch: ConversationBranch) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (branchId: string, branch: ConversationBranch) => void;
}

/**
 * BranchList - Responsive grid of branch cards
 *
 * @example
 * ```tsx
 * <BranchList
 *   branches={branchList}
 *   ctas={ctas}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const BranchList: React.FC<BranchListProps> = ({
  branches,
  ctas,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {branches.map(({ id, branch }) => (
        <BranchCard
          key={id}
          branchId={id}
          branch={branch}
          ctas={ctas}
          onEdit={() => onEdit(id, branch)}
          onDelete={() => onDelete(id, branch)}
        />
      ))}
    </div>
  );
};
