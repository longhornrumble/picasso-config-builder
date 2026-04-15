import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
} from '@/components/ui';
import { configApiClient } from '@/lib/api/client';

interface DeleteTenantModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName?: string;
  onDeleted: () => void;
}

export const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  open,
  onClose,
  tenantId,
  tenantName,
  onDeleted,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === tenantId;

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await configApiClient.deleteConfig(tenantId, true);
      handleClose();
      onDeleted();
    } catch (err) {
      setIsDeleting(false);
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
    }
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Demo Tenant
          </ModalTitle>
          <ModalDescription>
            This action is permanent and cannot be undone.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              This will permanently delete:
            </p>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              <li>Tenant configuration</li>
              <li>All configuration backups</li>
              <li>Widget hash mapping</li>
            </ul>
            {tenantName && (
              <p className="mt-3 text-sm font-semibold text-red-900 dark:text-red-100">
                Tenant: {tenantName} ({tenantId})
              </p>
            )}
            {!tenantName && (
              <p className="mt-3 text-sm font-semibold text-red-900 dark:text-red-100">
                Tenant: {tenantId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type <span className="font-mono font-bold">{tenantId}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tenantId}
              disabled={isDeleting}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Tenant'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
