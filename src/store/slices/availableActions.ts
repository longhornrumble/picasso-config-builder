/**
 * Available Actions Slice
 * Manages AI vocabulary entries (forms and links) for V3.5 Tag & Map
 */

import type { AvailableActionEntry } from '@/types/config';
import type { SliceCreator, AvailableActionsSlice, Dependencies } from '../types';

export const createAvailableActionsSlice: SliceCreator<AvailableActionsSlice> = (set, get) => ({
  // State
  actions: {},
  activeActionId: null,

  // Actions
  createAction: (action: AvailableActionEntry, actionId: string) => {
    set((state) => {
      state.availableActions.actions[actionId] = action;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `Vocabulary entry "${action.label}" created successfully`,
    });

    get().validation.validateAll();
  },

  updateAction: (actionId: string, updates: Partial<AvailableActionEntry>) => {
    set((state) => {
      const action = state.availableActions.actions[actionId];
      if (action) {
        state.availableActions.actions[actionId] = { ...action, ...updates };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Vocabulary entry updated successfully',
    });

    get().validation.validateAll();
  },

  deleteAction: (actionId: string) => {
    set((state) => {
      const actionLabel = state.availableActions.actions[actionId]?.label;
      delete state.availableActions.actions[actionId];

      if (state.availableActions.activeActionId === actionId) {
        state.availableActions.activeActionId = null;
      }

      state.config.markDirty();

      if (actionLabel) {
        get().ui.addToast({
          type: 'success',
          message: `Vocabulary entry "${actionLabel}" deleted successfully`,
        });
      }
    });

    get().validation.validateAll();
  },

  duplicateAction: (actionId: string) => {
    const action = get().availableActions.actions[actionId];
    if (!action) {
      get().ui.addToast({
        type: 'error',
        message: 'Vocabulary entry not found',
      });
      return;
    }

    const newId = `${actionId}_copy_${Date.now()}`;
    const newAction: AvailableActionEntry = {
      ...action,
      label: `${action.label} (Copy)`,
    };

    get().availableActions.createAction(newAction, newId);
  },

  setActiveAction: (actionId: string | null) => {
    set((state) => {
      state.availableActions.activeActionId = actionId;
    });
  },

  // Selectors
  getAction: (actionId: string) => {
    return get().availableActions.actions[actionId];
  },

  getAllActions: () => {
    return Object.entries(get().availableActions.actions).map(([id, action]) => ({ id, action }));
  },

  getActionsByType: (type: string) => {
    return Object.entries(get().availableActions.actions)
      .filter(([, action]) => action.type === type)
      .map(([id, action]) => ({ id, action }));
  },

  getActionDependencies: (actionId: string) => {
    const dependencies: Dependencies = {
      programs: [],
      forms: [],
      ctas: [],
      branches: [],
    };

    const action = get().availableActions.actions[actionId];

    // Check if form-type action references a branch
    if (action?.target_branch) {
      dependencies.branches.push(action.target_branch);
    }

    return dependencies;
  },
});
