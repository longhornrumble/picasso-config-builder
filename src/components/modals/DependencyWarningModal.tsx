/**
 * DependencyWarningModal Component
 *
 * Modal that displays dependency warnings before entity deletion.
 * Shows what will be affected by the deletion and prompts for confirmation.
 */

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface DependencyWarningModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Callback when deletion is confirmed
   */
  onConfirm: () => void;
  /**
   * Type of entity being deleted
   */
  entityType: 'Program' | 'Form' | 'CTA' | 'Branch';
  /**
   * Name of the entity being deleted
   */
  entityName: string;
  /**
   * Formatted impact message from formatDeletionImpact()
   */
  impactMessage: string;
  /**
   * Whether there are dependencies that will be affected
   */
  hasImpact: boolean;
}

/**
 * DependencyWarningModal
 *
 * Displays dependency warnings before deletion with appropriate styling
 * based on whether there are actual dependencies.
 *
 * @example
 * ```tsx
 * <DependencyWarningModal
 *   isOpen={!!deleteWarning}
 *   onClose={() => setDeleteWarning(null)}
 *   onConfirm={confirmDelete}
 *   entityType="Program"
 *   entityName="Financial Aid 2024"
 *   impactMessage={formattedMessage}
 *   hasImpact={true}
 * />
 * ```
 */
export const DependencyWarningModal: React.FC<DependencyWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  impactMessage,
  hasImpact,
}) => {
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <div className="flex items-start gap-3">
            {hasImpact ? (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="flex-1">
              <ModalTitle className="text-xl">
                {hasImpact ? 'Warning: Dependencies Found' : 'Confirm Deletion'}
              </ModalTitle>
              <ModalDescription className="mt-1">
                {hasImpact
                  ? `Deleting this ${entityType.toLowerCase()} will affect other entities in your configuration.`
                  : `You are about to delete this ${entityType.toLowerCase()}.`}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <div className="py-4">
          {/* Entity being deleted */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {entityType} to delete:
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {entityName}
            </div>
          </div>

          {/* Impact message */}
          <div
            className={`p-4 rounded-lg border ${
              hasImpact
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
            }`}
          >
            <pre
              className={`text-sm font-mono whitespace-pre-wrap ${
                hasImpact
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-blue-900 dark:text-blue-100'
              }`}
            >
              {impactMessage}
            </pre>
          </div>

          {hasImpact && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Warning:</strong> Deleting this {entityType.toLowerCase()} may
                cause validation errors or broken references in the affected entities. Review
                the impact carefully before proceeding.
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {hasImpact ? 'Delete Anyway' : 'Delete'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
