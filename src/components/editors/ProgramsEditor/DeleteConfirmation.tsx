/**
 * DeleteConfirmation Component
 * Modal dialog for confirming program deletion with dependency warnings
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
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
import type { Program } from '@/types/config';

export interface DeleteConfirmationProps {
  /**
   * The program to delete
   */
  program: Program | null;
  /**
   * Number of forms that depend on this program
   */
  dependentFormsCount: number;
  /**
   * Names of dependent forms (optional, for display)
   */
  dependentFormNames?: string[];
  /**
   * Callback when delete is confirmed
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
 * DeleteConfirmation - Confirmation dialog for deleting programs
 *
 * @example
 * ```tsx
 * <DeleteConfirmation
 *   program={programToDelete}
 *   dependentFormsCount={3}
 *   dependentFormNames={['Form 1', 'Form 2', 'Form 3']}
 *   onConfirm={handleConfirmDelete}
 *   onCancel={handleCancelDelete}
 *   open={isDeleteModalOpen}
 * />
 * ```
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  program,
  dependentFormsCount,
  dependentFormNames = [],
  onConfirm,
  onCancel,
  open,
}) => {
  if (!program) {
    return null;
  }

  const hasDependencies = dependentFormsCount > 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Delete Program
          </ModalTitle>
          <ModalDescription>
            {hasDependencies
              ? 'This program cannot be deleted because it has dependencies.'
              : 'Are you sure you want to delete this program?'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Program details */}
          <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {program.program_name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                {program.program_id}
              </code>
            </p>
            {program.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {program.description}
              </p>
            )}
          </div>

          {/* Dependency warning */}
          {hasDependencies && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Cannot delete: This program is used by {dependentFormsCount}{' '}
                  {dependentFormsCount === 1 ? 'form' : 'forms'}
                </p>
                {dependentFormNames.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Dependent forms:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {dependentFormNames.slice(0, 5).map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                      {dependentFormNames.length > 5 && (
                        <li className="text-gray-500">
                          ...and {dependentFormNames.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                <p className="text-sm mt-2">
                  To delete this program, first remove or reassign all forms that reference it.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation warning */}
          {!hasDependencies && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The program will be permanently removed from the
                configuration.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {hasDependencies ? 'Close' : 'Cancel'}
          </Button>
          {!hasDependencies && (
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete Program
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
