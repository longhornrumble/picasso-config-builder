/**
 * useEntityCRUD Hook
 *
 * Generic hook that handles all CRUD state management and operations.
 * This hook eliminates code duplication across all entity editors.
 *
 * @example
 * ```tsx
 * const programCRUD = useEntityCRUD({
 *   getId: (p) => p.program_id,
 *   useStore: useProgramsStore,
 * });
 *
 * // Use in component:
 * <Button onClick={programCRUD.openCreateModal}>Create</Button>
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '../useToast';
import type {
  BaseEntity,
  EntityCRUDReturn,
  IdExtractor,
  EntityStore,
} from '@/lib/crud/types';

export interface UseEntityCRUDConfig<T extends BaseEntity> {
  /**
   * Function to extract ID from entity
   */
  getId: IdExtractor<T>;

  /**
   * Store hook that provides CRUD operations
   */
  useStore: () => EntityStore<T>;

  /**
   * Optional: Entity name for toast messages
   * @default "Entity"
   */
  entityName?: string;

  /**
   * Optional: Custom success messages
   */
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
}

/**
 * Generic CRUD hook
 * Handles all state management for entity CRUD operations
 */
export function useEntityCRUD<T extends BaseEntity>(
  config: UseEntityCRUDConfig<T>
): EntityCRUDReturn<T> {
  const { getId, useStore, entityName = 'Entity', messages = {} } = config;

  // Toast notifications
  const { addToast } = useToast();

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<T | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<T | null>(null);

  // Get store actions
  const {
    entities: entityMap,
    createEntity,
    updateEntity,
    deleteEntity: deleteFromStore,
    getDependencies,
  } = useStore();

  // Convert entity map to array
  const entities = useMemo(() => Object.values(entityMap), [entityMap]);

  // Get list of existing IDs
  const existingIds = useMemo(() => Object.keys(entityMap), [entityMap]);

  // Check if we're in edit mode
  const isEditMode = editingEntity !== null;

  // Get dependencies for the entity being deleted
  const dependencies = useMemo(
    () => (deletingEntity ? getDependencies(getId(deletingEntity)) : null),
    [deletingEntity, getDependencies, getId]
  );

  // Open create modal
  const openCreateModal = useCallback(() => {
    setEditingEntity(null);
    setIsFormOpen(true);
  }, []);

  // Open edit modal
  const openEditModal = useCallback((entity: T) => {
    setEditingEntity(entity);
    setIsFormOpen(true);
  }, [getId]);

  // Open delete modal
  const openDeleteModal = useCallback((entity: T) => {
    setDeletingEntity(entity);
    setIsDeleteModalOpen(true);
  }, []);

  // Close form modal
  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingEntity(null);
  }, []);

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDeletingEntity(null);
  }, []);

  // Handle form submission (create or update)
  const handleSubmit = useCallback(
    (entity: T) => {
      try {
        if (isEditMode && editingEntity) {
          // Update existing entity
          const entityId = getId(editingEntity);
          updateEntity(entityId, entity);
          addToast({
            message: messages.updated || `${entityName} updated successfully`,
            type: 'success',
          });
        } else {
          // Create new entity
          createEntity(entity);
          addToast({
            message: messages.created || `${entityName} created successfully`,
            type: 'success',
          });
        }

        // Close modal
        closeFormModal();
      } catch (error) {
        console.error('[useEntityCRUD] handleSubmit error', error);
        addToast({
          message: error instanceof Error ? error.message : 'Operation failed',
          type: 'error',
        });
      }
    },
    [
      isEditMode,
      editingEntity,
      updateEntity,
      createEntity,
      getId,
      addToast,
      entityName,
      messages,
      closeFormModal,
    ]
  );

  // Handle entity deletion
  const handleDelete = useCallback(() => {
    if (!deletingEntity) return;

    try {
      deleteFromStore(getId(deletingEntity));
      addToast({
        message: messages.deleted || `${entityName} deleted successfully`,
        type: 'success',
      });
      closeDeleteModal();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Deletion failed',
        type: 'error',
      });
    }
  }, [deletingEntity, deleteFromStore, getId, addToast, entityName, messages, closeDeleteModal]);

  return {
    // Modal state
    isFormOpen,
    isDeleteModalOpen,
    editingEntity,
    deletingEntity,

    // Entity data
    entities,
    entityMap,
    existingIds,
    isEditMode,

    // Dependencies
    dependencies,

    // Actions
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeFormModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
  };
}
