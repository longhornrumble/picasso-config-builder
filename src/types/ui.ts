/**
 * UI Types for Picasso Config Builder
 *
 * These types define the structure of UI-specific data and state
 * that doesn't directly map to the config schema.
 */

import type { EntityType, ValidationIssue } from './validation';

// ============================================================================
// LIST ITEMS (for display in lists/tables)
// ============================================================================

export interface ProgramListItem {
  program_id: string;
  program_name: string;
  description?: string;
  formCount: number; // Number of forms using this program
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface FormListItem {
  form_id: string;
  title: string;
  program: string;
  programName: string;
  fieldCount: number;
  enabled: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface CTAListItem {
  cta_id: string;
  label: string;
  action: string;
  type: string;
  style: string;
  usageCount: number; // Number of branches using this CTA
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface BranchListItem {
  branch_id: string;
  keywordCount: number;
  primaryCTA: string;
  secondaryCTACount: number;
  hasErrors: boolean;
  hasWarnings: boolean;
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // milliseconds, undefined = manual dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// MODAL/DIALOG STATE
// ============================================================================

export type ModalType =
  | 'none'
  | 'create_program'
  | 'edit_program'
  | 'delete_program'
  | 'create_form'
  | 'edit_form'
  | 'delete_form'
  | 'create_cta'
  | 'edit_cta'
  | 'delete_cta'
  | 'create_branch'
  | 'edit_branch'
  | 'delete_branch'
  | 'deploy_confirm'
  | 'dependency_warning';

export interface ModalState {
  type: ModalType;
  entityId?: string;
  data?: unknown;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// FORM STATE
// ============================================================================

export interface FormState<T = unknown> {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  values: T;
}

// ============================================================================
// EDITOR VIEW STATE
// ============================================================================

export type EditorView = 'list' | 'edit' | 'preview';

export interface EditorViewState {
  view: EditorView;
  selectedId?: string;
  filterText?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// NAVIGATION
// ============================================================================

export type NavigationSection =
  | 'overview'
  | 'programs'
  | 'forms'
  | 'ctas'
  | 'branches'
  | 'cards'
  | 'validation'
  | 'deploy';

export interface NavigationItem {
  id: NavigationSection;
  label: string;
  icon: string;
  badge?: number; // For showing error/warning counts
  disabled?: boolean;
}

// ============================================================================
// VALIDATION PANEL
// ============================================================================

export interface ValidationPanelState {
  isExpanded: boolean;
  filter: 'all' | 'errors' | 'warnings';
  groupBy: 'entity' | 'severity' | 'type';
  selectedIssue?: ValidationIssue;
}

// ============================================================================
// DEPLOYMENT SUMMARY
// ============================================================================

export interface DeploymentSummary {
  programs: number;
  forms: number;
  ctas: number;
  branches: number;
  hasCardInventory: boolean;
  version: string;
  timestamp: number;
  validation: {
    errors: number;
    warnings: number;
    criticalIssues: ValidationIssue[];
  };
}

// ============================================================================
// FILTER/SEARCH STATE
// ============================================================================

export interface FilterState {
  searchText: string;
  entityTypes: EntityType[];
  showDisabled: boolean;
  hasErrors: boolean | null; // null = show all, true = only with errors, false = only without
  hasWarnings: boolean | null;
}

// ============================================================================
// SIDEBAR STATE
// ============================================================================

export interface SidebarState {
  isCollapsed: boolean;
  activeSection: NavigationSection;
  pinnedSections: NavigationSection[];
}

// ============================================================================
// UNSAVED CHANGES
// ============================================================================

export interface UnsavedChanges {
  hasChanges: boolean;
  lastSaved: number | null;
  affectedEntities: Array<{
    type: EntityType;
    id: string;
    label: string;
  }>;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  modifiers: Array<'ctrl' | 'shift' | 'alt' | 'meta'>;
  description: string;
  action: () => void;
}

// ============================================================================
// LOADING STATES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  dangerous?: boolean; // For delete actions
  separator?: boolean; // Render as separator line
  onClick: () => void;
}

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  targetId?: string;
  targetType?: EntityType;
}
