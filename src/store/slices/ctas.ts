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
    // Validate action-specific requirements
    const validation = validateCTAAction(cta);
    if (!validation.isValid) {
      get().ui.addToast({
        type: 'error',
        message: validation.error || 'Invalid CTA configuration',
      });
      return;
    }

    set((state) => {
      state.ctas.ctas[ctaId] = cta;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `CTA "${cta.label}" created successfully`,
    });
  },

  updateCTA: (ctaId: string, updates: Partial<CTADefinition>) => {
    set((state) => {
      const cta = state.ctas.ctas[ctaId];
      if (cta) {
        const updatedCTA = { ...cta, ...updates };

        // Validate if action changed
        if (updates.action) {
          const validation = validateCTAAction(updatedCTA);
          if (!validation.isValid) {
            get().ui.addToast({
              type: 'error',
              message: validation.error || 'Invalid CTA configuration',
            });
            return;
          }
        }

        state.ctas.ctas[ctaId] = updatedCTA;
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'CTA updated successfully',
    });
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

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate CTA action-specific requirements
 */
function validateCTAAction(cta: CTADefinition): ValidationResult {
  switch (cta.action) {
    case 'start_form':
      if (!cta.formId) {
        return {
          isValid: false,
          error: 'Form ID is required for start_form action',
        };
      }
      break;

    case 'external_link':
      if (!cta.url) {
        return {
          isValid: false,
          error: 'URL is required for external_link action',
        };
      }
      // Basic URL validation
      try {
        new URL(cta.url);
      } catch {
        return {
          isValid: false,
          error: 'Invalid URL format',
        };
      }
      break;

    case 'send_query':
      if (!cta.query) {
        return {
          isValid: false,
          error: 'Query is required for send_query action',
        };
      }
      break;

    case 'show_info':
      if (!cta.prompt) {
        return {
          isValid: false,
          error: 'Prompt is required for show_info action',
        };
      }
      break;
  }

  return { isValid: true };
}
