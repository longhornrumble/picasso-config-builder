/**
 * Header Component
 * Top navigation bar with tenant selector and deploy button
 */

import React, { useState } from 'react';
import { Save, Upload, AlertCircle } from 'lucide-react';
import { TenantSelector } from '../TenantSelector';
import { Button, Badge, Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../ui';
import { useConfigStore } from '@/store';

/**
 * Application Header
 *
 * Features:
 * - App title and branding
 * - Tenant selector dropdown
 * - Deploy button (visible when dirty)
 * - Save button (visible when dirty)
 * - Validation error indicator
 * - Confirmation modal before deploy
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export const Header: React.FC = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const isDirty = useConfigStore((state) => state.config.isDirty);
  const isValid = useConfigStore((state) => state.validation.isValid);
  const hasErrors = useConfigStore((state) => state.validation.hasErrors);
  const deployConfig = useConfigStore((state) => state.config.deployConfig);
  const saveConfig = useConfigStore((state) => state.config.saveConfig);
  const loading = useConfigStore((state) => state.ui.loading);

  const isDeploying = loading?.deploy || false;
  const isSaving = loading?.save || false;

  const handleDeploy = async () => {
    setShowDeployModal(false);
    try {
      await deployConfig();
    } catch (err) {
      // Error handling is done in the store
      console.error('Deploy failed:', err);
    }
  };

  const handleSave = async () => {
    try {
      await saveConfig();
    } catch (err) {
      // Error handling is done in the store
      console.error('Save failed:', err);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Picasso Config Builder
            </h1>
            {tenantId && (
              <Badge variant="outline" className="text-xs">
                {tenantId}
              </Badge>
            )}
          </div>

          {/* Right: Tenant Selector and Actions */}
          <div className="flex items-center gap-4">
            {/* Validation Error Indicator */}
            {hasErrors() && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Validation errors</span>
              </div>
            )}

            {/* Tenant Selector */}
            <TenantSelector />

            {/* Save Button */}
            {isDirty && tenantId && (
              <Button
                onClick={handleSave}
                variant="outline"
                disabled={!isValid || isSaving || isDeploying}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </Button>
            )}

            {/* Deploy Button */}
            {isDirty && tenantId && (
              <Button
                onClick={() => setShowDeployModal(true)}
                variant="primary"
                disabled={!isValid || isDeploying || isSaving}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isDeploying ? 'Deploying...' : 'Deploy'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Deploy Confirmation Modal */}
      <Modal open={showDeployModal} onOpenChange={setShowDeployModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Deploy Configuration</ModalTitle>
            <ModalDescription>
              Are you sure you want to deploy the configuration for {tenantId}?
            </ModalDescription>
          </ModalHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              This will save and publish your changes to the production environment.
              The changes will be immediately available to end users.
            </p>
          </div>

          <ModalFooter>
            <Button
              onClick={() => setShowDeployModal(false)}
              variant="outline"
              disabled={isDeploying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeploy}
              variant="primary"
              disabled={isDeploying}
            >
              {isDeploying ? 'Deploying...' : 'Deploy Now'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
