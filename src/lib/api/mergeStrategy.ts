/**
 * Config Merge Strategy Module
 * Implements section-based editing to preserve read-only sections
 */

import type { TenantConfig } from '@/types/config';

/**
 * Editable sections that can be modified through the config builder
 */
export const EDITABLE_SECTIONS = [
  'programs',
  'conversational_forms',
  'cta_definitions',
  'conversation_branches',
  'content_showcase',
] as const;

/**
 * Read-only sections that should be preserved during merge
 */
export const READ_ONLY_SECTIONS = [
  'branding',
  'features',
  'quick_help',
  'action_chips',
  'widget_behavior',
  'aws',
  'card_inventory',
  'subscription_tier',
] as const;

/**
 * Metadata fields that should be updated during merge
 */
export const METADATA_FIELDS = [
  'tenant_id',
  'version',
  'chat_title',
  'company_name',
  'generated_at',
] as const;

export type EditableSection = typeof EDITABLE_SECTIONS[number];
export type ReadOnlySection = typeof READ_ONLY_SECTIONS[number];
export type MetadataField = typeof METADATA_FIELDS[number];

export interface MergeResult {
  config: Partial<TenantConfig>;
  metadata: {
    merged_at: string;
    version: string;
    editable_sections_updated: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConfigDiff {
  metadata_changes: Record<string, { old: any; new: any }>;
  section_changes: Record<string, {
    old_count: number;
    new_count: number;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  has_changes: boolean;
}

export interface SectionInfo {
  editable: readonly string[];
  readOnly: readonly string[];
  metadata: readonly string[];
}

/**
 * Merge edited sections into the base configuration
 * Preserves read-only sections and updates metadata
 */
export function mergeConfigSections(
  baseConfig: Partial<TenantConfig>,
  editedSections: Partial<TenantConfig>
): Partial<TenantConfig> {
  // Start with the base config
  const merged = { ...baseConfig };

  // Update editable sections if provided
  EDITABLE_SECTIONS.forEach((section) => {
    if (section in editedSections) {
      (merged as any)[section] = (editedSections as any)[section];
    }
  });

  // Update metadata fields if provided (except those we control)
  METADATA_FIELDS.forEach((field) => {
    if (field in editedSections && field !== 'generated_at') {
      (merged as any)[field] = (editedSections as any)[field];
    }
  });

  // Ensure tenant_id is preserved from base
  if (baseConfig.tenant_id) {
    merged.tenant_id = baseConfig.tenant_id;
  }

  // Ensure version is preserved or defaulted
  if (!merged.version) {
    merged.version = baseConfig.version || '1.3';
  }

  // Update generated_at timestamp
  merged.generated_at = Date.now();

  return merged;
}

/**
 * Extract only editable sections from a full config
 * Useful for sending only the editable parts to the frontend
 */
export function extractEditableSections(
  fullConfig: Partial<TenantConfig>
): Partial<TenantConfig> {
  const editable: Partial<TenantConfig> = {};

  // Include metadata
  METADATA_FIELDS.forEach((field) => {
    if (field in fullConfig) {
      (editable as any)[field] = (fullConfig as any)[field];
    }
  });

  // Include editable sections
  EDITABLE_SECTIONS.forEach((section) => {
    if (section in fullConfig) {
      (editable as any)[section] = (fullConfig as any)[section];
    }
  });

  return editable;
}

/**
 * Validate that edited sections only contain allowed sections
 */
export function validateEditedSections(
  editedSections: Partial<TenantConfig>
): ValidationResult {
  const errors: string[] = [];
  const allowedKeys = [...EDITABLE_SECTIONS, ...METADATA_FIELDS];

  // Check for disallowed sections
  const editedKeys = Object.keys(editedSections);
  const disallowedKeys = editedKeys.filter(
    (key) => !allowedKeys.includes(key as any) && !READ_ONLY_SECTIONS.includes(key as any)
  );

  if (disallowedKeys.length > 0) {
    errors.push(`Disallowed sections in edited config: ${disallowedKeys.join(', ')}`);
  }

  // Check for attempts to edit read-only sections
  const readOnlyAttempts = editedKeys.filter((key) =>
    READ_ONLY_SECTIONS.includes(key as any)
  );
  if (readOnlyAttempts.length > 0) {
    errors.push(`Cannot edit read-only sections: ${readOnlyAttempts.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get information about section structure
 */
export function getSectionInfo(): SectionInfo {
  return {
    editable: EDITABLE_SECTIONS,
    readOnly: READ_ONLY_SECTIONS,
    metadata: METADATA_FIELDS,
  };
}

/**
 * Deep clone an object (simple implementation for config objects)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge multiple section updates into a single config
 * Useful when applying multiple changes in sequence
 */
export function mergeMultipleSectionUpdates(
  baseConfig: Partial<TenantConfig>,
  sectionUpdates: Array<Partial<TenantConfig>>
): Partial<TenantConfig> {
  let merged = deepClone(baseConfig);

  sectionUpdates.forEach((update) => {
    merged = mergeConfigSections(merged, update);
  });

  return merged;
}

/**
 * Check if a section is editable
 */
export function isEditableSection(sectionName: string): boolean {
  return EDITABLE_SECTIONS.includes(sectionName as EditableSection);
}

/**
 * Check if a section is read-only
 */
export function isReadOnlySection(sectionName: string): boolean {
  return READ_ONLY_SECTIONS.includes(sectionName as ReadOnlySection);
}

/**
 * Generate a diff between two configs showing what changed
 */
export function generateConfigDiff(
  oldConfig: Partial<TenantConfig>,
  newConfig: Partial<TenantConfig>
): ConfigDiff {
  const diff: ConfigDiff = {
    metadata_changes: {},
    section_changes: {},
    has_changes: false,
  };

  // Check metadata changes
  METADATA_FIELDS.forEach((field) => {
    const oldValue = (oldConfig as any)[field];
    const newValue = (newConfig as any)[field];

    if (oldValue !== newValue) {
      diff.metadata_changes[field] = {
        old: oldValue,
        new: newValue,
      };
      diff.has_changes = true;
    }
  });

  // Check editable section changes
  EDITABLE_SECTIONS.forEach((section) => {
    const oldSection = (oldConfig as any)[section] || {};
    const newSection = (newConfig as any)[section] || {};

    const oldKeys = Object.keys(oldSection);
    const newKeys = Object.keys(newSection);

    if (
      oldKeys.length !== newKeys.length ||
      JSON.stringify(oldSection) !== JSON.stringify(newSection)
    ) {
      diff.section_changes[section] = {
        old_count: oldKeys.length,
        new_count: newKeys.length,
        added: newKeys.filter((k) => !oldKeys.includes(k)),
        removed: oldKeys.filter((k) => !newKeys.includes(k)),
        modified: newKeys.filter(
          (k) =>
            oldKeys.includes(k) &&
            JSON.stringify(oldSection[k]) !== JSON.stringify(newSection[k])
        ),
      };
      diff.has_changes = true;
    }
  });

  return diff;
}

/**
 * Prepare config for deployment
 * Merges current state from store into base config
 */
export function prepareConfigForDeployment(
  baseConfig: Partial<TenantConfig>,
  currentState: {
    programs: Record<string, any>;
    forms: Record<string, any>;
    ctas: Record<string, any>;
    branches: Record<string, any>;
    contentShowcase?: any[];
  }
): MergeResult {
  const editedSections: Partial<TenantConfig> = {
    programs: currentState.programs,
    conversational_forms: currentState.forms,
    cta_definitions: currentState.ctas,
    conversation_branches: currentState.branches,
  };

  if (currentState.contentShowcase) {
    (editedSections as any).content_showcase = currentState.contentShowcase;
  }

  const merged = mergeConfigSections(baseConfig, editedSections);

  return {
    config: merged,
    metadata: {
      merged_at: new Date().toISOString(),
      version: merged.version || '1.3',
      editable_sections_updated: EDITABLE_SECTIONS.filter(
        (section) => section in editedSections
      ),
    },
  };
}
