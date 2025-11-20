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

        // Normalize forms: ensure form_id matches the dictionary key
        const forms = response.config.conversational_forms || {};
        state.forms.forms = Object.fromEntries(
          Object.entries(forms).map(([key, form]) => [
            key,
            { ...form, form_id: key } // Override form_id to match the key
          ])
        );

        state.ctas.ctas = response.config.cta_definitions || {};
        state.branches.branches = response.config.conversation_branches || {};
        state.contentShowcase.content_showcase = response.config.content_showcase || [];

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

      // Filter to only editable fields - Lambda only accepts these fields
      // See lambda/mergeStrategy.mjs EDITABLE_SECTIONS for the definitive list
      // Increment version by parsing and adding 0.1
      const currentVersion = parseFloat(mergedConfig.version) || 1.0;
      const newVersion = (currentVersion + 0.1).toFixed(1);

      const editableConfig = {
        version: newVersion,
        programs: mergedConfig.programs,
        conversational_forms: mergedConfig.conversational_forms,
        cta_definitions: mergedConfig.cta_definitions,
        conversation_branches: mergedConfig.conversation_branches,
        content_showcase: mergedConfig.content_showcase,
        cta_settings: mergedConfig.cta_settings,
        bedrock_instructions: mergedConfig.bedrock_instructions,
      };

      console.log('[DEPLOY] Filtered config keys:', Object.keys(editableConfig));
      console.log('[DEPLOY] Sending to API:', editableConfig);

      await configAPI.deployConfig(state.config.tenantId, editableConfig as TenantConfig);

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

        // Normalize forms: ensure form_id matches the dictionary key
        const forms = state.config.baseConfig.conversational_forms || {};
        state.forms.forms = Object.fromEntries(
          Object.entries(forms).map(([key, form]) => [
            key,
            { ...form, form_id: key } // Override form_id to match the key
          ])
        );

        state.ctas.ctas = state.config.baseConfig.cta_definitions || {};
        state.branches.branches = state.config.baseConfig.conversation_branches || {};
        state.contentShowcase.content_showcase = state.config.baseConfig.content_showcase || [];

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
    // IMPORTANT: We explicitly merge fields instead of spreading baseConfig
    // to prevent deprecated/stale data from persisting
    const mergedConfig: TenantConfig = {
      // Core metadata from baseConfig
      tenant_id: state.config.baseConfig.tenant_id,
      tenant_hash: state.config.baseConfig.tenant_hash,
      subscription_tier: state.config.baseConfig.subscription_tier,
      chat_title: state.config.baseConfig.chat_title,
      tone_prompt: state.config.baseConfig.tone_prompt,
      welcome_message: state.config.baseConfig.welcome_message,
      version: state.config.baseConfig.version,
      generated_at: Date.now(),

      // Domain slices from their respective stores
      programs: state.programs.programs,
      conversational_forms: state.forms.forms,
      cta_definitions: state.ctas.ctas,
      conversation_branches: state.branches.branches,
      content_showcase: state.contentShowcase.content_showcase,

      // Preserve current configuration sections from baseConfig
      branding: state.config.baseConfig.branding,
      features: state.config.baseConfig.features,
      aws: state.config.baseConfig.aws,

      // Optional fields - only include if they exist
      ...(state.config.baseConfig.callout_text && { callout_text: state.config.baseConfig.callout_text }),
      ...(state.config.baseConfig.model_id && { model_id: state.config.baseConfig.model_id }),
      ...(state.config.baseConfig.quick_help && { quick_help: state.config.baseConfig.quick_help }),
      ...(state.config.baseConfig.action_chips && { action_chips: state.config.baseConfig.action_chips }),
      ...(state.config.baseConfig.widget_behavior && { widget_behavior: state.config.baseConfig.widget_behavior }),
      ...(state.config.baseConfig.cta_settings && { cta_settings: state.config.baseConfig.cta_settings }),
      ...(state.config.baseConfig.bedrock_instructions && { bedrock_instructions: state.config.baseConfig.bedrock_instructions }),
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
