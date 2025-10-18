/**
 * DeleteModal - Generic Delete Confirmation Modal
 *
 * Shows dependency warnings before deletion.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Alert,
  AlertDescription,
} from '@/components/ui';
import type { BaseEntity, EntityDependencies, NameExtractor } from '@/lib/crud/types';

export interface DeleteModalProps<T extends BaseEntity> {
  open: boolean;
  entity: T | null;
  entityName: string;
  getName: NameExtractor<T>;
  dependencies: EntityDependencies | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal<T extends BaseEntity>({
  open,
  entity,
  entityName,
  getName,
  dependencies,
  onConfirm,
  onCancel,
}: DeleteModalProps<T>): React.ReactElement {
  if (!entity) return <></>;

  const entityDisplayName = getName(entity);
  const hasDependencies = dependencies && !dependencies.canDelete;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete {entityName}
          </ModalTitle>
          <ModalDescription>
            {hasDependencies
              ? `This ${entityName.toLowerCase()} cannot be deleted because it is being used by other entities.`
              : `Are you sure you want to delete "${entityDisplayName}"? This action cannot be undone.`}
          </ModalDescription>
        </ModalHeader>

        <div className="py-4">
          {hasDependencies && dependencies && (
            <Alert variant="error">
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">This {entityName.toLowerCase()} is referenced by:</p>
                  {dependencies.dependentEntities.map((dep) => (
                    <div key={dep.type}>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {dep.type} ({dep.ids.length}):
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {dep.names.slice(0, 5).map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))}
                        {dep.names.length > 5 && (
                          <li className="text-gray-500">...and {dep.names.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  ))}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Please remove these dependencies before deleting this {entityName.toLowerCase()}.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!hasDependencies && (
            <Alert variant="warning">
              <AlertDescription>
                <p className="font-medium">Warning:</p>
                <p className="text-sm mt-1">
                  Deleting "{entityDisplayName}" is permanent and cannot be undone.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {!hasDependencies && (
            <Button type="button" variant="danger" onClick={onConfirm}>
              Delete {entityName}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
