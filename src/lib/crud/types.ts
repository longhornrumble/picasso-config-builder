/**
 * Generic CRUD Types and Interfaces
 *
 * This module defines the core types and interfaces for the generic CRUD framework.
 * It provides a type-safe way to build CRUD editors for any entity type.
 */

import type { LucideIcon } from 'lucide-react';
import type { ValidationErrors } from '@/types/validation';

/**
 * Base entity interface that all domain entities must extend
 * Ensures entities have a unique identifier field
 */
export interface BaseEntity {
  [key: string]: any;
}

/**
 * Entity ID extractor function type
 * Given an entity, returns its unique identifier
 */
export type IdExtractor<T extends BaseEntity> = (entity: T) => string;

/**
 * Entity name extractor function type
 * Given an entity, returns its display name
 */
export type NameExtractor<T extends BaseEntity> = (entity: T) => string;

/**
 * Validation function type
 * Validates entity data and returns errors
 */
export type ValidationFunction<T extends BaseEntity> = (
  data: T,
  context: ValidationContext<T>
) => ValidationErrors;

/**
 * Validation context provides additional information needed for validation
 */
export interface ValidationContext<T extends BaseEntity> {
  isEditMode: boolean;
  existingIds: string[];
  existingEntities: Record<string, T>;
  originalEntity?: T;
  // Optional fields for entity-specific validation
  availableCtaIds?: string[];  // For showcase items
  availableFormIds?: string[];  // For CTAs
}

/**
 * Store interface that entity stores must implement
 * Defines the contract for CRUD operations
 */
export interface EntityStore<T extends BaseEntity> {
  // State
  entities: Record<string, T>;

  // Actions
  createEntity: (entity: T) => void;
  updateEntity: (id: string, entity: T) => void;
  deleteEntity: (id: string) => void;
  getDependencies: (id: string) => EntityDependencies;
  duplicateEntity?: (id: string) => void;
}

/**
 * Entity dependencies information
 * Used for dependency checking before deletion
 */
export interface EntityDependencies {
  canDelete: boolean;
  dependentEntities: {
    type: string;
    ids: string[];
    names: string[];
  }[];
}

/**
 * Empty state configuration
 * Defines how the empty state should be displayed
 */
export interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText: string;
}

/**
 * Entity metadata configuration
 * Provides information about the entity type
 */
export interface EntityMetadata {
  entityType: string;          // e.g., "program", "branch", "cta", "form"
  entityName: string;           // e.g., "Program"
  entityNamePlural: string;     // e.g., "Programs"
  description: string;          // Description shown in header
}

/**
 * Form field props interface
 * Props passed to domain-specific form fields components
 */
export interface FormFieldsProps<T extends BaseEntity> {
  value: T;
  onChange: (value: T) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
  isEditMode: boolean;
  existingIds: string[];
}

/**
 * Card content props interface
 * Props passed to domain-specific card content components
 */
export interface CardContentProps<T extends BaseEntity> {
  entity: T;
  metadata?: Record<string, any>;
}

/**
 * Entity editor configuration
 * Complete configuration for a CRUD editor
 */
export interface EntityEditorConfig<T extends BaseEntity> {
  // Entity metadata
  metadata: EntityMetadata;

  // Empty state
  emptyState: EmptyStateConfig;

  // Store hook
  useStore: () => EntityStore<T>;

  // Validation
  validation: ValidationFunction<T>;

  // ID and name extraction
  getId: IdExtractor<T>;
  getName: NameExtractor<T>;

  // Components (domain-specific)
  FormFields: React.ComponentType<FormFieldsProps<T>>;
  CardContent: React.ComponentType<CardContentProps<T>>;

  // Optional customization
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
  gridColumns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  footerActions?: React.ReactNode | ((formData: T, onChange: (data: T) => void) => React.ReactNode);
}

/**
 * CRUD modal state
 * Tracks which modals are open and their data
 */
export interface CRUDModalState<T extends BaseEntity> {
  isFormOpen: boolean;
  isDeleteModalOpen: boolean;
  editingEntity: T | null;
  deletingEntity: T | null;
}

/**
 * CRUD actions
 * All the actions available in the CRUD interface
 */
export interface CRUDActions<T extends BaseEntity> {
  openCreateModal: () => void;
  openEditModal: (entity: T) => void;
  openDeleteModal: (entity: T) => void;
  closeFormModal: () => void;
  closeDeleteModal: () => void;
  handleSubmit: (entity: T) => void;
  handleDelete: () => void;
}

/**
 * Return type for useEntityCRUD hook
 * Combines state, derived data, and actions
 */
export interface EntityCRUDReturn<T extends BaseEntity> extends CRUDModalState<T>, CRUDActions<T> {
  // Entity list
  entities: T[];
  entityMap: Record<string, T>;

  // Dependencies for delete modal
  dependencies: EntityDependencies | null;

  // Helper getters
  existingIds: string[];
  isEditMode: boolean;
}
