/**
 * ProgramsEditor Component
 * Main container for managing programs (CRUD operations)
 */

import React, { useState, useMemo } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { ProgramList } from './ProgramList';
import { ProgramForm } from './ProgramForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import type { Program } from '@/types/config';

/**
 * Empty state component when no programs exist
 */
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <Card>
    <CardContent className="pt-6 text-center py-12">
      <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No Programs Defined
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Programs are organizational units that forms can be assigned to.
        Examples include "Volunteer Programs", "Donation Programs", or "Event Registration".
      </p>
      <Button
        variant="primary"
        onClick={onCreateClick}
        className="flex items-center gap-2 mx-auto"
      >
        <Plus className="w-4 h-4" />
        Create First Program
      </Button>
    </CardContent>
  </Card>
);

/**
 * ProgramsEditor - Main programs management interface
 *
 * @example
 * ```tsx
 * <ProgramsEditor />
 * ```
 */
export const ProgramsEditor: React.FC = () => {
  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);

  // Get data from store
  const {
    programs,
    forms,
    createProgram,
    updateProgram,
    deleteProgram,
    getProgramDependencies,
  } = useConfigStore((state) => ({
    programs: state.programs.programs,
    forms: state.forms.forms,
    createProgram: state.programs.createProgram,
    updateProgram: state.programs.updateProgram,
    deleteProgram: state.programs.deleteProgram,
    getProgramDependencies: state.programs.getProgramDependencies,
  }));

  // Convert programs record to array
  const programList = useMemo(() => Object.values(programs), [programs]);

  // Get existing program IDs for validation
  const existingProgramIds = useMemo(() => Object.keys(programs), [programs]);

  // Calculate form counts for each program
  const formCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(forms).forEach((form) => {
      if (form.program) {
        counts[form.program] = (counts[form.program] || 0) + 1;
      }
    });
    return counts;
  }, [forms]);

  // Get dependencies for deleting program
  const deleteDependencies = useMemo(() => {
    if (!deletingProgram) return { count: 0, formNames: [] };

    const deps = getProgramDependencies(deletingProgram.program_id);
    const formNames = deps.forms.map((formId) => forms[formId]?.title || formId);

    return {
      count: deps.forms.length,
      formNames,
    };
  }, [deletingProgram, forms, getProgramDependencies]);

  // Handle create button click
  const handleCreate = () => {
    setEditingProgram(null);
    setIsFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (program: Program) => {
    setDeletingProgram(program);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (program: Program) => {
    if (editingProgram) {
      // Update existing program
      updateProgram(editingProgram.program_id, program);
    } else {
      // Create new program
      createProgram(program);
    }

    // Close modal
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingProgram) {
      deleteProgram(deletingProgram.program_id);
      setIsDeleteModalOpen(false);
      setDeletingProgram(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingProgram(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Programs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define organizational programs that forms can be assigned to
          </p>
        </div>
        {programList.length > 0 && (
          <Button
            variant="primary"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Program
          </Button>
        )}
      </div>

      {/* Content */}
      {programList.length === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : (
        <ProgramList
          programs={programList}
          formCounts={formCounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create/Edit Modal */}
      <ProgramForm
        program={editingProgram}
        existingProgramIds={existingProgramIds}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        open={isFormOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        program={deletingProgram}
        dependentFormsCount={deleteDependencies.count}
        dependentFormNames={deleteDependencies.formNames}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        open={isDeleteModalOpen}
      />
    </div>
  );
};
