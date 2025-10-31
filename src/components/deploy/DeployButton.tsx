/**
 * DeployButton Component
 * Main deployment button with validation and dialog integration
 */

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Badge, Tooltip } from '@/components/ui';
import { DeployDialog } from './DeployDialog';
import { useConfigStore } from '@/store';
import { prepareConfigForDeployment } from '@/lib/api/mergeStrategy';
import { deployConfig } from '@/lib/api/config-operations';

export interface DeployButtonProps {
  className?: string;
}

/**
 * Deploy Button
 *
 * Features:
 * - Validation before deploy
 * - Shows error count badge
 * - Opens confirmation dialog
 * - Handles deployment to S3
 * - Success/error feedback via toast
 *
 * @example
 * ```tsx
 * <DeployButton />
 * ```
 */
export const DeployButton: React.FC<DeployButtonProps> = ({ className = '' }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Get state from store
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const isDirty = useConfigStore((state) => state.config.isDirty);
  const isValid = useConfigStore((state) => state.validation.isValid);
  const errors = useConfigStore((state) => state.validation.errors);
  const warnings = useConfigStore((state) => state.validation.warnings);

  const programs = useConfigStore((state) => state.programs.programs);
  const forms = useConfigStore((state) => state.forms.forms);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const branches = useConfigStore((state) => state.branches.branches);
  const contentShowcase = useConfigStore((state) => state.contentShowcase.content_showcase);

  const markClean = useConfigStore((state) => state.config.markClean);
  const addToast = useConfigStore((state) => state.ui.addToast);

  // Calculate counts
  const programsCount = Object.keys(programs).length;
  const formsCount = Object.keys(forms).length;
  const ctasCount = Object.keys(ctas).length;
  const branchesCount = Object.keys(branches).length;
  const showcaseCount = contentShowcase.length;

  // Calculate error count
  const errorCount = Object.values(errors).reduce(
    (total, entityErrors) => total + entityErrors.length,
    0
  );

  // Flatten warnings for dialog
  const warningList = Object.values(warnings).flat();

  // Check if deploy is disabled
  const isDeployDisabled = !tenantId || !isValid || errorCount > 0;

  // Get tooltip message
  const getTooltipMessage = () => {
    if (!tenantId) return 'Select a tenant first';
    if (errorCount > 0) return `Fix ${errorCount} validation error${errorCount === 1 ? '' : 's'} first`;
    if (!isValid) return 'Configuration has validation errors';
    return 'Deploy configuration to S3';
  };

  const handleOpenDialog = () => {
    if (isDeployDisabled) {
      addToast({
        type: 'error',
        message: getTooltipMessage(),
      });
      return;
    }
    setDialogOpen(true);
  };

  const handleDeploy = async () => {
    if (!tenantId || !baseConfig) {
      throw new Error('No tenant selected');
    }

    setIsDeploying(true);

    try {
      // Prepare merged configuration
      const { config: mergedConfig } = prepareConfigForDeployment(baseConfig, {
        programs,
        forms,
        ctas,
        branches,
        contentShowcase,
      });

      // Deploy to S3 (or local dev server) with merge=false for full replacement
      await deployConfig(tenantId, mergedConfig as any);

      // Mark as not dirty
      markClean();

      // Show success toast
      addToast({
        type: 'success',
        message: 'Configuration deployed successfully',
      });
    } catch (error) {
      console.error('Deployment error:', error);
      throw error; // Re-throw for dialog to handle
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <Tooltip content={getTooltipMessage()}>
        <div className={`relative ${className}`}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenDialog}
            disabled={isDeployDisabled || isDeploying}
            className={`
              ${!isDeployDisabled && !isDeploying
                ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600'
                : ''
              }
            `}
          >
            <Upload className="w-4 h-4 mr-2" />
            Deploy
            {isDirty && !isDeployDisabled && (
              <span className="ml-2 w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />
            )}
          </Button>

          {/* Error Badge */}
          {errorCount > 0 && (
            <Badge
              variant="error"
              className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-xs"
            >
              {errorCount}
            </Badge>
          )}
        </div>
      </Tooltip>

      {/* Deploy Dialog */}
      <DeployDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleDeploy}
        tenantId={tenantId || ''}
        programsCount={programsCount}
        formsCount={formsCount}
        ctasCount={ctasCount}
        branchesCount={branchesCount}
        showcaseCount={showcaseCount}
        warnings={warningList}
        hasChanges={isDirty}
        isDeploying={isDeploying}
      />
    </>
  );
};
