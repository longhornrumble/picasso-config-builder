/**
 * Dependency Tracking
 * Tracks dependencies between entities and generates impact reports
 */

import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
} from '@/types/config';
import type { DependencyReference, DependencyGraph } from '@/types/validation';

// ============================================================================
// DEPENDENCY GRAPH BUILDING
// ============================================================================

/**
 * Build a complete dependency graph for all entities
 *
 * Tracks:
 * - Programs: Used by forms
 * - Forms: Used by CTAs (start_form actions)
 * - CTAs: Used by branches (primary/secondary)
 * - Branches: No downstream dependencies
 *
 * @param programs - All programs
 * @param forms - All forms
 * @param ctas - All CTAs
 * @param branches - All branches
 * @returns Complete dependency graph
 */
export function buildDependencyGraph(
  programs: Record<string, Program>,
  forms: Record<string, ConversationalForm>,
  ctas: Record<string, CTADefinition>,
  branches: Record<string, ConversationBranch>
): DependencyGraph {
  const graph: DependencyGraph = {
    programs: {},
    forms: {},
    ctas: {},
    branches: {},
  };

  // Initialize empty dependencies for all entities
  Object.keys(programs).forEach((programId) => {
    graph.programs[programId] = { usedBy: [], uses: [] };
  });

  Object.keys(forms).forEach((formId) => {
    graph.forms[formId] = { usedBy: [], uses: [] };
  });

  Object.keys(ctas).forEach((ctaId) => {
    graph.ctas[ctaId] = { usedBy: [], uses: [] };
  });

  Object.keys(branches).forEach((branchId) => {
    graph.branches[branchId] = { usedBy: [], uses: [] };
  });

  // Build Form → Program dependencies
  Object.entries(forms).forEach(([formId, form]) => {
    if (form.program && programs[form.program]) {
      // Form uses program
      graph.forms[formId].uses.push({
        type: 'program',
        id: form.program,
        label: programs[form.program].program_name,
      });

      // Program is used by form
      graph.programs[form.program].usedBy.push({
        type: 'form',
        id: formId,
        label: form.title,
      });
    }
  });

  // Build CTA → Form dependencies
  Object.entries(ctas).forEach(([ctaId, cta]) => {
    if (cta.action === 'start_form' && cta.formId && forms[cta.formId]) {
      // CTA uses form
      graph.ctas[ctaId].uses.push({
        type: 'form',
        id: cta.formId,
        label: forms[cta.formId].title,
      });

      // Form is used by CTA
      graph.forms[cta.formId].usedBy.push({
        type: 'cta',
        id: ctaId,
        label: cta.label,
      });
    }
  });

  // Build Branch → CTA dependencies
  Object.entries(branches).forEach(([branchId, branch]) => {
    const branchLabel = branchId; // Branches don't have a label field

    // Primary CTA
    if (branch.available_ctas.primary && ctas[branch.available_ctas.primary]) {
      const ctaId = branch.available_ctas.primary;

      // Branch uses CTA
      graph.branches[branchId].uses.push({
        type: 'cta',
        id: ctaId,
        label: ctas[ctaId].label,
      });

      // CTA is used by branch
      graph.ctas[ctaId].usedBy.push({
        type: 'branch',
        id: branchId,
        label: branchLabel,
      });
    }

    // Secondary CTAs
    branch.available_ctas.secondary?.forEach((ctaId) => {
      if (ctas[ctaId]) {
        // Branch uses CTA
        graph.branches[branchId].uses.push({
          type: 'cta',
          id: ctaId,
          label: ctas[ctaId].label,
        });

        // CTA is used by branch
        graph.ctas[ctaId].usedBy.push({
          type: 'branch',
          id: branchId,
          label: branchLabel,
        });
      }
    });
  });

  return graph;
}

// ============================================================================
// DEPENDENCY QUERIES
// ============================================================================

/**
 * Get dependencies for a specific program
 */
