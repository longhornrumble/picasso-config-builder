/**
 * UI Slice
 * Manages application UI state, modals, toasts, and loading states
 */

import type { SliceCreator, UISlice, TabType, EditorType, Toast } from '../types';

let toastIdCounter = 0;

export const createUISlice: SliceCreator<UISlice> = (set, get) => ({
  // State
  activeTab: 'programs',
  sidebarOpen: true,
  activeEditor: null,
  activeEntityId: null,
  modalStack: [],
  loading: {},
  toasts: [],

  // Actions
  setActiveTab: (tab: TabType) => {
    set((state) => {
      state.ui.activeTab = tab;
    });
  },

  setSidebarOpen: (open: boolean) => {
    set((state) => {
      state.ui.sidebarOpen = open;
    });
  },

  toggleSidebar: () => {
    set((state) => {
      state.ui.sidebarOpen = !state.ui.sidebarOpen;
    });
  },

  openEditor: (editor: EditorType, entityId: string | null) => {
    set((state) => {
      state.ui.activeEditor = editor;
      state.ui.activeEntityId = entityId;
    });
  },

  closeEditor: () => {
    set((state) => {
      state.ui.activeEditor = null;
      state.ui.activeEntityId = null;
    });
  },

  pushModal: (type: string, props: Record<string, any>) => {
    set((state) => {
      state.ui.modalStack.push({ type, props });
    });
  },

  popModal: () => {
    set((state) => {
      state.ui.modalStack.pop();
    });
  },

  clearModals: () => {
    set((state) => {
      state.ui.modalStack = [];
    });
  },

  setLoading: (key: string, loading: boolean) => {
    set((state) => {
      if (loading) {
        state.ui.loading[key] = true;
      } else {
        delete state.ui.loading[key];
      }
    });
  },

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${toastIdCounter++}`;
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    set((state) => {
      state.ui.toasts.push(newToast);
    });

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().ui.dismissToast(id);
      }, newToast.duration);
    }
  },

  dismissToast: (id: string) => {
    set((state) => {
      state.ui.toasts = state.ui.toasts.filter((toast) => toast.id !== id);
    });
  },

  clearToasts: () => {
    set((state) => {
      state.ui.toasts = [];
    });
  },
});
