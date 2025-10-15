/**
 * DeleteConfirmation Component
 * Confirms CTA deletion and displays dependencies
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
  Badge,
} from '@/components/ui';
import type { CTADefinition } from '@/types/config';
import type { Dependencies } from '@/store/types';

export interface DeleteConfirmationProps {
  /**
   * The CTA to delete
   */
  cta: CTADefinition | null;
  /**
   * The CTA ID to delete
   */
  ctaId: string | null;
  /**
   * Dependencies that reference this CTA
   */
  dependencies: Dependencies | null;
  /**
   * Callback when deletion is confirmed
   */
  onConfirm: () => void;
  /**
   * Callback when deletion is cancelled
   */
  onCancel: () => void;
  /**
   * Whether the modal is open
   */
  open: boolean;
}

/**
 * DeleteConfirmation - Confirmation dialog for CTA deletion
 *
 * @example
 * ```tsx
 * <DeleteConfirmation
 *   cta={ctaToDelete}
 *   ctaId={ctaIdToDelete}
 *   dependencies={dependencies}
 *   onConfirm={handleConfirmDelete}
 *   onCancel={handleCancelDelete}
 *   open={isDeleteModalOpen}
 * />
 * ```
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  cta,
  ctaId,
  dependencies,
  onConfirm,
  onCancel,
  open,
}) => {
  if (!cta || !ctaId) {
    return null;
  }

  const dependentBranches = dependencies?.branches || [];
  const referencedForm = dependencies?.forms?.[0]; // CTA can only reference one form
  const canDelete = dependentBranches.length === 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete CTA
          </ModalTitle>
          <ModalDescription>
            {canDelete
              ? 'Are you sure you want to delete this CTA? This action cannot be undone.'
              : 'This CTA cannot be deleted because it is being used by other components.'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* CTA details */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Label:
                </span>
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  {cta.label}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID:
                </span>
                <code className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {ctaId}
                </code>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action:
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {cta.action}
                </Badge>
              </div>
            </div>
          </div>

          {/* Referenced form (if any) */}
          {referencedForm && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                References Form
              </h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Badge variant="info" className="text-xs">
                  {referencedForm}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                This CTA triggers the form above when clicked.
              </p>
            </div>
          )}

          {/* Dependent branches (blockers) */}
          {dependentBranches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Used by Branches
              </h4>
              <Alert variant="error">
                <AlertDescription>
                  <p className="mb-2">
                    This CTA is referenced by the following branches and cannot be deleted:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {dependentBranches.slice(0, 5).map((branchId) => (
                      <li key={branchId} className="text-sm">
                        <code className="text-xs bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          {branchId}
                        </code>
                      </li>
                    ))}
                    {dependentBranches.length > 5 && (
                      <li className="text-sm italic">
                        ...and {dependentBranches.length - 5} more
                      </li>
                    )}
                  </ul>
                  <p className="mt-3 text-sm font-medium">
                    Remove this CTA from all branches before deleting it.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Safe to delete message */}
          {canDelete && (
            <Alert variant="warning">
              <AlertDescription>
                Deleting this CTA will permanently remove it from your configuration.
                {referencedForm && (
                  <span className="block mt-2">
                    Note: The referenced form will not be deleted and can still be used by other CTAs.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {canDelete && (
            <Button type="button" variant="danger" onClick={onConfirm}>
              Delete CTA
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
