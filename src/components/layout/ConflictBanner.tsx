/**
 * ConflictBanner Component
 * Shown when a save is rejected with 409 because the config was
 * updated elsewhere. The user's in-progress edits remain in the
 * store — only baseConfig needs to be refreshed so the next save
 * sends a fresh If-Match ETag.
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import { useConfigStore } from '@/store';

export const ConflictBanner: React.FC = () => {
  const conflictState = useConfigStore((state) => state.config.conflictState);
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const loadConfig = useConfigStore((state) => state.config.loadConfig);
  const clearConflict = useConfigStore((state) => state.config.clearConflict);

  const [reloading, setReloading] = useState(false);

  if (!conflictState || !tenantId) return null;

  const handleReload = async () => {
    setReloading(true);
    try {
      await loadConfig(tenantId);
    } finally {
      setReloading(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold text-amber-900">Config was updated elsewhere</p>
        <p className="text-sm text-amber-800">
          Your save was blocked because another process modified this tenant's config
          since you loaded it. Reload to apply your changes on top of the latest version —
          your unsaved edits stay in the editor.
        </p>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <Button variant="primary" size="sm" onClick={handleReload} disabled={reloading}>
          {reloading ? 'Reloading…' : 'Reload latest'}
        </Button>
        <Button variant="secondary" size="sm" onClick={clearConflict} disabled={reloading}>
          Dismiss
        </Button>
      </div>
    </div>
  );
};
