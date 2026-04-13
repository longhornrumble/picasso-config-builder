/**
 * Config Slice
 * Manages configuration lifecycle: load, save, deploy, and merge operations
 */

import type { TenantConfig } from '@/types/config';
import type { SliceCreator, ConfigSlice } from '../types';
import * as configAPI from '@/lib/api/config-operations';
import { configApiClient } from '@/lib/api/client';

export const createConfigSlice: SliceCreator<ConfigSlice> = (set, get) => ({
  // State
  tenantId: null,
  baseConfig: null,
  isDirty: false,
  lastSaved: null,

  // Draft state
  isDraft: false,
  hasDraft: false,
  draftLastSaved: null,

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

      // After loading live config, check whether a draft exists (don't load it yet)
      try {
        const draftCheck = await configApiClient.loadDraft(tenantId);
        set((state) => {
          state.config.hasDraft = draftCheck.hasDraft;
          state.config.isDraft = false;
          state.config.draftLastSaved = null;
        });
      } catch {
        // Non-fatal: draft check failure should not block loading the live config
      }

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
        // Newly editable sections
        branding: mergedConfig.branding,
        features: mergedConfig.features,
        quick_help: mergedConfig.quick_help,
        action_chips: mergedConfig.action_chips,
        widget_behavior: mergedConfig.widget_behavior,
        aws: mergedConfig.aws,
        // Preserve topic_definitions from baseConfig for V4.1 Lambda compat (read-only passthrough)
        ...(mergedConfig.topic_definitions?.length && { topic_definitions: mergedConfig.topic_definitions }),
        feature_flags: mergedConfig.feature_flags || {},
        ...((mergedConfig as any).form_settings && { form_settings: (mergedConfig as any).form_settings }),
        ...((mergedConfig as any).monitor && { monitor: (mergedConfig as any).monitor }),
        // Metadata fields
        chat_title: mergedConfig.chat_title,
        welcome_message: mergedConfig.welcome_message,
        subscription_tier: mergedConfig.subscription_tier,
        tone_prompt: mergedConfig.tone_prompt,
        // Optional identity fields
        ...(mergedConfig.organization_name && { organization_name: mergedConfig.organization_name }),
        ...(mergedConfig.chat_subtitle && { chat_subtitle: mergedConfig.chat_subtitle }),
        // Notification configuration
        ...(mergedConfig.notification_settings && { notification_settings: mergedConfig.notification_settings }),
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

  clearTenant: () => {
    set((state) => {
      state.config.tenantId = null;
      state.config.baseConfig = null;
      state.config.isDirty = false;
      state.config.lastSaved = null;
      state.config.isDraft = false;
      state.config.hasDraft = false;
      state.config.draftLastSaved = null;
      state.programs.programs = {};
      state.forms.forms = {};
      state.ctas.ctas = {};
      state.branches.branches = {};
      state.contentShowcase.content_showcase = [];
      state.validation.clearAll();
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

  saveDraft: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    state.ui.setLoading('saveDraft', true);

    try {
      const mergedConfig = state.config.getMergedConfig();

      if (!mergedConfig) {
        throw new Error('Failed to merge configuration');
      }

      await configApiClient.saveDraft(state.config.tenantId, mergedConfig);

      set((state) => {
        state.config.isDraft = true;
        state.config.hasDraft = true;
        state.config.draftLastSaved = Date.now();
        state.config.isDirty = false;
      });

      state.ui.addToast({
        type: 'success',
        message: 'Draft saved successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      state.ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      state.ui.setLoading('saveDraft', false);
    }
  },

  loadDraft: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    state.ui.setLoading('loadDraft', true);

    try {
      const response = await configApiClient.loadDraft(state.config.tenantId);

      if (!response.hasDraft || !response.config) {
        state.ui.addToast({
          type: 'info',
          message: 'No draft found for this tenant',
        });
        return;
      }

      const draftConfig = response.config;

      // Populate all domain slices from the draft config (same pattern as loadConfig)
      set((state) => {
        state.programs.programs = draftConfig.programs || {};

        // Normalize forms: ensure form_id matches the dictionary key
        const forms = draftConfig.conversational_forms || {};
        state.forms.forms = Object.fromEntries(
          Object.entries(forms).map(([key, form]: [string, any]) => [
            key,
            { ...form, form_id: key },
          ])
        );

        state.ctas.ctas = draftConfig.cta_definitions || {};
        state.branches.branches = draftConfig.conversation_branches || {};
        state.contentShowcase.content_showcase = draftConfig.content_showcase || [];

        // Clear active selections
        state.programs.activeProgramId = null;
        state.forms.activeFormId = null;
        state.ctas.activeCtaId = null;
        state.branches.activeBranchId = null;

        // Mark as draft, clean (no unsaved changes on top of the draft)
        state.config.isDraft = true;
        state.config.hasDraft = true;
        state.config.isDirty = false;

        // Clear validation state
        state.validation.clearAll();
      });

      state.ui.addToast({
        type: 'success',
        message: 'Draft loaded successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load draft';
      state.ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      state.ui.setLoading('loadDraft', false);
    }
  },

  discardDraft: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    state.ui.setLoading('discardDraft', true);

    try {
      await configApiClient.deleteDraft(state.config.tenantId);

      set((state) => {
        state.config.isDraft = false;
        state.config.hasDraft = false;
        state.config.draftLastSaved = null;
      });

      // Reload the live config to restore state
      await get().config.loadConfig(state.config.tenantId!);

      state.ui.addToast({
        type: 'info',
        message: 'Draft discarded. Live configuration restored.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to discard draft';
      state.ui.addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      state.ui.setLoading('discardDraft', false);
    }
  },

  promoteDraft: async () => {
    const state = get();

    if (!state.config.tenantId) {
      state.ui.addToast({
        type: 'error',
        message: 'No tenant loaded',
      });
      return;
    }

    // Run the existing deployConfig flow (validates and writes to live S3)
    await get().config.deployConfig();

    // Clean up the draft file now that it is live
    try {
      await configApiClient.deleteDraft(state.config.tenantId!);
    } catch {
      // Non-fatal: draft cleanup failure should not surface as an error to the user
    }

    set((state) => {
      state.config.isDraft = false;
      state.config.hasDraft = false;
      state.config.draftLastSaved = null;
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
      active: state.config.baseConfig.active ?? false,
      subscription_tier: state.config.baseConfig.subscription_tier,
      chat_title: state.config.baseConfig.chat_title,
      tone_prompt: state.config.baseConfig.tone_prompt,
      welcome_message: state.config.baseConfig.welcome_message,
      version: state.config.baseConfig.version,
      generated_at: Date.now(),
      // Optional core identity fields
      ...(state.config.baseConfig.organization_name && { organization_name: state.config.baseConfig.organization_name }),
      ...(state.config.baseConfig.chat_subtitle && { chat_subtitle: state.config.baseConfig.chat_subtitle }),

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
      // CTA settings — always include for fallback_branch and max_ctas_per_response
      cta_settings: state.config.baseConfig.cta_settings || {},
      ...(state.config.baseConfig.bedrock_instructions && { bedrock_instructions: state.config.baseConfig.bedrock_instructions }),

      // Preserve topic_definitions from baseConfig for V4.1 Lambda compat (read-only passthrough)
      ...(state.config.baseConfig.topic_definitions?.length && { topic_definitions: state.config.baseConfig.topic_definitions }),
      // Feature flags — always include so V4 flags can be set from scratch
      feature_flags: state.config.baseConfig.feature_flags || {},
      ...((state.config.baseConfig as any).form_settings && { form_settings: (state.config.baseConfig as any).form_settings }),
      ...(state.config.baseConfig.notification_settings && { notification_settings: state.config.baseConfig.notification_settings }),
    };

    // Post-process forms: map post_submission.fulfillment → root-level fulfillment
    // for Lambda compatibility (Lambda reads form.fulfillment.type, not form.post_submission.fulfillment.method)
    for (const [formId, form] of Object.entries(mergedConfig.conversational_forms)) {
      const ps = (form as any).post_submission;
      if (ps?.fulfillment && !((form as any).fulfillment)) {
        (mergedConfig.conversational_forms[formId] as any).fulfillment = {
          type: ps.fulfillment.method || 'email',
          email_to: ps.fulfillment.recipients,
          cc: ps.fulfillment.cc,
          webhook_url: ps.fulfillment.webhook_url,
          template: ps.fulfillment.subject_template ? 'custom' : 'thank_you',
        };
      }
    }

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
