/**
 * Config Slice
 * Manages configuration lifecycle: load, save, deploy, and merge operations
 */

import type { TenantConfig } from '@/types/config';
import type { SliceCreator, ConfigSlice } from '../types';
import * as configAPI from '@/lib/api/config-operations';

export const createConfigSlice: SliceCreator<ConfigSlice> = (set, get) => ({
  // State
  tenantId: null,
  baseConfig: null,
  isDirty: false,
  lastSaved: null,

  // History state (stubbed for MVP)
  canUndo: false,
  canRedo: false,

  // Actions
  loadConfig: async (tenantId: string) => {
    get().ui.setLoading('config', true);

    try {
      const response = await configAPI.loadConfig(tenantId);

      // Populate all domain slices from loaded config
      set((state) => {
        // Update config slice
        state.config.tenantId = tenantId;
        state.config.baseConfig = response.config;
        state.config.isDirty = false;
        state.config.lastSaved = response.metadata.lastModified;

        // Populate domain slices
        state.programs.programs = response.config.programs || {};
        state.forms.forms = response.config.conversational_forms || {};
        state.ctas.ctas = response.config.cta_definitions || {};
        state.branches.branches = response.config.conversation_branches || {};
        state.cardInventory.cardInventory = response.config.card_inventory || null;

        // Clear any active selections
        state.programs.activeProgramId = null;
        state.forms.activeFormId = null;
        state.ctas.activeCtaId = null;
        state.branches.activeBranchId = null;

        // Clear validation state
        state.validation.clearAll();
      });

      get().ui.addToast({
        type: 'success',
        message: `Configuration for ${tenantId} loaded successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration';
      get().ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      get().ui.setLoading('config', false);
    }
  },

  saveConfig: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    // Validate before saving
    await state.validation.validateAll();

    if (state.validation.hasErrors()) {
      state.ui.addToast({
        type: 'error',
        message: 'Cannot save: validation errors exist',
      });
      return;
    }

    state.ui.setLoading('save', true);

    try {
      const mergedConfig = state.config.getMergedConfig();

      if (!mergedConfig) {
        throw new Error('Failed to merge configuration');
      }

      await configAPI.saveConfig(state.config.tenantId, mergedConfig, {
        createBackup: true,
      });

      // Update base config and mark clean
      set((state) => {
        state.config.baseConfig = mergedConfig;
        state.config.isDirty = false;
        state.config.lastSaved = Date.now();
      });

      state.ui.addToast({
        type: 'success',
        message: 'Configuration saved successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      state.ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      state.ui.setLoading('save', false);
    }
  },

  deployConfig: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    // Validate before deploying
    await state.validation.validateAll();

    if (state.validation.hasErrors()) {
      state.ui.addToast({
        type: 'error',
        message: 'Cannot deploy: validation errors exist',
      });
      return;
    }

    state.ui.setLoading('deploy', true);

    try {
      const mergedConfig = state.config.getMergedConfig();

      if (!mergedConfig) {
        throw new Error('Failed to merge configuration');
      }

      await configAPI.deployConfig(state.config.tenantId, mergedConfig);

      // Update base config and mark clean
      set((state) => {
        state.config.baseConfig = mergedConfig;
        state.config.isDirty = false;
        state.config.lastSaved = Date.now();
      });

      state.ui.addToast({
        type: 'success',
        message: 'Configuration deployed successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deploy configuration';
      state.ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      state.ui.setLoading('deploy', false);
    }
  },

  resetConfig: () => {
    const state = get();

    if (!state.config.baseConfig) {
      state.ui.addToast({
        type: 'info',
        message: 'No configuration to reset',
      });
      return;
    }

    // Restore all slices from base config
    set((state) => {
      if (state.config.baseConfig) {
        state.programs.programs = state.config.baseConfig.programs || {};
        state.forms.forms = state.config.baseConfig.conversational_forms || {};
        state.ctas.ctas = state.config.baseConfig.cta_definitions || {};
        state.branches.branches = state.config.baseConfig.conversation_branches || {};
        state.cardInventory.cardInventory = state.config.baseConfig.card_inventory || null;

        state.config.isDirty = false;

        // Clear validation
        state.validation.clearAll();
      }
    });

    state.ui.addToast({
      type: 'info',
      message: 'Configuration reset to last saved state',
    });
  },

  markDirty: () => {
    set((state) => {
      state.config.isDirty = true;
    });
  },

  markClean: () => {
    set((state) => {
      state.config.isDirty = false;
    });
  },

  getMergedConfig: () => {
    const state = get();

    if (!state.config.baseConfig) {
      return null;
    }

    // Merge all domain slices back into TenantConfig format
    const mergedConfig: TenantConfig = {
      ...state.config.baseConfig,
      programs: state.programs.programs,
      conversational_forms: state.forms.forms,
      cta_definitions: state.ctas.ctas,
      conversation_branches: state.branches.branches,
      card_inventory: state.cardInventory.cardInventory || undefined,
      // Update timestamp
      generated_at: Date.now(),
    };

    return mergedConfig;
  },

  // History methods (stubbed for MVP)
  undo: () => {
    // TODO: Implement undo/redo with history tracking
    get().ui.addToast({
      type: 'info',
      message: 'Undo not yet implemented',
    });
  },

  redo: () => {
    // TODO: Implement undo/redo with history tracking
    get().ui.addToast({
      type: 'info',
      message: 'Redo not yet implemented',
    });
  },
});
