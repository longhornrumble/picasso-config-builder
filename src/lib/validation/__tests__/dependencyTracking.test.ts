/**
 * Dependency Tracking Tests
 * Tests for dependency graph building and impact analysis
 */

import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  getProgramDependencies,
  getFormDependencies,
  getCTADependencies,
  getBranchDependencies,
  getProgramDeletionImpact,
  getFormDeletionImpact,
  getCTADeletionImpact,
  getBranchDeletionImpact,
  formatDeletionImpact,
} from '../dependencyTracking';
import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
} from '@/types/config';

describe('Dependency Tracking', () => {
  const mockProgram: Program = {
    program_id: 'test-program',
    program_name: 'Test Program',
  };

  const mockForm: ConversationalForm = {
    enabled: true,
    form_id: 'test-form',
    program: 'test-program',
    title: 'Test Form',
    description: 'Test',
    trigger_phrases: ['apply'],
    fields: [{ id: 'name', type: 'text', label: 'Name', prompt: 'Name?', required: true }],
  };

  const mockCTA: CTADefinition = {
    label: 'Apply Now',
    action: 'start_form',
    formId: 'test-form',
    type: 'form_trigger',
    style: 'primary',
  };

  const mockBranch: ConversationBranch = {
    detection_keywords: ['housing'],
    available_ctas: {
      primary: 'test-cta',
      secondary: [],
    },
  };

  describe('buildDependencyGraph', () => {
    it('should build complete dependency graph', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      expect(graph.programs['test-program']).toBeDefined();
      expect(graph.forms['test-form']).toBeDefined();
      expect(graph.ctas['test-cta']).toBeDefined();
      expect(graph.branches['test-branch']).toBeDefined();
    });

    it('should track form → program dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        {},
        {}
      );

      expect(graph.forms['test-form'].uses).toHaveLength(1);
      expect(graph.forms['test-form'].uses[0].type).toBe('program');
      expect(graph.forms['test-form'].uses[0].id).toBe('test-program');

      expect(graph.programs['test-program'].usedBy).toHaveLength(1);
      expect(graph.programs['test-program'].usedBy[0].type).toBe('form');
      expect(graph.programs['test-program'].usedBy[0].id).toBe('test-form');
    });

    it('should track CTA → form dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        {}
      );

      expect(graph.ctas['test-cta'].uses).toHaveLength(1);
      expect(graph.ctas['test-cta'].uses[0].type).toBe('form');
      expect(graph.ctas['test-cta'].uses[0].id).toBe('test-form');

      expect(graph.forms['test-form'].usedBy).toHaveLength(1);
      expect(graph.forms['test-form'].usedBy[0].type).toBe('cta');
      expect(graph.forms['test-form'].usedBy[0].id).toBe('test-cta');
    });

    it('should track branch → CTA dependencies', () => {
      const graph = buildDependencyGraph(
        {},
        {},
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      expect(graph.branches['test-branch'].uses).toHaveLength(1);
      expect(graph.branches['test-branch'].uses[0].type).toBe('cta');
      expect(graph.branches['test-branch'].uses[0].id).toBe('test-cta');

      expect(graph.ctas['test-cta'].usedBy).toHaveLength(1);
      expect(graph.ctas['test-cta'].usedBy[0].type).toBe('branch');
      expect(graph.ctas['test-cta'].usedBy[0].id).toBe('test-branch');
    });

    it('should track secondary CTA dependencies', () => {
      const branchWithSecondary: ConversationBranch = {
        detection_keywords: ['housing'],
        available_ctas: {
          primary: 'primary-cta',
          secondary: ['secondary-cta-1', 'secondary-cta-2'],
        },
      };

      const graph = buildDependencyGraph(
        {},
        {},
        {
          'primary-cta': mockCTA,
          'secondary-cta-1': mockCTA,
          'secondary-cta-2': mockCTA,
        },
        { 'test-branch': branchWithSecondary }
      );

      expect(graph.branches['test-branch'].uses).toHaveLength(3);
    });
  });

  describe('getProgramDependencies', () => {
    it('should return all program dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      const deps = getProgramDependencies('test-program', graph);

      expect(deps.forms).toHaveLength(1);
      expect(deps.forms[0].id).toBe('test-form');

      expect(deps.ctas).toHaveLength(1);
      expect(deps.ctas[0].id).toBe('test-cta');

      expect(deps.branches).toHaveLength(1);
      expect(deps.branches[0].id).toBe('test-branch');
    });

    it('should return empty dependencies for nonexistent program', () => {
      const graph = buildDependencyGraph({}, {}, {}, {});
      const deps = getProgramDependencies('nonexistent', graph);

      expect(deps.forms).toHaveLength(0);
      expect(deps.ctas).toHaveLength(0);
      expect(deps.branches).toHaveLength(0);
    });
  });

  describe('getFormDependencies', () => {
    it('should return all form dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      const deps = getFormDependencies('test-form', graph);

      expect(deps.program).not.toBeNull();
      expect(deps.program?.id).toBe('test-program');

      expect(deps.ctas).toHaveLength(1);
      expect(deps.ctas[0].id).toBe('test-cta');

      expect(deps.branches).toHaveLength(1);
      expect(deps.branches[0].id).toBe('test-branch');
    });

    it('should return null program if form has no program', () => {
      const formWithoutProgram = { ...mockForm, program: '' };
      const graph = buildDependencyGraph(
        {},
        { 'test-form': formWithoutProgram },
        {},
        {}
      );

      const deps = getFormDependencies('test-form', graph);
      expect(deps.program).toBeNull();
    });
  });

  describe('getCTADependencies', () => {
    it('should return all CTA dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      const deps = getCTADependencies('test-cta', graph);

      expect(deps.form).not.toBeNull();
      expect(deps.form?.id).toBe('test-form');

      expect(deps.program).not.toBeNull();
      expect(deps.program?.id).toBe('test-program');

      expect(deps.branches).toHaveLength(1);
      expect(deps.branches[0].id).toBe('test-branch');
    });

    it('should return null for non-form CTAs', () => {
      const queryCTA: CTADefinition = {
        label: 'Query',
        action: 'send_query',
        query: 'test',
        type: 'bedrock_query',
        style: 'secondary',
      };

      const graph = buildDependencyGraph({}, {}, { 'query-cta': queryCTA }, {});
      const deps = getCTADependencies('query-cta', graph);

      expect(deps.form).toBeNull();
      expect(deps.program).toBeNull();
    });
  });

  describe('getBranchDependencies', () => {
    it('should return all branch dependencies', () => {
      const graph = buildDependencyGraph(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      const deps = getBranchDependencies('test-branch', graph);

      expect(deps.ctas).toHaveLength(1);
      expect(deps.ctas[0].id).toBe('test-cta');

      expect(deps.forms).toHaveLength(1);
      expect(deps.forms[0].id).toBe('test-form');

      expect(deps.programs).toHaveLength(1);
      expect(deps.programs[0].id).toBe('test-program');
    });

    it('should handle branches with multiple CTAs', () => {
      const branchWithMultipleCTAs: ConversationBranch = {
        detection_keywords: ['housing'],
        available_ctas: {
          primary: 'cta-1',
          secondary: ['cta-2', 'cta-3'],
        },
      };

      const graph = buildDependencyGraph(
        {},
        {},
        {
          'cta-1': mockCTA,
          'cta-2': mockCTA,
          'cta-3': mockCTA,
        },
        { 'test-branch': branchWithMultipleCTAs }
      );

      const deps = getBranchDependencies('test-branch', graph);
      expect(deps.ctas).toHaveLength(3);
    });
  });

  describe('deletion impact reports', () => {
    describe('getProgramDeletionImpact', () => {
      it('should allow deletion of unused program', () => {
        const graph = buildDependencyGraph({ 'test-program': mockProgram }, {}, {}, {});
        const impact = getProgramDeletionImpact('test-program', mockProgram, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.blockingReasons).toHaveLength(0);
        expect(impact.warnings.some((w) => w.includes('Safe to delete'))).toBe(true);
      });

      it('should warn about dependencies when deleting program', () => {
        const graph = buildDependencyGraph(
          { 'test-program': mockProgram },
          { 'test-form': mockForm },
          { 'test-cta': mockCTA },
          { 'test-branch': mockBranch }
        );

        const impact = getProgramDeletionImpact('test-program', mockProgram, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.warnings.some((w) => w.includes('form'))).toBe(true);
        expect(impact.warnings.some((w) => w.includes('CTA'))).toBe(true);
        expect(impact.warnings.some((w) => w.includes('branch'))).toBe(true);
      });
    });

    describe('getFormDeletionImpact', () => {
      it('should allow deletion of unused form', () => {
        const graph = buildDependencyGraph(
          { 'test-program': mockProgram },
          { 'test-form': mockForm },
          {},
          {}
        );
        const impact = getFormDeletionImpact('test-form', mockForm, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.warnings.some((w) => w.includes('Safe to delete'))).toBe(true);
      });

      it('should warn about CTAs when deleting form', () => {
        const graph = buildDependencyGraph(
          { 'test-program': mockProgram },
          { 'test-form': mockForm },
          { 'test-cta': mockCTA },
          { 'test-branch': mockBranch }
        );

        const impact = getFormDeletionImpact('test-form', mockForm, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.warnings.some((w) => w.includes('CTA'))).toBe(true);
        expect(impact.warnings.some((w) => w.includes('branch'))).toBe(true);
      });
    });

    describe('getCTADeletionImpact', () => {
      it('should allow deletion of unused CTA', () => {
        const graph = buildDependencyGraph(
          {},
          {},
          { 'test-cta': mockCTA },
          {}
        );
        const impact = getCTADeletionImpact('test-cta', mockCTA, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.warnings.some((w) => w.includes('Safe to delete'))).toBe(true);
      });

      it('should warn about branches when deleting CTA', () => {
        const graph = buildDependencyGraph(
          {},
          {},
          { 'test-cta': mockCTA },
          { 'test-branch': mockBranch }
        );

        const impact = getCTADeletionImpact('test-cta', mockCTA, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.warnings.some((w) => w.includes('branch'))).toBe(true);
      });
    });

    describe('getBranchDeletionImpact', () => {
      it('should always allow branch deletion', () => {
        const graph = buildDependencyGraph(
          {},
          {},
          { 'test-cta': mockCTA },
          { 'test-branch': mockBranch }
        );

        const impact = getBranchDeletionImpact('test-branch', mockBranch, graph);

        expect(impact.canDelete).toBe(true);
        expect(impact.blockingReasons).toHaveLength(0);
        expect(impact.warnings.some((w) => w.includes('Safe to delete'))).toBe(true);
      });
    });
  });

  describe('formatDeletionImpact', () => {
    it('should format deletion impact message', () => {
      const impact = {
        canDelete: true,
        blockingReasons: [],
        warnings: ['1 form references this program'],
        affectedEntities: {
          forms: [],
          ctas: [],
          branches: [],
        },
      };

      const message = formatDeletionImpact('program', 'Test Program', impact);

      expect(message).toContain('program');
      expect(message).toContain('Test Program');
      expect(message).toContain('form');
    });

    it('should format blocking reasons', () => {
      const impact = {
        canDelete: false,
        blockingReasons: ['Cannot delete: used by critical component'],
        warnings: [],
        affectedEntities: {
          forms: [],
          ctas: [],
          branches: [],
        },
      };

      const message = formatDeletionImpact('form', 'Test Form', impact);

      expect(message).toContain('CANNOT DELETE');
      expect(message).toContain('critical component');
    });
  });
});
