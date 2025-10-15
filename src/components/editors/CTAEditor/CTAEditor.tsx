/**
 * CTAEditor Component
 * Main container for managing CTAs (CRUD operations)
 */

import React, { useState, useMemo } from 'react';
import { Plus, MousePointerClick } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import { CTAList } from './CTAList';
import { CTAForm } from './CTAForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import type { CTADefinition } from '@/types/config';

/**
 * Empty state component when no CTAs exist
 */
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <Card>
    <CardContent className="pt-6 text-center py-12">
      <MousePointerClick className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No CTAs Defined
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Call-to-action buttons guide users through specific workflows.
        Create CTAs to trigger forms, open links, send queries, or display information.
      </p>
      <Button
        variant="primary"
        onClick={onCreateClick}
        className="flex items-center gap-2 mx-auto"
      >
        <Plus className="w-4 h-4" />
        Create First CTA
      </Button>
    </CardContent>
  </Card>
);

/**
 * CTAEditor - Main CTA management interface
 *
 * @example
 * ```tsx
 * <CTAEditor />
 * ```
 */
export const CTAEditor: React.FC = () => {
  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCtaId, setEditingCtaId] = useState<string | null>(null);
  const [editingCta, setEditingCta] = useState<CTADefinition | null>(null);
  const [deletingCtaId, setDeletingCtaId] = useState<string | null>(null);
  const [deletingCta, setDeletingCta] = useState<CTADefinition | null>(null);

  // Get data from store
  const {
    ctas,
    forms,
    createCTA,
    updateCTA,
    deleteCTA,
    getCTADependencies,
  } = useConfigStore((state) => ({
    ctas: state.ctas.ctas,
    forms: state.forms.forms,
    createCTA: state.ctas.createCTA,
    updateCTA: state.ctas.updateCTA,
    deleteCTA: state.ctas.deleteCTA,
    getCTADependencies: state.ctas.getCTADependencies,
  }));

  // Convert CTAs record to count
  const ctaCount = useMemo(() => Object.keys(ctas).length, [ctas]);

  // Get existing CTA IDs for validation
  const existingCtaIds = useMemo(() => Object.keys(ctas), [ctas]);

  // Get available forms for formId dropdown
  const availableForms = useMemo(() => {
    return Object.fromEntries(
      Object.values(forms).map((form) => [
        form.form_id,
        { form_id: form.form_id, title: form.title },
      ])
    );
  }, [forms]);

  // Get dependencies for deleting CTA
  const deleteDependencies = useMemo(() => {
    if (!deletingCtaId) return null;
    return getCTADependencies(deletingCtaId);
  }, [deletingCtaId, getCTADependencies]);

  // Handle create button click
  const handleCreate = () => {
    setEditingCtaId(null);
    setEditingCta(null);
    setIsFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (ctaId: string, cta: CTADefinition) => {
    setEditingCtaId(ctaId);
    setEditingCta(cta);
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (ctaId: string, cta: CTADefinition) => {
    setDeletingCtaId(ctaId);
    setDeletingCta(cta);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (ctaId: string, cta: CTADefinition) => {
    if (editingCtaId) {
      // Update existing CTA
      updateCTA(editingCtaId, cta);
    } else {
      // Create new CTA
      createCTA(cta, ctaId);
    }

    // Close modal
    setIsFormOpen(false);
    setEditingCtaId(null);
    setEditingCta(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCtaId(null);
    setEditingCta(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingCtaId) {
      deleteCTA(deletingCtaId);
      setIsDeleteModalOpen(false);
      setDeletingCtaId(null);
      setDeletingCta(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingCtaId(null);
    setDeletingCta(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Call-to-Actions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage CTA buttons with various action types
          </p>
        </div>
        {ctaCount > 0 && (
          <Button
            variant="primary"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create CTA
          </Button>
        )}
      </div>

      {/* Content */}
      {ctaCount === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : (
        <CTAList ctas={ctas} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {/* Create/Edit Modal */}
      <CTAForm
        ctaId={editingCtaId}
        cta={editingCta}
        existingCtaIds={existingCtaIds}
        availableForms={availableForms}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        open={isFormOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        cta={deletingCta}
        ctaId={deletingCtaId}
        dependencies={deleteDependencies}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        open={isDeleteModalOpen}
      />
    </div>
  );
};
