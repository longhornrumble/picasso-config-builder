/**
 * BranchesEditor Component
 * Main container for managing conversation branches using the generic CRUD framework
 *
 * This component demonstrates the power of the generic framework:
 * - Reduced from 604 lines to ~120 lines (80% reduction)
 * - No state management boilerplate
 * - No repetitive handlers
 * - Just configuration!
 */

import React, { useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { BranchFormFields } from './BranchFormFields';
import { BranchCardContent } from './BranchCardContent';
import { validateBranch } from '@/lib/validation/formValidators';
import { useConfigStore } from '@/store';
import type { BranchEntity } from './types';
import type { EntityDependencies } from '@/lib/crud/types';
import type { ConversationBranch } from '@/types/config';

/**
 * BranchesEditor - Conversation branches management interface using generic framework
 *
 * @example
 * ```tsx
 * <BranchesEditor />
 * ```
 */
export const BranchesEditor: React.FC = () => {
  // Get store slices
  const branchesRecord = useConfigStore((state) => state.branches.branches);
  const createBranch = useConfigStore((state) => state.branches.createBranch);
  const updateBranch = useConfigStore((state) => state.branches.updateBranch);
  const deleteBranch = useConfigStore((state) => state.branches.deleteBranch);

  // Transform branches from Record<string, ConversationBranch> to BranchEntity[]
  const branches = useMemo(() => {
    return Object.entries(branchesRecord).reduce((acc, [branchId, branch]) => {
      acc[branchId] = {
        ...branch,
        branchId,
      };
      return acc;
    }, {} as Record<string, BranchEntity>);
  }, [branchesRecord]);

  // Configure the generic editor
  return (
    <EntityEditor<BranchEntity>
      initialValue={{
        branchId: '',
        available_ctas: {
          primary: '',
          secondary: [],
        },
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'branch',
          entityName: 'Conversation Branch',
          entityNamePlural: 'Conversation Branches',
          description: 'Define available CTAs for different conversation contexts',
        },

        // Empty state configuration
        emptyState: {
          icon: GitBranch,
          title: 'No Branches Defined',
          description:
            'Conversation branches route users to relevant CTAs based on explicit routing from action chips and CTAs. Create your first branch to define available CTAs for different conversation contexts.',
          actionText: 'Create First Branch',
        },

        // Store and operations
        useStore: () => ({
          entities: branches,

          // Create: Extract branchId and pass branch data separately
          createEntity: (branchEntity: BranchEntity) => {
            const { branchId, ...branchData } = branchEntity;
            const branch: ConversationBranch = {
              available_ctas: branchData.available_ctas,
            };
            createBranch(branch, branchId);
          },

          // Update: Extract branchId and pass updates
          updateEntity: (branchId: string, branchEntity: BranchEntity) => {
            const updates: Partial<ConversationBranch> = {
              available_ctas: branchEntity.available_ctas,
            };
            updateBranch(branchId, updates);
          },

          // Delete: Just pass the branchId
          deleteEntity: (branchId: string) => {
            deleteBranch(branchId);
          },

          // Dependencies: Branches never have dependents (nothing references them)
          // They only have outbound dependencies (CTAs they reference)
          getDependencies: (_branchId: string): EntityDependencies => {
            return {
              canDelete: true, // Branches can always be deleted
              dependentEntities: [],
            };
          },
        }),

        // Validation
        validation: validateBranch,

        // ID and name extraction
        getId: (branch) => branch.branchId,
        getName: (branch) => branch.branchId,

        // Domain-specific components
        FormFields: BranchFormFields,
        CardContent: BranchCardContent,
      }}
    />
  );
};
