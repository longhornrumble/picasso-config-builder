/**
 * Main Zustand Store
 * Combines all domain slices with middleware for the Config Builder
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { ConfigBuilderState } from './types';
import { createProgramsSlice } from './slices/programs';
import { createFormsSlice } from './slices/forms';
import { createCTAsSlice } from './slices/ctas';
import { createBranchesSlice } from './slices/branches';
import { createContentShowcaseSlice } from './slices/contentShowcase';
import { createCardInventorySlice } from './slices/cardInventory';
import { createUISlice } from './slices/ui';
import { createValidationSlice } from './slices/validation';
import { createConfigSlice } from './slices/config';

/**
 * Main Config Builder Store
 *
 * Architecture:
 * - Single store with domain slices (programs, forms, ctas, branches, cards)
 * - UI state management (tabs, modals, toasts, loading)
 * - Validation state tracking (errors, warnings)
 * - Config lifecycle management (load, save, deploy, merge)
 *
 * Middleware:
 * - Immer: Simplifies immutable updates with mutable syntax
 * - DevTools: Redux DevTools integration for debugging
 * - Persist: Saves UI preferences to localStorage
 */
export const useConfigStore = create<ConfigBuilderState>()(
  devtools(
    immer((set, get, api) => ({
      // Domain slices
      programs: createProgramsSlice(set, get, api),
      forms: createFormsSlice(set, get, api),
      ctas: createCTAsSlice(set, get, api),
      branches: createBranchesSlice(set, get, api),
      contentShowcase: createContentShowcaseSlice(set, get, api),
      cardInventory: createCardInventorySlice(set, get, api),

      // Application state
      ui: createUISlice(set, get, api),
      validation: createValidationSlice(set, get, api),
      config: createConfigSlice(set, get, api),
    })),
    {
      name: 'ConfigBuilder',
      // Enable Redux DevTools features in development
      enabled: true,
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to access programs slice
 */
export const usePrograms = () => useConfigStore((state) => state.programs);

/**
 * Hook to access forms slice
 */
export const useForms = () => useConfigStore((state) => state.forms);

/**
 * Hook to access CTAs slice
 */
export const useCTAs = () => useConfigStore((state) => state.ctas);

/**
 * Hook to access branches slice
 */
export const useBranches = () => useConfigStore((state) => state.branches);

/**
 * Hook to access content showcase slice
 */
export const useContentShowcase = () => useConfigStore((state) => state.contentShowcase);

/**
 * Hook to access card inventory slice
 * @deprecated Use useContentShowcase instead
 */
export const useCardInventory = () => useConfigStore((state) => state.cardInventory);

/**
 * Hook to access UI slice
 */
export const useUI = () => useConfigStore((state) => state.ui);

/**
 * Hook to access validation slice
 */
export const useValidation = () => useConfigStore((state) => state.validation);

/**
 * Hook to access config slice
 */
export const useConfig = () => useConfigStore((state) => state.config);

/**
 * Hook to get the current tenant ID
 */
export const useTenantId = () => useConfigStore((state) => state.config.tenantId);

/**
 * Hook to get dirty state
 */
export const useIsDirty = () => useConfigStore((state) => state.config.isDirty);

/**
 * Hook to get validation state
 */
export const useIsValid = () => useConfigStore((state) => state.validation.isValid);

/**
 * Hook to get loading state for a specific key
 */
export const useLoading = (key: string) =>
  useConfigStore((state) => state.ui.loading[key] || false);

/**
 * Hook to get all toasts
 */
export const useToasts = () => useConfigStore((state) => state.ui.toasts);

/**
 * Hook to get active tab
 */
export const useActiveTab = () => useConfigStore((state) => state.ui.activeTab);

/**
 * Hook to get modal stack
 */
export const useModals = () => useConfigStore((state) => state.ui.modalStack);

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Hook to get a specific program by ID
 */
export const useProgram = (programId: string | null) =>
  useConfigStore((state) => (programId ? state.programs.getProgram(programId) : undefined));

/**
 * Hook to get a specific form by ID
 */
export const useForm = (formId: string | null) =>
  useConfigStore((state) => (formId ? state.forms.getForm(formId) : undefined));

/**
 * Hook to get a specific CTA by ID
 */
export const useCTA = (ctaId: string | null) =>
  useConfigStore((state) => (ctaId ? state.ctas.getCTA(ctaId) : undefined));

/**
 * Hook to get a specific branch by ID
 */
export const useBranch = (branchId: string | null) =>
  useConfigStore((state) => (branchId ? state.branches.getBranch(branchId) : undefined));

/**
 * Hook to get all programs as array
 */
export const useAllPrograms = () => useConfigStore((state) => state.programs.getAllPrograms());

/**
 * Hook to get all forms as array
 */
export const useAllForms = () => useConfigStore((state) => state.forms.getAllForms());

/**
 * Hook to get all CTAs as array with IDs
 */
export const useAllCTAs = () => useConfigStore((state) => state.ctas.getAllCTAs());

/**
 * Hook to get all branches as array with IDs
 */
export const useAllBranches = () => useConfigStore((state) => state.branches.getAllBranches());

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { ConfigBuilderState } from './types';
export type {
  ProgramsSlice,
  FormsSlice,
  CTAsSlice,
  BranchesSlice,
  ContentShowcaseSlice,
  CardInventorySlice,
  UISlice,
  ValidationSlice,
  ConfigSlice,
  ValidationError,
  Dependencies,
  Toast,
  Modal,
} from './types';

// Export selectors
export * from './selectors/dependencies';
export * from './selectors/validation';
