/**
 * DeployDialog Component
 * Confirmation dialog for deploying configuration changes
 */

import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalTitle, Button } from '@/components/ui';
import { DeploymentSummary } from './DeploymentSummary';
import type { ValidationError } from '@/store/types';

export interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  tenantId: string;
  programsCount: number;
  formsCount: number;
  ctasCount: number;
  branchesCount: number;
  showcaseCount?: number;
  warnings?: ValidationError[];
  hasChanges?: boolean;
  isDeploying?: boolean;
}

/**
 * Deploy Dialog
 *
 * Features:
 * - Shows deployment summary
 * - Confirmation step
 * - Loading state during deployment
 * - Success/error feedback
 *
 * @example
 * ```tsx
 * <DeployDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleDeploy}
 *   tenantId="ABC123"
 *   programsCount={3}
 *   formsCount={5}
 *   ctasCount={10}
 *   branchesCount={7}
 * />
 * ```
 */
export const DeployDialog: React.FC<DeployDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  tenantId,
  programsCount,
  formsCount,
  ctasCount,
  branchesCount,
  showcaseCount = 0,
  warnings = [],
  hasChanges = false,
  isDeploying = false,
}) => {
  const [deploymentState, setDeploymentState] = useState<
    'confirm' | 'deploying' | 'success' | 'error'
  >('confirm');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleConfirm = async () => {
    setDeploymentState('deploying');
    setErrorMessage('');

    try {
      await onConfirm();
      setDeploymentState('success');

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setDeploymentState('confirm');
      }, 2000);
    } catch (error) {
      setDeploymentState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to deploy configuration'
      );
    }
  };

  const handleCancel = () => {
    if (deploymentState !== 'deploying') {
      onOpenChange(false);
      setDeploymentState('confirm');
      setErrorMessage('');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-xl md:max-w-2xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>Deploy Configuration</span>
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-6">
          {/* Confirmation State */}
          {deploymentState === 'confirm' && (
            <>
              <DeploymentSummary
                tenantId={tenantId}
                programsCount={programsCount}
                formsCount={formsCount}
                ctasCount={ctasCount}
                branchesCount={branchesCount}
                showcaseCount={showcaseCount}
                warnings={warnings}
                hasChanges={hasChanges}
              />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isDeploying}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={isDeploying}
                  className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600 w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Deploy to S3
                </Button>
              </div>
            </>
          )}

          {/* Deploying State */}
          {deploymentState === 'deploying' && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Deploying Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading to S3 and updating tenant config...
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {deploymentState === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Deployment Successful
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configuration has been deployed to S3
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {deploymentState === 'error' && (
            <div className="space-y-6">
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Deployment Failed
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600 w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};