export function getProgramDependencies(
  programId: string,
  graph: DependencyGraph
): {
  forms: DependencyReference[];
  ctas: DependencyReference[];
  branches: DependencyReference[];
} {
  const programDeps = graph.programs[programId];
  if (!programDeps) {
    return { forms: [], ctas: [], branches: [] };
  }

  const forms = programDeps.usedBy.filter((ref) => ref.type === 'form');

  // Get CTAs that use forms that depend on this program
  const ctas: DependencyReference[] = [];
  forms.forEach((formRef) => {
    const formDeps = graph.forms[formRef.id];
    if (formDeps) {
      formDeps.usedBy.forEach((ctaRef) => {
        if (ctaRef.type === 'cta' && !ctas.find((c) => c.id === ctaRef.id)) {
          ctas.push(ctaRef);
        }
      });
    }
  });

  // Get branches that use CTAs that depend on forms that depend on this program
  const branches: DependencyReference[] = [];
  ctas.forEach((ctaRef) => {
    const ctaDeps = graph.ctas[ctaRef.id];
    if (ctaDeps) {
      ctaDeps.usedBy.forEach((branchRef) => {
        if (branchRef.type === 'branch' && !branches.find((b) => b.id === branchRef.id)) {
          branches.push(branchRef);
        }
      });
    }
  });

  return { forms, ctas, branches };
}

/**
 * Get dependencies for a specific form
 */
export function getFormDependencies(
  formId: string,
  graph: DependencyGraph
): {
  program: DependencyReference | null;
  ctas: DependencyReference[];
  branches: DependencyReference[];
} {
  const formDeps = graph.forms[formId];
  if (!formDeps) {
    return { program: null, ctas: [], branches: [] };
  }

  const program = formDeps.uses.find((ref) => ref.type === 'program') || null;
  const ctas = formDeps.usedBy.filter((ref) => ref.type === 'cta');

  // Get branches that use CTAs that depend on this form
  const branches: DependencyReference[] = [];
  ctas.forEach((ctaRef) => {
    const ctaDeps = graph.ctas[ctaRef.id];
    if (ctaDeps) {
      ctaDeps.usedBy.forEach((branchRef) => {
        if (branchRef.type === 'branch' && !branches.find((b) => b.id === branchRef.id)) {
          branches.push(branchRef);
        }
      });
    }
  });

  return { program, ctas, branches };
}

/**
 * Get dependencies for a specific CTA
 */
export function getCTADependencies(
  ctaId: string,
  graph: DependencyGraph
): {
  form: DependencyReference | null;
  program: DependencyReference | null;
  branches: DependencyReference[];
} {
  const ctaDeps = graph.ctas[ctaId];
  if (!ctaDeps) {
    return { form: null, program: null, branches: [] };
  }

  const form = ctaDeps.uses.find((ref) => ref.type === 'form') || null;
  const branches = ctaDeps.usedBy.filter((ref) => ref.type === 'branch');

  // Get program from form
  let program: DependencyReference | null = null;
  if (form) {
    const formDeps = graph.forms[form.id];
    if (formDeps) {
      program = formDeps.uses.find((ref) => ref.type === 'program') || null;
    }
  }

  return { form, program, branches };
}

/**
 * Get dependencies for a specific branch
 */
export function getBranchDependencies(
  branchId: string,
  graph: DependencyGraph
): {
  ctas: DependencyReference[];
  forms: DependencyReference[];
  programs: DependencyReference[];
} {
  const branchDeps = graph.branches[branchId];
  if (!branchDeps) {
    return { ctas: [], forms: [], programs: [] };
  }

  const ctas = branchDeps.uses.filter((ref) => ref.type === 'cta');

  // Get forms from CTAs
  const forms: DependencyReference[] = [];
  ctas.forEach((ctaRef) => {
    const ctaDeps = graph.ctas[ctaRef.id];
    if (ctaDeps) {
      ctaDeps.uses.forEach((formRef) => {
        if (formRef.type === 'form' && !forms.find((f) => f.id === formRef.id)) {
          forms.push(formRef);
        }
      });
    }
  });

  // Get programs from forms
  const programs: DependencyReference[] = [];
  forms.forEach((formRef) => {
    const formDeps = graph.forms[formRef.id];
    if (formDeps) {
      formDeps.uses.forEach((programRef) => {
        if (programRef.type === 'program' && !programs.find((p) => p.id === programRef.id)) {
          programs.push(programRef);
        }
      });
    }
  });

  return { ctas, forms, programs };
}

// ============================================================================
// DELETION IMPACT REPORTS
// ============================================================================

export interface DeletionImpact {
  canDelete: boolean;
  blockingReasons: string[];
  warnings: string[];
  affectedEntities: {
    forms: DependencyReference[];
    ctas: DependencyReference[];
    branches: DependencyReference[];
  };
}

/**
 * Generate deletion impact report for a program
 *
 * Programs can be deleted, but it will break forms that reference them.
 */
