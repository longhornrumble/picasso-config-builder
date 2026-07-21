/**
 * Shell UI store (redesign)
 *
 * Holds view/selection/editor/overlay state for the redesigned Config Builder
 * shell. Kept SEPARATE from the config data store (`useConfigStore`) so the
 * redesign is additive — config data, CRUD, validation, and API wiring are
 * unchanged; this store only drives the new navigation + overlay chrome.
 *
 * Layer order (topmost closes first on Esc): editor → palettes → modals →
 * popovers → selection.  See README "Interactions & Behavior".
 */

import { create } from 'zustand';

export type EntityKind = 'cta' | 'form' | 'branch' | 'program' | 'chip' | 'showcase';
export type ShellView = 'overview' | 'pipeline' | 'settings';

export interface Selection {
  kind: EntityKind;
  id: string;
}

export interface EditorState {
  kind: EntityKind;
  /** null id = create a new entity of this kind */
  id: string | null;
}

/** Command palettes / modals / popovers, keyed by name. */
export type OverlayName =
  | 'tenantSwitcher'
  | 'globalSearch'
  | 'pendingPopover'
  | 'validationPopover'
  | 'previewModal';

/** A just-deleted entity, retained briefly so it can be undone. */
export interface UndoDelete {
  kind: EntityKind;
  id: string;
  label: string;
  /** Raw store-shape record, re-inserted on undo. */
  data: unknown;
}

interface ShellState {
  view: ShellView;
  selection: Selection | null;
  editor: EditorState | null;
  overlays: Record<OverlayName, boolean>;
  /** Settings scroll-spy: id of the active section. */
  activeSettingsSection: string | null;
  /** Most recent staged delete, offered for undo (~5s). */
  undoDelete: UndoDelete | null;

  setView: (view: ShellView) => void;
  select: (sel: Selection | null) => void;
  clearSelection: () => void;
  openEditor: (kind: EntityKind, id: string | null) => void;
  closeEditor: () => void;
  openOverlay: (name: OverlayName) => void;
  closeOverlay: (name: OverlayName) => void;
  toggleOverlay: (name: OverlayName) => void;
  closeAllOverlays: () => void;
  setActiveSettingsSection: (id: string | null) => void;
  setUndoDelete: (u: UndoDelete | null) => void;
  /** Close the single topmost layer; returns true if something was closed. */
  closeTopLayer: () => boolean;
}

const NO_OVERLAYS: Record<OverlayName, boolean> = {
  tenantSwitcher: false,
  globalSearch: false,
  pendingPopover: false,
  validationPopover: false,
  previewModal: false,
};

export const useShellStore = create<ShellState>((set, get) => ({
  view: 'overview',
  selection: null,
  editor: null,
  overlays: { ...NO_OVERLAYS },
  activeSettingsSection: null,
  undoDelete: null,

  setView: (view) => set({ view }),
  select: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),
  openEditor: (kind, id) => set({ editor: { kind, id } }),
  closeEditor: () => set({ editor: null }),
  // Overlays are mutually exclusive (one palette/popover/modal at a time).
  openOverlay: (name) => set({ overlays: { ...NO_OVERLAYS, [name]: true } }),
  closeOverlay: (name) => set((s) => ({ overlays: { ...s.overlays, [name]: false } })),
  toggleOverlay: (name) =>
    set((s) => (s.overlays[name] ? { overlays: { ...NO_OVERLAYS } } : { overlays: { ...NO_OVERLAYS, [name]: true } })),
  closeAllOverlays: () => set({ overlays: { ...NO_OVERLAYS } }),
  setActiveSettingsSection: (id) => set({ activeSettingsSection: id }),
  setUndoDelete: (u) => set({ undoDelete: u }),

  closeTopLayer: () => {
    const s = get();
    if (s.editor) {
      // NOTE: the editor's own unsaved-changes guard intercepts Esc before this
      // runs; reaching here means the editor is safe to close.
      set({ editor: null });
      return true;
    }
    const openOverlay = (Object.keys(s.overlays) as OverlayName[]).find((k) => s.overlays[k]);
    if (openOverlay) {
      set((st) => ({ overlays: { ...st.overlays, [openOverlay]: false } }));
      return true;
    }
    if (s.selection) {
      set({ selection: null });
      return true;
    }
    return false;
  },
}));
