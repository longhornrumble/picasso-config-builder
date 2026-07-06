/**
 * PromoteButton Component
 *
 * Fires the gated staging→prod promotion for the loaded tenant, then WATCHES the
 * run so the dialog shows a live outcome: confirm → Promoting… → ✓ Promoted /
 * ✗ Failed. The Config Builder itself only ever writes staging; the backend
 * dispatches the workflow (which does the prod copy via OIDC) and the button
 * polls that run's status.
 */

import React, { useState, useRef } from 'react';
import { Rocket, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
import { promoteConfig, getPromoteStatus } from '@/lib/api/config-operations';

export interface PromoteButtonProps {
  className?: string;
}

type Phase = 'idle' | 'promoting' | 'success' | 'failed';

const POLL_INTERVAL_MS = 4000;
const MAX_WAIT_MS = 4 * 60 * 1000;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const PromoteButton: React.FC<PromoteButtonProps> = ({ className = '' }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const cancelRef = useRef(false);

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const addToast = useConfigStore((state) => state.ui.addToast);

  const disabled = !tenantId;
  const tooltip = tenantId
    ? "Promote this tenant's staging config to production"
    : 'Select a tenant first';

  const openDialog = () => {
    if (!tenantId) return;
    cancelRef.current = false;
    setPhase('idle');
    setErrorMsg('');
    setDialogOpen(true);
  };

  // Closing stops watching; the promote keeps running server-side either way.
  const closeDialog = () => {
    cancelRef.current = true;
    setDialogOpen(false);
    setPhase('idle');
    setErrorMsg('');
  };

  const handlePromote = async () => {
    if (!tenantId) return;
    cancelRef.current = false;
    setPhase('promoting');
    setErrorMsg('');
    try {
      const { baseline } = await promoteConfig(tenantId);

      for (let waited = 0; waited < MAX_WAIT_MS; waited += POLL_INTERVAL_MS) {
        await delay(POLL_INTERVAL_MS);
        if (cancelRef.current) return;

        let st;
        try {
          st = await getPromoteStatus(tenantId, baseline);
        } catch {
          continue; // transient network/API hiccup — keep watching
        }

        if (st.found && st.status === 'completed') {
          if (st.conclusion === 'success') {
            setPhase('success');
            addToast({ type: 'success', message: `Promoted ${tenantId} to production.` });
          } else {
            setPhase('failed');
            setErrorMsg(
              `Promotion ${st.conclusion || 'did not succeed'}. Production still has the previous config — nothing partial was written (a backup is kept regardless).`
            );
            addToast({ type: 'error', message: `Promotion failed for ${tenantId}.` });
          }
          return;
        }
      }

      if (cancelRef.current) return;
      setPhase('failed');
      setErrorMsg('Still running after a few minutes — it may still finish. Check again shortly.');
    } catch (err) {
      if (cancelRef.current) return;
      setPhase('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Promotion failed to start.');
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Promotion failed' });
    }
  };

  const titleIcon =
    phase === 'success' ? (
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    ) : phase === 'failed' ? (
      <XCircle className="w-5 h-5 text-red-600" />
    ) : phase === 'promoting' ? (
      <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
    ) : (
      <Rocket className="w-5 h-5 text-green-600" />
    );

  const title =
    phase === 'success'
      ? 'Promoted to Production'
      : phase === 'failed'
        ? 'Promotion Failed'
        : phase === 'promoting'
          ? 'Promoting…'
          : 'Promote to Production';

  return (
    <>
      <Tooltip content={tooltip}>
        <div className={`relative ${className}`}>
          <Button variant="outline" size="sm" onClick={openDialog} disabled={disabled}>
            <Rocket className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Promote</span>
          </Button>
        </div>
      </Tooltip>

      <Modal
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <ModalContent className="sm:max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              {titleIcon}
              {title}
            </ModalTitle>
            <ModalDescription>
              {phase === 'idle' && (
                <>
                  This copies the current staging config for <strong>{tenantId}</strong> to the
                  production bucket. The gated workflow validates it, backs up the current
                  production config, and writes the new one. This affects live production chat.
                </>
              )}
              {phase === 'promoting' && (
                <>
                  Copying <strong>{tenantId}</strong> to production and verifying. This usually
                  takes a minute or two — you can leave this window open.
                </>
              )}
              {phase === 'success' && (
                <>
                  <strong>{tenantId}</strong> is now live in production (fully in effect within
                  ~5 minutes as caches refresh). The previous config was backed up.
                </>
              )}
              {phase === 'failed' && <>{errorMsg}</>}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            {phase === 'idle' && (
              <>
                <Button variant="ghost" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePromote}
                  className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Promote to Production
                </Button>
              </>
            )}
            {phase === 'promoting' && (
              <Button variant="ghost" onClick={closeDialog}>
                Close (keeps running)
              </Button>
            )}
            {(phase === 'success' || phase === 'failed') && (
              <Button variant="primary" onClick={closeDialog}>
                Done
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
