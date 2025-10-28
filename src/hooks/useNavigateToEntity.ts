/**
 * useNavigateToEntity Hook
 *
 * Handles automatic modal opening and field scrolling when navigating
 * to an entity from a validation error.
 *
 * Usage:
 * 1. User clicks validation error
 * 2. URL becomes: /ctas?editId=volunteer_cta&scrollTo=formId
 * 3. Editor uses this hook to detect params
 * 4. Hook opens modal for that entity
 * 5. Hook scrolls to the field after modal opens
 *
 * @example
 * ```tsx
 * const crud = useEntityCRUD({ ... });
 * useNavigateToEntity({
 *   entities: crud.entities,
 *   getId: (e) => e.id,
 *   openEditModal: crud.openEditModal,
 * });
 * ```
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scrollToField } from '@/components/validation/ValidationAlert';

export interface UseNavigateToEntityConfig<T> {
  /**
   * List of all entities
   */
  entities: T[];

  /**
   * Function to extract ID from entity
   */
  getId: (entity: T) => string;

  /**
   * Function to open the edit modal for an entity
   */
  openEditModal: (entity: T) => void;

  /**
   * Whether the form modal is currently open
   */
  isFormOpen: boolean;
}

/**
 * Hook to handle automatic entity modal opening from URL params
 */
export function useNavigateToEntity<T>(config: UseNavigateToEntityConfig<T>): void {
  const { entities, getId, openEditModal, isFormOpen } = config;
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Get the editId and scrollTo params
    const editId = searchParams.get('editId');
    const scrollTo = searchParams.get('scrollTo');

    if (!editId) {
      // No entity to navigate to, but check if modal just opened and we need to scroll
      if (scrollTo && isFormOpen) {
        console.log('[useNavigateToEntity] Modal is open, scrolling to field:', scrollTo);
        // Wait for modal animation to complete, then scroll
        setTimeout(() => {
          const found = scrollToField(scrollTo);
          if (found) {
            // Clear the scrollTo param after successful scroll
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('scrollTo');
            setSearchParams(newParams, { replace: true });
          }
        }, 500); // Wait 500ms for modal to fully open
      }
      return;
    }

    // Find the entity with this ID
    const entity = entities.find((e) => getId(e) === editId);

    if (!entity) {
      console.warn('[useNavigateToEntity] Entity not found:', editId);
      // Clear the params since the entity doesn't exist
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('editId');
      newParams.delete('scrollTo');
      setSearchParams(newParams, { replace: true });
      return;
    }

    // Open the modal for this entity
    console.log('[useNavigateToEntity] Opening modal for:', editId);
    openEditModal(entity);

    // Clear the editId param so we don't keep reopening the modal
    // Keep scrollTo for the next effect run when modal is open
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('editId');
    setSearchParams(newParams, { replace: true });
  }, [entities, getId, openEditModal, isFormOpen, searchParams, setSearchParams]);
}
