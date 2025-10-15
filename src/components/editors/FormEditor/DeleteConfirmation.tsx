/**
 * DeleteConfirmation Component
 * Modal for confirming form deletion with dependency checking
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
import type { ConversationalForm } from '@/types/config';

export interface DeleteConfirmationProps {
  /**
   * The form ID being deleted
   */
  formId: string | null;
  /**
   * The form being deleted
   */
  form: ConversationalForm | null;
  /**
   * Count of dependent CTAs
   */
  dependentCTAsCount: number;
  /**
   * Names of dependent CTAs
   */
  dependentCTANames: string[];
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
 * DeleteConfirmation - Modal for confirming form deletion
 *
 * @example
 * ```tsx
 * <DeleteConfirmation
 *   formId={deletingFormId}
 *   form={deletingForm}
 *   dependentCTAsCount={dependencies.count}
 *   dependentCTANames={dependencies.ctaNames}
 *   onConfirm={handleDeleteConfirm}
 *   onCancel={handleDeleteCancel}
 *   open={isDeleteModalOpen}
 * />
 * ```
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  formId,
  form,
  dependentCTAsCount,
  dependentCTANames,
  onConfirm,
  onCancel,
  open,
}) => {
  const canDelete = dependentCTAsCount === 0;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete Form
          </ModalTitle>
          <ModalDescription>
            {canDelete
              ? 'Are you sure you want to delete this form?'
              : 'This form cannot be deleted because it has dependencies.'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Form details */}
          {form && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {form.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Form ID: <code className="text-xs">{formId}</code>
              </p>
            </div>
          )}

          {/* Dependency warnings */}
          {!canDelete && (
            <>
              <Alert variant="error">
                <AlertDescription>
                  This form is referenced by <strong>{dependentCTAsCount} CTA(s)</strong>.
                  You must remove or update these CTAs before deleting this form.
                </AlertDescription>
              </Alert>

              {/* List of dependent CTAs */}
              {dependentCTANames.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                    Dependent CTAs:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {dependentCTANames.map((ctaName, idx) => (
                      <li key={idx} className="text-sm text-red-800 dark:text-red-200">
                        {ctaName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Deletion warning */}
          {canDelete && (
            <Alert variant="warning">
              <AlertDescription>
                This action cannot be undone. All form data and field configurations will be
                permanently deleted.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {canDelete && (
            <Button variant="danger" onClick={onConfirm}>
              Delete Form
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
