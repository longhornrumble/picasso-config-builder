/**
 * Dependency Selectors
 * Cross-slice selectors for tracking entity dependencies
 */

import type { ConfigBuilderState, Dependencies } from '../types';

/**
 * Get all dependencies for a given entity
 * Useful for determining if an entity can be safely deleted
 */
export function getEntityDependencies(
  state: ConfigBuilderState,
  entityType: 'program' | 'form' | 'cta' | 'branch',
  entityId: string
): Dependencies {
  switch (entityType) {
    case 'program':
      return state.programs.getProgramDependencies(entityId);
    case 'form':
      return state.forms.getFormDependencies(entityId);
    case 'cta':
      return state.ctas.getCTADependencies(entityId);
    case 'branch':
      return state.branches.getBranchDependencies(entityId);
    default:
      return { programs: [], forms: [], ctas: [], branches: [] };
  }
}

/**
 * Check if an entity can be safely deleted
 * Returns true if no other entities depend on it
 */
export function canDeleteEntity(
  state: ConfigBuilderState,
  entityType: 'program' | 'form' | 'cta' | 'branch',
  entityId: string
): boolean {
  const deps = getEntityDependencies(state, entityType, entityId);

  // Check if any dependencies exist
  return (
    deps.programs.length === 0 &&
    deps.forms.length === 0 &&
    deps.ctas.length === 0 &&
    deps.branches.length === 0
  );
}

/**
 * Get a human-readable message about why an entity cannot be deleted
 */
export function getDeleteBlockerMessage(
  state: ConfigBuilderState,
  entityType: 'program' | 'form' | 'cta' | 'branch',
  entityId: string
): string | null {
  const deps = getEntityDependencies(state, entityType, entityId);

  const messages: string[] = [];

  if (deps.programs.length > 0) {
    messages.push(`${deps.programs.length} program(s)`);
  }
  if (deps.forms.length > 0) {
    messages.push(`${deps.forms.length} form(s)`);
  }
  if (deps.ctas.length > 0) {
    messages.push(`${deps.ctas.length} CTA(s)`);
  }
  if (deps.branches.length > 0) {
    messages.push(`${deps.branches.length} branch(es)`);
  }

  if (messages.length === 0) {
    return null;
  }

  return `Cannot delete: used by ${messages.join(', ')}`;
}

/**
 * Get all entities that would be affected by deleting this entity
 * Returns a flat list of entity IDs with their types
 */
export function getAffectedEntities(
  state: ConfigBuilderState,
  entityType: 'program' | 'form' | 'cta' | 'branch',
  entityId: string
): Array<{ type: string; id: string; label: string }> {
  const deps = getEntityDependencies(state, entityType, entityId);
  const affected: Array<{ type: string; id: string; label: string }> = [];

  // Add programs
  deps.programs.forEach((programId) => {
    const program = state.programs.getProgram(programId);
    if (program) {
      affected.push({
        type: 'program',
        id: programId,
        label: program.program_name,
      });
    }
  });

  // Add forms
  deps.forms.forEach((formId) => {
    const form = state.forms.getForm(formId);
    if (form) {
      affected.push({
        type: 'form',
        id: formId,
        label: form.title,
      });
    }
  });

  // Add CTAs
  deps.ctas.forEach((ctaId) => {
    const cta = state.ctas.getCTA(ctaId);
    if (cta) {
      affected.push({
        type: 'cta',
        id: ctaId,
        label: cta.label,
      });
    }
  });

  // Add branches
  deps.branches.forEach((branchId) => {
    const branch = state.branches.getBranch(branchId);
    if (branch) {
      affected.push({
        type: 'branch',
        id: branchId,
        label: branchId, // Branches don't have a name, use ID
      });
    }
  });

  return affected;
}

/**
 * Check if the entire config has any orphaned entities
 * Orphaned entities are those that reference non-existent dependencies
 */
export function findOrphanedEntities(state: ConfigBuilderState): Array<{
  type: string;
  id: string;
  issue: string;
}> {
  const orphaned: Array<{ type: string; id: string; issue: string }> = [];

  // Check forms for missing programs
  Object.entries(state.forms.forms).forEach(([formId, form]) => {
    if (form.program && !state.programs.getProgram(form.program)) {
      orphaned.push({
        type: 'form',
        id: formId,
        issue: `References non-existent program: ${form.program}`,
      });
    }
  });

  // Check CTAs for missing forms
  Object.entries(state.ctas.ctas).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_form' && cta.formId && !state.forms.getForm(cta.formId)) {
      orphaned.push({
        type: 'cta',
        id: ctaId,
        issue: `References non-existent form: ${cta.formId}`,
      });
    }
  });

  // Check branches for missing CTAs
  Object.entries(state.branches.branches).forEach(([branchId, branch]) => {
    if (branch.available_ctas.primary && !state.ctas.getCTA(branch.available_ctas.primary)) {
      orphaned.push({
        type: 'branch',
        id: branchId,
        issue: `References non-existent primary CTA: ${branch.available_ctas.primary}`,
      });
    }

    branch.available_ctas.secondary.forEach((ctaId) => {
      if (!state.ctas.getCTA(ctaId)) {
        orphaned.push({
          type: 'branch',
          id: branchId,
          issue: `References non-existent secondary CTA: ${ctaId}`,
        });
      }
    });
  });

  return orphaned;
}

/**
 * Get usage statistics for the entire config
 */
export function getConfigStatistics(state: ConfigBuilderState): {
  programs: number;
  forms: number;
  ctas: number;
  branches: number;
  totalFields: number;
  orphanedEntities: number;
} {
  const orphaned = findOrphanedEntities(state);

  let totalFields = 0;
  Object.values(state.forms.forms).forEach((form) => {
    totalFields += form.fields.length;
  });

  return {
    programs: Object.keys(state.programs.programs).length,
    forms: Object.keys(state.forms.forms).length,
    ctas: Object.keys(state.ctas.ctas).length,
    branches: Object.keys(state.branches.branches).length,
    totalFields,
    orphanedEntities: orphaned.length,
  };
}
