/**
 * PromoteButton Component
 *
 * Fires the gated staging→prod promotion for the loaded tenant (Simple UX):
 * a confirm dialog → the backend dispatches the promote-tenant-config workflow,
 * which copies this tenant's staging config to the production bucket. The Config
 * Builder itself only ever writes staging; this button triggers the server-side,
 * gated promotion (staging never writes prod directly).
 */

import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import {
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui';
import { useConfigStore } from '@/store';
import { promoteConfig } from '@/lib/api/config-operations';

export interface PromoteButtonProps {
  className?: string;
}

export const PromoteButton: React.FC<PromoteButtonProps> = ({ className = '' }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const addToast = useConfigStore((state) => state.ui.addToast);

  const disabled = !tenantId;
  const tooltip = tenantId
    ? "Promote this tenant's staging config to production"
    : 'Select a tenant first';

  const handlePromote = async () => {
    if (!tenantId) return;
    setIsPromoting(true);
    try {
      const result = await promoteConfig(tenantId);
      addToast({
        type: 'success',
        message: result.message || `Promotion started for ${tenantId}.`,
      });
      setDialogOpen(false);
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Promotion failed',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <>
      <Tooltip content={tooltip}>
        <div className={`relative ${className}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => tenantId && setDialogOpen(true)}
            disabled={disabled}
          >
            <Rocket className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Promote</span>
          </Button>
        </div>
      </Tooltip>

      <Modal open={dialogOpen} onOpenChange={setDialogOpen}>
        <ModalContent className="sm:max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-green-600" />
              Promote to Production
            </ModalTitle>
            <ModalDescription>
              This copies the current staging config for <strong>{tenantId}</strong> to the
              production bucket. The gated workflow validates it, backs up the current
              production config, and writes the new one. This affects live production chat.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isPromoting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePromote}
              disabled={isPromoting}
              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
            >
              {isPromoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Promoting&hellip;
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Promote to Production
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
