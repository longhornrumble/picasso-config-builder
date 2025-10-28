/**
 * CTAs Slice
 * Manages call-to-action definitions with action-specific logic
 */

import type { CTADefinition } from '@/types/config';
import type { SliceCreator, CTAsSlice, Dependencies } from '../types';

export const createCTAsSlice: SliceCreator<CTAsSlice> = (set, get) => ({
  // State
  ctas: {},
  activeCtaId: null,

  // Actions
  createCTA: (cta: CTADefinition, ctaId: string) => {
    set((state) => {
      state.ctas.ctas[ctaId] = cta;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `CTA "${cta.label}" created successfully`,
    });

    // Re-run validation after creating CTA
    get().validation.validateAll();
  },

  updateCTA: (ctaId: string, updates: Partial<CTADefinition>) => {
    set((state) => {
      const cta = state.ctas.ctas[ctaId];
      if (cta) {
        state.ctas.ctas[ctaId] = { ...cta, ...updates };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'CTA updated successfully',
    });

    // Re-run validation after updating CTA
    get().validation.validateAll();
  },

  deleteCTA: (ctaId: string) => {
    const dependencies = get().ctas.getCTADependencies(ctaId);

    // Check if CTA is used by any branches
    if (dependencies.branches.length > 0) {
      get().ui.addToast({
        type: 'error',
        message: `Cannot delete CTA. It is used by ${dependencies.branches.length} branch(es).`,
      });
      return;
    }

    set((state) => {
      const ctaLabel = state.ctas.ctas[ctaId]?.label;
      delete state.ctas.ctas[ctaId];

      // Clear active CTA if deleted
      if (state.ctas.activeCtaId === ctaId) {
        state.ctas.activeCtaId = null;
      }

      state.config.markDirty();

      if (ctaLabel) {
        get().ui.addToast({
          type: 'success',
          message: `CTA "${ctaLabel}" deleted successfully`,
        });
      }
    });

    // Re-run validation after deleting CTA
    get().validation.validateAll();
  },

  duplicateCTA: (ctaId: string) => {
    const cta = get().ctas.ctas[ctaId];
    if (!cta) {
      get().ui.addToast({
        type: 'error',
        message: 'CTA not found',
      });
      return;
    }

    // Generate new ID
    const newId = `${ctaId}_copy_${Date.now()}`;
    const newCTA: CTADefinition = {
      ...cta,
      label: `${cta.label} (Copy)`,
    };

    get().ctas.createCTA(newCTA, newId);
  },

  setActiveCTA: (ctaId: string | null) => {
    set((state) => {
      state.ctas.activeCtaId = ctaId;
    });
  },

  // Selectors
  getCTA: (ctaId: string) => {
    return get().ctas.ctas[ctaId];
  },

  getAllCTAs: () => {
    return Object.entries(get().ctas.ctas).map(([id, cta]) => ({ id, cta }));
  },

  getCTAsByForm: (formId: string) => {
    return Object.entries(get().ctas.ctas)
      .filter(([, cta]) => cta.action === 'start_form' && cta.formId === formId)
      .map(([id, cta]) => ({ id, cta }));
  },

  getCTADependencies: (ctaId: string) => {
    const state = get();
    const dependencies: Dependencies = {
      programs: [],
      forms: [],
      ctas: [],
      branches: [],
    };

    const cta = state.ctas.ctas[ctaId];

    // Check if CTA references a form
    if (cta?.action === 'start_form' && cta.formId) {
      dependencies.forms.push(cta.formId);
    }

    // Find branches that reference this CTA
    Object.entries(state.branches.branches).forEach(([branchId, branch]) => {
      if (
        branch.available_ctas.primary === ctaId ||
        branch.available_ctas.secondary.includes(ctaId)
      ) {
        dependencies.branches.push(branchId);
      }
    });

    return dependencies;
  },
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