export function getProgramDeletionImpact(
  programId: string,
  _program: Program,
  graph: DependencyGraph
): DeletionImpact {
  const deps = getProgramDependencies(programId, graph);

  const warnings: string[] = [];

  if (deps.forms.length > 0) {
    warnings.push(
      `${deps.forms.length} form${deps.forms.length > 1 ? 's' : ''} reference this program: ${deps.forms.map((f) => f.label).join(', ')}`
    );
  }

  if (deps.ctas.length > 0) {
    warnings.push(
      `${deps.ctas.length} CTA${deps.ctas.length > 1 ? 's' : ''} indirectly depend on this program through forms`
    );
  }

  if (deps.branches.length > 0) {
    warnings.push(
      `${deps.branches.length} branch${deps.branches.length > 1 ? 'es' : ''} indirectly depend on this program`
    );
  }

  return {
    canDelete: true,
    blockingReasons: [],
    warnings: warnings.length > 0 ? warnings : ['No dependencies found. Safe to delete.'],
    affectedEntities: {
      forms: deps.forms,
      ctas: deps.ctas,
      branches: deps.branches,
    },
  };
}

/**
 * Generate deletion impact report for a form
 *
 * Forms can be deleted, but it will break CTAs that reference them.
 */
export function getFormDeletionImpact(
  formId: string,
  _form: ConversationalForm,
  graph: DependencyGraph
): DeletionImpact {
  const deps = getFormDependencies(formId, graph);

  const warnings: string[] = [];

  if (deps.ctas.length > 0) {
    warnings.push(
      `${deps.ctas.length} CTA${deps.ctas.length > 1 ? 's' : ''} reference this form: ${deps.ctas.map((c) => c.label).join(', ')}`
    );
  }

  if (deps.branches.length > 0) {
    warnings.push(
      `${deps.branches.length} branch${deps.branches.length > 1 ? 'es' : ''} indirectly depend on this form through CTAs`
    );
  }

  return {
    canDelete: true,
    blockingReasons: [],
    warnings: warnings.length > 0 ? warnings : ['No dependencies found. Safe to delete.'],
    affectedEntities: {
      forms: [],
      ctas: deps.ctas,
      branches: deps.branches,
    },
  };
}

/**
 * Generate deletion impact report for a CTA
 *
 * CTAs can be deleted, but it will break branches that reference them.
 */
export function getCTADeletionImpact(
  ctaId: string,
  _cta: CTADefinition,
  graph: DependencyGraph
): DeletionImpact {
  const deps = getCTADependencies(ctaId, graph);

  const warnings: string[] = [];

  if (deps.branches.length > 0) {
    warnings.push(
      `${deps.branches.length} branch${deps.branches.length > 1 ? 'es' : ''} reference this CTA: ${deps.branches.map((b) => b.id).join(', ')}`
    );
  }

  return {
    canDelete: true,
    blockingReasons: [],
    warnings: warnings.length > 0 ? warnings : ['No dependencies found. Safe to delete.'],
    affectedEntities: {
      forms: [],
      ctas: [],
      branches: deps.branches,
    },
  };
}

/**
 * Generate deletion impact report for a branch
 *
 * Branches can always be safely deleted as nothing depends on them.
 */
export function getBranchDeletionImpact(
  _branchId: string,
  _branch: ConversationBranch,
  _graph: DependencyGraph
): DeletionImpact {
  return {
    canDelete: true,
    blockingReasons: [],
    warnings: ['No dependencies found. Safe to delete.'],
    affectedEntities: {
      forms: [],
      ctas: [],
      branches: [],
    },
  };
}

/**
 * Format deletion impact as human-readable text
 */
export function formatDeletionImpact(
  entityType: 'program' | 'form' | 'cta' | 'branch',
  entityName: string,
  impact: DeletionImpact
): string {
  const lines: string[] = [];

  lines.push(`⚠️  WARNING: Deleting ${entityType} "${entityName}"`);
  lines.push('');

  if (!impact.canDelete) {
    lines.push('❌ CANNOT DELETE');
    lines.push('');
    lines.push('Blocking reasons:');
    impact.blockingReasons.forEach((reason) => lines.push(`  • ${reason}`));
  } else {
    if (impact.warnings.length > 0) {
      lines.push('Impact:');
      impact.warnings.forEach((warning) => lines.push(`  • ${warning}`));
    }
  }

  return lines.join('\n');
}
