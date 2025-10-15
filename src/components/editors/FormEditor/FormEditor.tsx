/**
 * FormEditor Component
 * Main container for managing conversational forms (CRUD operations)
 */

import React, { useState, useMemo } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { FormList } from './FormList';
import { FormForm } from './FormForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import type { ConversationalForm } from '@/types/config';

/**
 * Empty state component when no forms exist
 */
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <Card>
    <CardContent className="pt-6 text-center py-12">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No Forms Defined
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Conversational forms collect user data through natural conversation.
        Create forms to gather information like applications, surveys, or intake forms.
      </p>
      <Button
        variant="primary"
        onClick={onCreateClick}
        className="flex items-center gap-2 mx-auto"
      >
        <Plus className="w-4 h-4" />
        Create First Form
      </Button>
    </CardContent>
  </Card>
);

/**
 * FormEditor - Main form management interface
 *
 * @example
 * ```tsx
 * <FormEditor />
 * ```
 */
export const FormEditor: React.FC = () => {
  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ConversationalForm | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deletingForm, setDeletingForm] = useState<ConversationalForm | null>(null);

  // Get data from store
  const {
    forms,
    programs,
    ctas,
    createForm,
    updateForm,
    deleteForm,
    getFormDependencies,
  } = useConfigStore((state) => ({
    forms: state.forms.forms,
    programs: state.programs.programs,
    ctas: state.ctas.ctas,
    createForm: state.forms.createForm,
    updateForm: state.forms.updateForm,
    deleteForm: state.forms.deleteForm,
    getFormDependencies: state.forms.getFormDependencies,
  }));

  // Convert forms record to array
  const formList = useMemo(
    () => Object.entries(forms).map(([id, form]) => ({ id, form })),
    [forms]
  );

  // Get existing form IDs for validation
  const existingFormIds = useMemo(() => Object.keys(forms), [forms]);

  // Get dependencies for deleting form
  const deleteDependencies = useMemo(() => {
    if (!deletingFormId) return { count: 0, ctaNames: [] };

    const deps = getFormDependencies(deletingFormId);
    const ctaNames = deps.ctas
      .map((ctaId) => ctas[ctaId]?.label || ctaId)
      .filter(Boolean);

    return {
      count: deps.ctas.length,
      ctaNames,
    };
  }, [deletingFormId, ctas, getFormDependencies]);

  // Handle create button click
  const handleCreate = () => {
    setEditingFormId(null);
    setEditingForm(null);
    setIsFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (formId: string, form: ConversationalForm) => {
    setEditingFormId(formId);
    setEditingForm(form);
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (formId: string, form: ConversationalForm) => {
    setDeletingFormId(formId);
    setDeletingForm(form);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (_formId: string, form: ConversationalForm) => {
    if (editingFormId) {
      // Update existing form
      updateForm(editingFormId, form);
    } else {
      // Create new form
      createForm(form);
    }

    // Close modal
    setIsFormOpen(false);
    setEditingFormId(null);
    setEditingForm(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingFormId(null);
    setEditingForm(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingFormId) {
      deleteForm(deletingFormId);
      setIsDeleteModalOpen(false);
      setDeletingFormId(null);
      setDeletingForm(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingFormId(null);
    setDeletingForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Conversational Forms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage forms for collecting user data through conversation
          </p>
        </div>
        {formList.length > 0 && (
          <Button
            variant="primary"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        )}
      </div>

      {/* Content */}
      {formList.length === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : (
        <FormList
          forms={formList}
          programs={programs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create/Edit Modal */}
      <FormForm
        formId={editingFormId}
        form={editingForm}
        existingFormIds={existingFormIds}
        availablePrograms={programs}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        open={isFormOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        formId={deletingFormId}
        form={deletingForm}
        dependentCTAsCount={deleteDependencies.count}
        dependentCTANames={deleteDependencies.ctaNames}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        open={isDeleteModalOpen}
      />
    </div>
  );
};
