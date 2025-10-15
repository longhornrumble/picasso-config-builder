/**
 * BranchEditor Component
 * Main container for managing conversation branches (CRUD operations)
 */

import React, { useState, useMemo } from 'react';
import { Plus, GitBranch } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { BranchList } from './BranchList';
import { BranchForm } from './BranchForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import type { ConversationBranch } from '@/types/config';

/**
 * Empty state component when no branches exist
 */
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <Card>
    <CardContent className="pt-6 text-center py-12">
      <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No Branches Defined
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Branches route conversations based on keyword detection.
        Create branches to direct users to specific CTAs based on their inquiries.
      </p>
      <Button
        variant="primary"
        onClick={onCreateClick}
        className="flex items-center gap-2 mx-auto"
      >
        <Plus className="w-4 h-4" />
        Create First Branch
      </Button>
    </CardContent>
  </Card>
);

/**
 * BranchEditor - Main branch management interface
 *
 * @example
 * ```tsx
 * <BranchEditor />
 * ```
 */
export const BranchEditor: React.FC = () => {
  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<ConversationBranch | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<ConversationBranch | null>(null);

  // Get data from store
  const {
    branches,
    ctas,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchDependencies,
  } = useConfigStore((state) => ({
    branches: state.branches.branches,
    ctas: state.ctas.ctas,
    createBranch: state.branches.createBranch,
    updateBranch: state.branches.updateBranch,
    deleteBranch: state.branches.deleteBranch,
    getBranchDependencies: state.branches.getBranchDependencies,
  }));

  // Convert branches record to array
  const branchList = useMemo(
    () => Object.entries(branches).map(([id, branch]) => ({ id, branch })),
    [branches]
  );

  // Get existing branch IDs for validation
  const existingBranchIds = useMemo(() => Object.keys(branches), [branches]);

  // Get dependencies for deleting branch
  const deleteDependencies = useMemo(() => {
    if (!deletingBranchId) return { count: 0, ctaNames: [] };

    const deps = getBranchDependencies(deletingBranchId);
    const ctaNames = deps.ctas
      .map((ctaId) => ctas[ctaId]?.label || ctaId)
      .filter(Boolean);

    return {
      count: deps.ctas.length,
      ctaNames,
    };
  }, [deletingBranchId, ctas, getBranchDependencies]);

  // Handle create button click
  const handleCreate = () => {
    setEditingBranchId(null);
    setEditingBranch(null);
    setIsFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (branchId: string, branch: ConversationBranch) => {
    setEditingBranchId(branchId);
    setEditingBranch(branch);
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (branchId: string, branch: ConversationBranch) => {
    setDeletingBranchId(branchId);
    setDeletingBranch(branch);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (branchId: string, branch: ConversationBranch) => {
    if (editingBranchId) {
      // Update existing branch
      updateBranch(editingBranchId, branch);
    } else {
      // Create new branch
      createBranch(branch, branchId);
    }

    // Close modal
    setIsFormOpen(false);
    setEditingBranchId(null);
    setEditingBranch(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingBranchId(null);
    setEditingBranch(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingBranchId) {
      deleteBranch(deletingBranchId);
      setIsDeleteModalOpen(false);
      setDeletingBranchId(null);
      setDeletingBranch(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingBranchId(null);
    setDeletingBranch(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Conversation Branches
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Route conversations based on keyword detection and assign CTAs
          </p>
        </div>
        {branchList.length > 0 && (
          <Button
            variant="primary"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Branch
          </Button>
        )}
      </div>

      {/* Content */}
      {branchList.length === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : (
        <BranchList
          branches={branchList}
          ctas={ctas}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create/Edit Modal */}
      <BranchForm
        branchId={editingBranchId}
        branch={editingBranch}
        existingBranchIds={existingBranchIds}
        availableCTAs={ctas}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        open={isFormOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        branchId={deletingBranchId}
        branch={deletingBranch}
        dependentCTAsCount={deleteDependencies.count}
        dependentCTANames={deleteDependencies.ctaNames}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        open={isDeleteModalOpen}
      />
    </div>
  );
};
