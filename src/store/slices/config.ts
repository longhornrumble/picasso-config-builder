/**
 * Config Slice
 * Manages configuration lifecycle: load, save, deploy, and merge operations
 */

import type { TenantConfig, ConversationalForm, ConversationBranch } from '@/types/config';
import type { SliceCreator, ConfigSlice } from '../types';
import * as configAPI from '@/lib/api/config-operations';
import { configApiClient } from '@/lib/api/client';
import { ConfigAPIError } from '@/lib/api/errors';
import { shouldRepushWelcome, repushWelcomeSurfaces } from '@/lib/api/metaWelcome';
import { normalizeForms } from '@/lib/formNormalization';

/**
 * Schema discipline: stored configs may carry old-shape branches (no `secondary`
 * array — hand-authored or pre-builder records). Readers across the app assume
 * the canonical {primary, secondary[]} shape, so normalize once at the store
 * boundary instead of guarding every consumer.
 */
export function normalizeBranches(
  branches: Record<string, ConversationBranch> | undefined | null
): Record<string, ConversationBranch> {
  return Object.fromEntries(
    Object.entries(branches || {}).map(([key, branch]) => [
      key,
      {
        ...branch,
        available_ctas: {
          ...branch?.available_ctas,
          primary: branch?.available_ctas?.primary ?? '',
          secondary: branch?.available_ctas?.secondary ?? [],
        },
      },
    ])
  );
}

