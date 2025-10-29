/**
 * EntityEditor - Generic CRUD Editor Component
 *
 * This is the main container component for any entity editor.
 * It orchestrates the display, form, and delete modals using a configuration object.
 *
 * @example
 * ```tsx
 * <EntityEditor
 *   config={{
 *     metadata: { entityType: 'program', entityName: 'Program', ... },
 *     useStore: useProgramsStore,
 *     getId: (p) => p.program_id,
 *     getName: (p) => p.program_name,
 *     FormFields: ProgramFormFields,
 *     CardContent: ProgramCardContent,
 *     ...
 *   }}
 * />
 * ```
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useEntityCRUD } from '@/hooks/crud/useEntityCRUD';
import { useNavigateToEntity } from '@/hooks/useNavigateToEntity';
import { EntityList } from './EntityList';
import { EntityForm } from './EntityForm';
import { DeleteModal } from './DeleteModal';
import type { BaseEntity, EntityEditorConfig } from '@/lib/crud/types';

export interface EntityEditorProps<T extends BaseEntity> {
  config: EntityEditorConfig<T>;
  initialValue?: Partial<T>;
}

/**
 * Empty state component
 */
const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText: string;
  onCreateClick: () => void;
}> = ({ icon: Icon, title, description, actionText, onCreateClick }) => (
  <Card>
    <CardContent className="pt-6 text-center py-12">
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      <Button variant="primary" onClick={onCreateClick} className="flex items-center gap-2 mx-auto">
        <Plus className="w-4 h-4" />
        {actionText}
      </Button>
    </CardContent>
  </Card>
);

/**
 * Generic Entity Editor Component
 */
export function EntityEditor<T extends BaseEntity>({
  config,
  initialValue,
}: EntityEditorProps<T>): React.ReactElement {
  const {
    metadata,
    emptyState,
    useStore,
    getId,
    getName,
    validation,
    FormFields,
    CardContent,
    allowCreate = true,
    allowEdit = true,
    allowDelete = true,
    allowDuplicate = true,
    footerActions,
  } = config;

  // Use generic CRUD hook
  const crud = useEntityCRUD<T>({
    getId,
    useStore,
    entityName: metadata.entityName,
  });

  // Get duplicate function from store
  const { duplicateEntity } = useStore();

  // Handle duplicate action
  const handleDuplicate = (entity: T) => {
    if (duplicateEntity) {
      duplicateEntity(getId(entity));
    }
  };

  // Handle automatic modal opening from validation error navigation
  useNavigateToEntity<T>({
    entities: crud.entities,
    getId,
    openEditModal: crud.openEditModal,
    isFormOpen: crud.isFormOpen,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {metadata.entityNamePlural}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{metadata.description}</p>
        </div>
        {crud.entities.length > 0 && allowCreate && (
          <Button
            variant="primary"
            onClick={crud.openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create {metadata.entityName}
          </Button>
        )}
      </div>

      {/* Content - Empty State or Entity List */}
      {crud.entities.length === 0 ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          actionText={emptyState.actionText}
          onCreateClick={crud.openCreateModal}
        />
      ) : (
        <EntityList
          entities={crud.entities}
          CardContent={CardContent}
          getId={getId}
          getName={getName}
          onEdit={allowEdit ? crud.openEditModal : undefined}
          onDuplicate={allowDuplicate && duplicateEntity ? handleDuplicate : undefined}
          onDelete={allowDelete ? crud.openDeleteModal : undefined}
        />
      )}

      {/* Create/Edit Modal */}
      <EntityForm
        open={crud.isFormOpen}
        entity={crud.editingEntity}
        entityName={metadata.entityName}
        FormFields={FormFields}
        validation={validation}
        existingIds={crud.existingIds}
        onSubmit={crud.handleSubmit}
        onCancel={crud.closeFormModal}
        initialValue={initialValue}
        footerActions={footerActions}
        getId={getId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={crud.isDeleteModalOpen}
        entity={crud.deletingEntity}
        entityName={metadata.entityName}
        getName={getName}
        dependencies={crud.dependencies}
        onConfirm={crud.handleDelete}
        onCancel={crud.closeDeleteModal}
      />
    </div>
  );
}
