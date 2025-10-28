/**
 * Branches Slice
 * Manages conversation branches with keyword detection and CTA routing
 */

import type { ConversationBranch } from '@/types/config';
import type { SliceCreator, BranchesSlice, Dependencies } from '../types';

export const createBranchesSlice: SliceCreator<BranchesSlice> = (set, get) => ({
  // State
  branches: {},
  activeBranchId: null,

  // Actions
  createBranch: (branch: ConversationBranch, branchId: string) => {
    set((state) => {
      state.branches.branches[branchId] = branch;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `Branch "${branchId}" created successfully`,
    });

    // Re-run validation after creating branch
    get().validation.validateAll();
  },

  updateBranch: (branchId: string, updates: Partial<ConversationBranch>) => {
    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        state.branches.branches[branchId] = { ...branch, ...updates };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Branch updated successfully',
    });

    // Re-run validation after updating branch
    get().validation.validateAll();
  },

  deleteBranch: (branchId: string) => {
    set((state) => {
      delete state.branches.branches[branchId];

      // Clear active branch if deleted
      if (state.branches.activeBranchId === branchId) {
        state.branches.activeBranchId = null;
      }

      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `Branch "${branchId}" deleted successfully`,
    });

    // Re-run validation after deleting branch
    get().validation.validateAll();
  },

  duplicateBranch: (branchId: string) => {
    const branch = get().branches.branches[branchId];
    if (!branch) {
      get().ui.addToast({
        type: 'error',
        message: 'Branch not found',
      });
      return;
    }

    // Generate new ID
    const newId = `${branchId}_copy_${Date.now()}`;
    const newBranch: ConversationBranch = {
      ...branch,
      // Deep clone the arrays
      detection_keywords: [...branch.detection_keywords],
      available_ctas: {
        primary: branch.available_ctas.primary,
        secondary: [...branch.available_ctas.secondary],
      },
    };

    get().branches.createBranch(newBranch, newId);
  },

  setActiveBranch: (branchId: string | null) => {
    set((state) => {
      state.branches.activeBranchId = branchId;
    });
  },

  // Keyword management
  addKeyword: (branchId: string, keyword: string) => {
    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        // Avoid duplicates
        if (!branch.detection_keywords.includes(keyword)) {
          state.branches.branches[branchId] = {
            ...branch,
            detection_keywords: [...branch.detection_keywords, keyword],
          };
          state.config.markDirty();
        }
      }
    });
  },

  removeKeyword: (branchId: string, keyword: string) => {
    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        state.branches.branches[branchId] = {
          ...branch,
          detection_keywords: branch.detection_keywords.filter((k) => k !== keyword),
        };
        state.config.markDirty();
      }
    });
  },

  // CTA management
  setPrimaryCTA: (branchId: string, ctaId: string) => {
    // Verify CTA exists
    const cta = get().ctas.getCTA(ctaId);
    if (!cta) {
      get().ui.addToast({
        type: 'error',
        message: 'CTA not found',
      });
      return;
    }

    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        state.branches.branches[branchId] = {
          ...branch,
          available_ctas: {
            ...branch.available_ctas,
            primary: ctaId,
          },
        };
        state.config.markDirty();
      }
    });
  },

  addSecondaryCTA: (branchId: string, ctaId: string) => {
    // Verify CTA exists
    const cta = get().ctas.getCTA(ctaId);
    if (!cta) {
      get().ui.addToast({
        type: 'error',
        message: 'CTA not found',
      });
      return;
    }

    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        // Avoid duplicates
        if (!branch.available_ctas.secondary.includes(ctaId)) {
          state.branches.branches[branchId] = {
            ...branch,
            available_ctas: {
              ...branch.available_ctas,
              secondary: [...branch.available_ctas.secondary, ctaId],
            },
          };
          state.config.markDirty();
        }
      }
    });
  },

  removeSecondaryCTA: (branchId: string, ctaId: string) => {
    set((state) => {
      const branch = state.branches.branches[branchId];
      if (branch) {
        state.branches.branches[branchId] = {
          ...branch,
          available_ctas: {
            ...branch.available_ctas,
            secondary: branch.available_ctas.secondary.filter((id) => id !== ctaId),
          },
        };
        state.config.markDirty();
      }
    });
  },

  // Selectors
  getBranch: (branchId: string) => {
    return get().branches.branches[branchId];
  },

  getAllBranches: () => {
    return Object.entries(get().branches.branches).map(([id, branch]) => ({ id, branch }));
  },

  getBranchesByCTA: (ctaId: string) => {
    return Object.entries(get().branches.branches)
      .filter(
        ([, branch]) =>
          branch.available_ctas.primary === ctaId ||
          branch.available_ctas.secondary.includes(ctaId)
      )
      .map(([id, branch]) => ({ id, branch }));
  },

  getBranchDependencies: (branchId: string) => {
    const state = get();
    const dependencies: Dependencies = {
      programs: [],
      forms: [],
      ctas: [],
      branches: [],
    };

    const branch = state.branches.branches[branchId];
    if (!branch) {
      return dependencies;
    }

    // Add primary CTA
    if (branch.available_ctas.primary) {
      dependencies.ctas.push(branch.available_ctas.primary);
    }

    // Add secondary CTAs
    dependencies.ctas.push(...branch.available_ctas.secondary);

    return dependencies;
  },
});