export const createConfigSlice: SliceCreator<ConfigSlice> = (set, get) => ({
  // State
  tenantId: null,
  baseConfig: null,
  etag: null,
  isDirty: false,
  lastSaved: null,

  conflictState: null,

  // History state (stubbed for MVP)
  canUndo: false,
  canRedo: false,

  // Actions
  loadConfig: async (tenantId: string) => {
    get().ui.setLoading('config', true);

    try {
      const response = await configAPI.loadConfig(tenantId);

      // Normalize forms authored outside the builder (seeders, M2M API) to
      // canonical shapes — boolean → Yes/No select, composites get subfields.
      const { forms: normalizedForms, repairs } = normalizeForms(
        response.config.conversational_forms
      );

      // Populate all domain slices from loaded config
      set((state) => {
        // Update config slice
        state.config.tenantId = tenantId;
        state.config.baseConfig = response.config;
        state.config.etag = response.etag ?? null;
        state.config.conflictState = null;
        // Repairs differ from what's stored in S3 — mark dirty so Save is
        // offered; nothing is persisted until the user saves or deploys.
        state.config.isDirty = repairs.length > 0;
        state.config.lastSaved = response.metadata.lastModified;

        // Populate domain slices
        state.programs.programs = response.config.programs || {};

        // Ensure form_id matches the dictionary key
        state.forms.forms = Object.fromEntries(
          Object.entries(normalizedForms).map(([key, form]) => [
            key,
            { ...form, form_id: key } // Override form_id to match the key
          ])
        );

        state.ctas.ctas = response.config.cta_definitions || {};
        state.branches.branches = normalizeBranches(response.config.conversation_branches);
        state.contentShowcase.content_showcase = response.config.content_showcase || [];

        // Clear any active selections
        state.programs.activeProgramId = null;
        state.forms.activeFormId = null;
        state.ctas.activeCtaId = null;
        state.branches.activeBranchId = null;

        // Clear validation state (re-validated below against the fresh load)
        state.validation.clearAll();
      });

      // Validate immediately so every surface (validation panel, deploy
      // button/dialog, dashboard) reflects the loaded config from the start —
      // previously validation only ran after the first edit, so the deploy
      // dialog could claim "valid" on a config the panel would flag.
      await get().validation.validateAll();

      get().ui.addToast({
        type: 'success',
        message: `Configuration for ${tenantId} loaded successfully`,
      });

      if (repairs.length > 0) {
        get().ui.addToast({
          type: 'info',
          message: `${repairs.length} field${repairs.length === 1 ? '' : 's'} auto-repaired to canonical shape (unsupported types, missing subfields). Review and Save to persist.`,
        });
      }
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

      const saveResult = await configAPI.saveConfig(state.config.tenantId, mergedConfig, {
        createBackup: true,
        ifMatch: state.config.etag ?? undefined,
      });

      // Update base config and mark clean
      set((state) => {
        state.config.baseConfig = mergedConfig;
        state.config.etag = saveResult.etag ?? null;
        state.config.conflictState = null;
        state.config.isDirty = false;
        state.config.lastSaved = Date.now();
      });

      state.ui.addToast({
        type: 'success',
        message: 'Configuration saved successfully',
      });
    } catch (error) {
      // ETag mismatch: stash the server's current state so the UI can
      // render a reload banner. Skip the generic error toast — the
      // banner is a richer, less alarming signal for this case.
      if (error instanceof ConfigAPIError && error.code === 'VERSION_CONFLICT') {
        const details = (error.details ?? {}) as {
          currentConfig?: TenantConfig;
          currentETag?: string;
        };
        set((state) => {
          state.config.conflictState = {
            currentConfig: details.currentConfig ?? null,
            currentETag: details.currentETag ?? null,
          };
        });
        throw error;
      }
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
      // Single merge path shared with save and preview. The server merges
      // this payload onto its own S3 base (omitted sections are preserved),
      // so only the sections getMergedConfig emits are overwritten. Version
      // bumping happens in configAPI.deployConfig, same as save.
      const mergedConfig = state.config.getMergedConfig();

      if (!mergedConfig) {
        throw new Error('Failed to merge configuration');
      }

      const deployResult = await configAPI.deployConfig(state.config.tenantId, mergedConfig, {
        ifMatch: state.config.etag ?? undefined,
      });

      // Update base config and mark clean
      set((state) => {
        state.config.baseConfig = mergedConfig;
        state.config.etag = deployResult?.etag ?? null;
        state.config.conflictState = null;
        state.config.isDirty = false;
        state.config.lastSaved = Date.now();
      });

      state.ui.addToast({
        type: 'success',
        message: 'Configuration deployed successfully',
      });

      // Auto-push Messenger welcome surfaces (ice breakers + persistent menu) to
      // the live Meta profile when they're configured and a page is connected —
      // so an operator never has to run the M5 re-push script by hand. Best-effort:
      // the deploy already succeeded, so a push failure only warns.
      if (shouldRepushWelcome(mergedConfig)) {
        // Same operator Clerk token the config API client sends; the /meta/
        // channels/* routes now require it (lambda#463).
        const authHeaders = await configApiClient.getAuthHeaders();
        const outcome = await repushWelcomeSurfaces(state.config.tenantId, authHeaders.Authorization);
        if (outcome.status === 'pushed') {
          state.ui.addToast({
            type: 'success',
            message: `Welcome surfaces pushed to Facebook / Instagram (${outcome.detail}).`,
          });
        } else if (outcome.status === 'failed') {
          state.ui.addToast({
            type: 'warning',
            message: `Deployed, but pushing welcome surfaces to Meta failed: ${outcome.detail}. Re-deploy to retry.`,
          });
        }
        // 'skipped' (flag off / nothing to push) and 'not-configured' are silent.
      }
    } catch (error) {
      // Mirror saveConfig: an ETag mismatch renders the reload banner
      // instead of the generic error toast.
      if (error instanceof ConfigAPIError && error.code === 'VERSION_CONFLICT') {
        const details = (error.details ?? {}) as {
          currentConfig?: TenantConfig;
          currentETag?: string;
        };
        set((state) => {
          state.config.conflictState = {
            currentConfig: details.currentConfig ?? null,
            currentETag: details.currentETag ?? null,
          };
        });
        throw error;
      }
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
        state.branches.branches = normalizeBranches(state.config.baseConfig.conversation_branches);
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
      state.config.etag = null;
      state.config.conflictState = null;
      state.config.isDirty = false;
      state.config.lastSaved = null;
      state.programs.programs = {};
      state.forms.forms = {};
      state.ctas.ctas = {};
      state.branches.branches = {};
      state.contentShowcase.content_showcase = [];
      state.validation.clearAll();
    });
  },

  reloadBaseForConflict: async () => {
    const state = get();
    const tenantId = state.config.tenantId;
    if (!tenantId) return;

    state.ui.setLoading('config', true);

    try {
      const response = await configAPI.loadConfig(tenantId);

      set((state) => {
        // Conflict recovery: adopt the server's latest as the new base + ETag
        // so the next save carries a matching If-Match and picks up whatever
        // changed elsewhere. The operator's in-progress domain-slice edits
        // (programs/forms/ctas/branches/showcase) are deliberately PRESERVED —
        // unlike loadConfig, which replaces them — so "your unsaved edits stay
        // in the editor" (the banner's promise) holds. isDirty stays true.
        // Note: edits made directly to base-config sections via the settings
        // panels (branding, features, etc.) are not slice-backed and are
        // superseded by the server's version here — the safe default when the
        // stored config changed under you.
        state.config.baseConfig = response.config;
        state.config.etag = response.etag ?? null;
        state.config.lastSaved = response.metadata.lastModified;
        state.config.conflictState = null;
      });

      state.ui.addToast({
        type: 'success',
        message: 'Refreshed to the latest version — your edits are intact. Save again to apply them.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh configuration';
      state.ui.addToast({ type: 'error', message: errorMessage });
      throw error;
    } finally {
      state.ui.setLoading('config', false);
    }
  },

  clearConflict: () => {
    set((state) => {
      state.config.conflictState = null;
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
      active: state.config.baseConfig.active ?? false,
      subscription_tier: state.config.baseConfig.subscription_tier,
      chat_title: state.config.baseConfig.chat_title,
      tone_prompt: state.config.baseConfig.tone_prompt,
      welcome_message: state.config.baseConfig.welcome_message,
      version: state.config.baseConfig.version,
      generated_at: Date.now(),
      // organization_name / chat_subtitle retired 2026-07-19 — no consumer anywhere
      // (widget wordmark, bot sender label, and email/SMS org templates all
      // resolve from chat_title). Stored values persist server-side untouched.

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
      // Presence-based (not truthy) emit so CLEARING the model override persists:
      // '' reaches the server, and every runtime reader treats '' as unset
      // (model_id || aws.model_id || default). Truthy-emit made clears silently
      // no-op — the never-clear defect from the 2026-07-19 settings wire-trace.
      ...(state.config.baseConfig.model_id !== undefined && { model_id: state.config.baseConfig.model_id }),
      ...(state.config.baseConfig.quick_help && { quick_help: state.config.baseConfig.quick_help }),
      ...(state.config.baseConfig.action_chips && { action_chips: state.config.baseConfig.action_chips }),
      ...(state.config.baseConfig.widget_behavior && { widget_behavior: state.config.baseConfig.widget_behavior }),
      // CTA settings — always include for fallback_branch and max_ctas_per_response
      cta_settings: state.config.baseConfig.cta_settings || {},
      ...(state.config.baseConfig.bedrock_instructions && { bedrock_instructions: state.config.baseConfig.bedrock_instructions }),

      // Feature flags — always include so V4 flags can be set from scratch
      feature_flags: state.config.baseConfig.feature_flags || {},
      // form_settings is a legacy passthrough not in TenantConfig's typed surface
      ...((state.config.baseConfig as TenantConfig & { form_settings?: unknown }).form_settings
        ? { form_settings: (state.config.baseConfig as TenantConfig & { form_settings?: unknown }).form_settings }
        : {}),
      ...(state.config.baseConfig.notification_settings && { notification_settings: state.config.baseConfig.notification_settings }),
      // Messenger channel behavior tuning (contract C2; server-editable per T2a).
      // Conditional emit — old configs without the section round-trip unchanged.
      ...(state.config.baseConfig.messenger_behavior && { messenger_behavior: state.config.baseConfig.messenger_behavior }),
    };

    // Post-process forms: map post_submission.fulfillment → root-level fulfillment
    // for Lambda compatibility (Lambda reads form.fulfillment.type, not form.post_submission.fulfillment.method)
    // Lift post_submission.fulfillment → root-level fulfillment for Lambda compat.
    // The deployed shape uses different field names (type/email_to/template) than
    // the local Fulfillment type — cast through unknown to express the intentional
    // shape divergence at the Lambda boundary.
    type DeployedFulfillment = {
      type: string;
      email_to?: string[];
      cc?: string[];
      webhook_url?: string;
      template: string;
    };
    for (const [formId, form] of Object.entries(mergedConfig.conversational_forms)) {
      const ps = form.post_submission;
      const formWithLambdaFulfillment = form as ConversationalForm & {
        fulfillment?: DeployedFulfillment;
      };
      if (ps?.fulfillment && !formWithLambdaFulfillment.fulfillment) {
        (mergedConfig.conversational_forms[formId] as ConversationalForm & {
          fulfillment?: DeployedFulfillment;
        }).fulfillment = {
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
