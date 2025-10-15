/**
 * DeleteConfirmation Component
 * Modal dialog for confirming branch deletion with dependency warnings
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
  Badge,
} from '@/components/ui';
import type { ConversationBranch } from '@/types/config';

export interface DeleteConfirmationProps {
  /**
   * The branch ID to delete
   */
  branchId: string | null;
  /**
   * The branch to delete
   */
  branch: ConversationBranch | null;
  /**
   * Number of CTAs that depend on this branch
   */
  dependentCTAsCount: number;
  /**
   * Names of dependent CTAs (optional, for display)
   */
  dependentCTANames?: string[];
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
 * DeleteConfirmation - Confirmation dialog for deleting branches
 *
 * @example
 * ```tsx
 * <DeleteConfirmation
 *   branchId="volunteer_branch"
 *   branch={branchToDelete}
 *   dependentCTAsCount={2}
 *   dependentCTANames={['CTA 1', 'CTA 2']}
 *   onConfirm={handleConfirmDelete}
 *   onCancel={handleCancelDelete}
 *   open={isDeleteModalOpen}
 * />
 * ```
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  branchId,
  branch,
  dependentCTAsCount,
  dependentCTANames = [],
  onConfirm,
  onCancel,
  open,
}) => {
  if (!branchId || !branch) {
    return null;
  }

  // Note: Branches don't block deletion based on CTAs because CTAs reference branches,
  // not the other way around. This is just informational.
  const hasDependencies = false;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Delete Branch
          </ModalTitle>
          <ModalDescription>
            Are you sure you want to delete this branch?
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Branch details */}
          <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {branchId}
            </h4>

            {/* Keywords */}
            {branch.detection_keywords.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Keywords:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {branch.detection_keywords.slice(0, 5).map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {branch.detection_keywords.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{branch.detection_keywords.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* CTAs */}
            {dependentCTAsCount > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Associated CTAs:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {dependentCTAsCount} {dependentCTAsCount === 1 ? 'CTA' : 'CTAs'}
                </p>
              </div>
            )}
          </div>

          {/* Informational note about CTAs */}
          {dependentCTAsCount > 0 && (
            <Alert variant="info">
              <AlertDescription>
                <p className="font-semibold mb-2">
                  This branch references {dependentCTAsCount}{' '}
                  {dependentCTAsCount === 1 ? 'CTA' : 'CTAs'}
                </p>
                {dependentCTANames.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Referenced CTAs:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {dependentCTANames.slice(0, 5).map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                      {dependentCTANames.length > 5 && (
                        <li className="text-gray-500">
                          ...and {dependentCTANames.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                <p className="text-sm mt-2">
                  These CTAs will no longer be associated with this branch after deletion.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation warning */}
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The branch and its keyword routing will be
              permanently removed from the configuration.
            </AlertDescription>
          </Alert>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {!hasDependencies && (
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete Branch
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
