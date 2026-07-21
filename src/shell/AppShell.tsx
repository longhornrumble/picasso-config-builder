/**
 * AppShell — the redesigned Config Builder shell.
 *
 * Layout: [LeftRail 216px] [TopBar + scrollable view] [InspectorDock 330px].
 * View (Overview/Pipeline/Settings), selection, and overlays are driven by
 * useShellStore. Config data/CRUD/validation/API remain in useConfigStore.
 *
 * Keyboard: ⌘K tenant switcher, ⌘/ global search, Esc closes the topmost layer
 * (Radix dialogs self-close on Esc; the global handler covers selection-clear).
 */

import React from 'react';
import { LeftRail } from './LeftRail';
import { TopBar } from './TopBar';
import { InspectorDock } from './InspectorDock';
import { OverviewView } from './views/OverviewView';
import { PipelineView } from './views/PipelineView';
import { SettingsView } from './views/SettingsView';
import { TenantSwitcher } from './overlays/TenantSwitcher';
import { PendingPopover } from './overlays/PendingPopover';
import { GlobalSearch } from './overlays/GlobalSearch';
import { ValidationPopover } from './overlays/ValidationPopover';
import { WidgetPreviewModal } from './overlays/WidgetPreviewModal';
import { EditorDrawerHost } from './editors/EditorDrawerHost';
import { useShellStore } from './shellStore';

export function AppShell() {
  const view = useShellStore((s) => s.view);
  const toggleOverlay = useShellStore((s) => s.toggleOverlay);
  const overlays = useShellStore((s) => s.overlays);
  const editor = useShellStore((s) => s.editor);
  const selection = useShellStore((s) => s.selection);
  const clearSelection = useShellStore((s) => s.clearSelection);

  const anyLayerOpen = editor != null || Object.values(overlays).some(Boolean);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleOverlay('tenantSwitcher');
      } else if (mod && e.key === '/') {
        e.preventDefault();
        toggleOverlay('globalSearch');
      } else if (e.key === 'Escape') {
        // Radix dialogs (palettes/drawers/modals) handle their own Esc. Only
        // the selection-clear case needs a global handler.
        if (!anyLayerOpen && selection) clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleOverlay, anyLayerOpen, selection, clearSelection]);

  return (
    <div className="cb-shell">
      <LeftRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="cb-scroll flex-1 p-6">
          {view === 'overview' && <OverviewView />}
          {view === 'pipeline' && <PipelineView />}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>

      <InspectorDock />

      {/* Editor drawer (renders when an entity editor is open). */}
      <EditorDrawerHost />

      {/* Overlays (command palettes / popovers / modals). */}
      <TenantSwitcher />
      <GlobalSearch />
      <PendingPopover />
      <ValidationPopover />
      <WidgetPreviewModal />
    </div>
  );
}
