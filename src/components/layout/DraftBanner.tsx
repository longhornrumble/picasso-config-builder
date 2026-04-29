/**
 * DraftBanner Component
 * Shown below the header when hasDraft === true and isDraft === false.
 * Lets the user resume their draft or discard it (with a confirmation prompt).
 */

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui';
import { useConfigStore } from '@/store';

/**
 * DraftBanner
 *
 * Renders only when a draft exists for the loaded tenant but the user is
 * currently viewing the live config (hasDraft && !isDraft).
 *
 * Accessibility:
 * - role="alert" with aria-live="polite" so screen readers announce it
 * - Discard button requires an inline confirmation to prevent accidental loss
 * - Focus moves to the "Resume Draft" button on mount via autoFocus
 *
 * @example
 * ```tsx
 * <DraftBanner />
 * ```
 */
export const DraftBanner: React.FC = () => {
  const hasDraft = useConfigStore((state) => state.config.hasDraft);
  const isDraft = useConfigStore((state) => state.config.isDraft);
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const loadDraft = useConfigStore((state) => state.config.loadDraft);
  const discardDraft = useConfigStore((state) => state.config.discardDraft);
  const loading = useConfigStore((state) => state.ui.loading);

  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Only render when a draft exists but we're viewing the live config
  if (!tenantId || !hasDraft || isDraft) {
    return null;
  }

  const isLoadingDraft = loading?.loadDraft || false;
  const isDiscarding = loading?.discardDraft || false;

  const handleResume = async () => {
    try {
      await loadDraft();
    } catch {
      // Error handling is done in the store
    }
  };

  const handleDiscardClick = () => {
    setConfirmingDiscard(true);
  };

  const handleDiscardConfirm = async () => {
    try {
      await discardDraft();
    } catch {
      // Error handling is done in the store
    } finally {
      setConfirmingDiscard(false);
    }
  };

  const handleDiscardCancel = () => {
    setConfirmingDiscard(false);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-2 bg-amber-950/60 border-b border-amber-700/50 text-amber-200 text-sm"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />

      <span className="flex-1">
        A draft exists for this tenant with unsaved changes.
      </span>

      {!confirmingDiscard ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResume}
            disabled={isLoadingDraft || isDiscarding}
            className="border-amber-500 text-amber-300 hover:bg-amber-900/40 text-xs"
            autoFocus
          >
            {isLoadingDraft ? 'Resuming...' : 'Resume Draft'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscardClick}
            disabled={isLoadingDraft || isDiscarding}
            className="text-amber-400 hover:text-amber-200 hover:bg-amber-900/30 text-xs"
          >
            Discard Draft
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-amber-300 text-xs font-medium">
            Permanently discard this draft?
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscardConfirm}
            disabled={isDiscarding}
            className="border-red-500 text-red-300 hover:bg-red-900/40 text-xs"
            autoFocus
          >
            {isDiscarding ? 'Discarding...' : 'Yes, Discard'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscardCancel}
            disabled={isDiscarding}
            className="text-amber-400 hover:text-amber-200 hover:bg-amber-900/30 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
