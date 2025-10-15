/**
 * Store Types
 * Type definitions for Zustand store slices and state
 */

import type {
  Program,
  ConversationalForm,
  FormField,
  CTADefinition,
  ConversationBranch,
  CardInventory,
  TenantConfig,
} from '@/types/config';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface Dependencies {
  programs: string[];
  forms: string[];
  ctas: string[];
  branches: string[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface Modal {
  type: string;
  props: Record<string, any>;
}

// ============================================================================
// PROGRAMS SLICE
// ============================================================================

export interface ProgramsSlice {
  // State
  programs: Record<string, Program>;
  activeProgramId: string | null;

  // Actions
  createProgram: (program: Program) => void;
  updateProgram: (programId: string, updates: Partial<Program>) => void;
  deleteProgram: (programId: string) => void;
  duplicateProgram: (programId: string) => void;
  setActiveProgram: (programId: string | null) => void;

  // Selectors
  getProgram: (programId: string) => Program | undefined;
  getAllPrograms: () => Program[];
  getProgramDependencies: (programId: string) => Dependencies;
}

// ============================================================================
// FORMS SLICE
// ============================================================================

export interface FormsSlice {
  // State
  forms: Record<string, ConversationalForm>;
  activeFormId: string | null;

  // Actions
  createForm: (form: ConversationalForm) => void;
  updateForm: (formId: string, updates: Partial<ConversationalForm>) => void;
  deleteForm: (formId: string) => void;
  duplicateForm: (formId: string) => void;
  setActiveForm: (formId: string | null) => void;

  // Field management
  addField: (formId: string, field: FormField) => void;
  updateField: (formId: string, fieldIndex: number, updates: Partial<FormField>) => void;
  deleteField: (formId: string, fieldIndex: number) => void;
  reorderFields: (formId: string, fromIndex: number, toIndex: number) => void;

  // Selectors
  getForm: (formId: string) => ConversationalForm | undefined;
  getAllForms: () => ConversationalForm[];
  getFormsByProgram: (programId: string) => ConversationalForm[];
  getFormDependencies: (formId: string) => Dependencies;
}

// ============================================================================
// CTAs SLICE
// ============================================================================

export interface CTAsSlice {
  // State
  ctas: Record<string, CTADefinition>;
  activeCtaId: string | null;

  // Actions
  createCTA: (cta: CTADefinition, ctaId: string) => void;
  updateCTA: (ctaId: string, updates: Partial<CTADefinition>) => void;
  deleteCTA: (ctaId: string) => void;
  duplicateCTA: (ctaId: string) => void;
  setActiveCTA: (ctaId: string | null) => void;

  // Selectors
  getCTA: (ctaId: string) => CTADefinition | undefined;
  getAllCTAs: () => Array<{ id: string; cta: CTADefinition }>;
  getCTAsByForm: (formId: string) => Array<{ id: string; cta: CTADefinition }>;
  getCTADependencies: (ctaId: string) => Dependencies;
}

// ============================================================================
// BRANCHES SLICE
// ============================================================================

export interface BranchesSlice {
  // State
  branches: Record<string, ConversationBranch>;
  activeBranchId: string | null;

  // Actions
  createBranch: (branch: ConversationBranch, branchId: string) => void;
  updateBranch: (branchId: string, updates: Partial<ConversationBranch>) => void;
  deleteBranch: (branchId: string) => void;
  duplicateBranch: (branchId: string) => void;
  setActiveBranch: (branchId: string | null) => void;

  // Keyword management
  addKeyword: (branchId: string, keyword: string) => void;
  removeKeyword: (branchId: string, keyword: string) => void;

  // CTA management
  setPrimaryCTA: (branchId: string, ctaId: string) => void;
  addSecondaryCTA: (branchId: string, ctaId: string) => void;
  removeSecondaryCTA: (branchId: string, ctaId: string) => void;

  // Selectors
  getBranch: (branchId: string) => ConversationBranch | undefined;
  getAllBranches: () => Array<{ id: string; branch: ConversationBranch }>;
  getBranchesByCTA: (ctaId: string) => Array<{ id: string; branch: ConversationBranch }>;
  getBranchDependencies: (branchId: string) => Dependencies;
}

// ============================================================================
// CARD INVENTORY SLICE
// ============================================================================

export interface CardInventorySlice {
  // State
  cardInventory: CardInventory | null;

  // Actions
  updateCardInventory: (updates: Partial<CardInventory>) => void;
  resetCardInventory: () => void;

  // Selectors
  getCardInventory: () => CardInventory | null;
}

// ============================================================================
// UI SLICE
// ============================================================================

export type TabType = 'programs' | 'forms' | 'ctas' | 'branches' | 'cards' | 'settings';
export type EditorType = 'programs' | 'forms' | 'ctas' | 'branches' | null;

export interface UISlice {
  // Navigation
  activeTab: TabType;
  sidebarOpen: boolean;

  // Editor state
  activeEditor: EditorType;
  activeEntityId: string | null;

  // Modals/dialogs
  modalStack: Modal[];

  // Loading states
  loading: Record<string, boolean>;

  // Toasts/notifications
  toasts: Toast[];

  // Actions
  setActiveTab: (tab: TabType) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openEditor: (editor: EditorType, entityId: string | null) => void;
  closeEditor: () => void;
  pushModal: (type: string, props: Record<string, any>) => void;
  popModal: () => void;
  clearModals: () => void;
  setLoading: (key: string, loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

// ============================================================================
// VALIDATION SLICE
// ============================================================================

export interface ValidationSlice {
  // Errors by entity
  errors: Record<string, ValidationError[]>;
  warnings: Record<string, ValidationError[]>;

  // Global validation state
  isValid: boolean;
  lastValidated: number | null;

  // Actions
  setErrors: (entityId: string, errors: ValidationError[]) => void;
  setWarnings: (entityId: string, warnings: ValidationError[]) => void;
  clearErrors: (entityId: string) => void;
  clearWarnings: (entityId: string) => void;
  clearAll: () => void;
  validateAll: () => Promise<void>;

  // Selectors
  getErrorsForEntity: (entityId: string) => ValidationError[];
  getWarningsForEntity: (entityId: string) => ValidationError[];
  hasErrors: () => boolean;
  hasWarnings: () => boolean;
}

// ============================================================================
// CONFIG SLICE
// ============================================================================

export interface ConfigSlice {
  // Loaded config state
  tenantId: string | null;
  baseConfig: TenantConfig | null;
  isDirty: boolean;
  lastSaved: number | null;

  // Actions
  loadConfig: (tenantId: string) => Promise<void>;
  saveConfig: () => Promise<void>;
  deployConfig: () => Promise<void>;
  resetConfig: () => void;
  markDirty: () => void;
  markClean: () => void;

  // Merge strategy
  getMergedConfig: () => TenantConfig | null;

  // History (stubbed for MVP, can be implemented later)
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

// ============================================================================
// COMBINED STORE STATE
// ============================================================================

export interface ConfigBuilderState {
  programs: ProgramsSlice;
  forms: FormsSlice;
  ctas: CTAsSlice;
  branches: BranchesSlice;
  cardInventory: CardInventorySlice;
  ui: UISlice;
  validation: ValidationSlice;
  config: ConfigSlice;
}

// ============================================================================
// SLICE CREATOR TYPE
// ============================================================================

export type SliceCreator<T> = (
  set: (fn: (state: ConfigBuilderState) => void) => void,
  get: () => ConfigBuilderState,
  api: any
) => T;
