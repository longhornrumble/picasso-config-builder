/**
 * Dashboard Utilities Tests
 * Tests for tree building, validation, and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  buildTreeStructure,
  getEntityIcon,
  getEntityColor,
  getEntityRoute,
  getValidationIcon,
  getValidationColor,
  getValidationStatus,
  countTreeNodes,
  collectNodeIdsAtDepth,
  findNodeById,
  getAncestorIds,
  countValidationIssues,
  ENTITY_TYPE_CONFIG,
} from '../utils';
import type { TreeNode, EntityType, ValidationStatus } from '../types';
import type { Program, ConversationalForm, CTADefinition, ConversationBranch, ShowcaseItem } from '@/types/config';
import type { ValidationError } from '@/store/types';

describe('Dashboard Utilities', () => {
  describe('Entity Configuration', () => {
    it('should provide configuration for all entity types', () => {
      const entityTypes: EntityType[] = ['program', 'form', 'cta', 'branch', 'actionChip', 'showcase'];

      entityTypes.forEach((type) => {
        expect(ENTITY_TYPE_CONFIG[type]).toBeDefined();
        expect(ENTITY_TYPE_CONFIG[type].label).toBeTruthy();
        expect(ENTITY_TYPE_CONFIG[type].icon).toBeTruthy();
        expect(ENTITY_TYPE_CONFIG[type].color).toBeTruthy();
        expect(ENTITY_TYPE_CONFIG[type].route).toBeTruthy();
      });
    });

    it('should return correct icon for entity type', () => {
      const icon = getEntityIcon('program');
      expect(icon).toBeDefined();
      // Icons are React components (objects in test environment)
      expect(icon).toBeTruthy();
    });

    it('should return correct color classes for entity type', () => {
      const color = getEntityColor('program');
      expect(color).toContain('blue');
      expect(color).toContain('bg-');
    });

    it('should return correct route for entity type', () => {
      expect(getEntityRoute('program')).toBe('/programs');
      expect(getEntityRoute('form')).toBe('/forms');
      expect(getEntityRoute('cta')).toBe('/ctas');
      expect(getEntityRoute('branch')).toBe('/branches');
      expect(getEntityRoute('actionChip')).toBe('/action-chips');
      expect(getEntityRoute('showcase')).toBe('/cards');
    });
  });

  describe('Validation Status Utilities', () => {
    it('should return correct icon for validation status', () => {
      const statuses: ValidationStatus[] = ['error', 'warning', 'success', 'none'];

      statuses.forEach((status) => {
        const icon = getValidationIcon(status);
        expect(icon).toBeDefined();
        // Icons are React components (objects in test environment)
        expect(icon).toBeTruthy();
      });
    });

    it('should return correct color for validation status', () => {
      expect(getValidationColor('error')).toContain('red');
      expect(getValidationColor('warning')).toContain('yellow');
      expect(getValidationColor('success')).toContain('green');
      expect(getValidationColor('none')).toContain('gray');
    });

    it('should calculate validation status with errors', () => {
      const errors: Record<string, ValidationError[]> = {
        'entity-1': [{ id: 'err-1', entityId: 'entity-1', entityType: 'program', field: 'name', message: 'Error', severity: 'error' }],
      };
      const warnings: Record<string, ValidationError[]> = {};

      const result = getValidationStatus('program', 'entity-1', errors, warnings);

      expect(result.status).toBe('error');
      expect(result.errorCount).toBe(1);
      expect(result.warningCount).toBe(0);
    });

    it('should calculate validation status with warnings only', () => {
      const errors: Record<string, ValidationError[]> = {};
      const warnings: Record<string, ValidationError[]> = {
        'entity-1': [{ id: 'warn-1', entityId: 'entity-1', entityType: 'program', field: 'desc', message: 'Warning', severity: 'warning' }],
      };

      const result = getValidationStatus('program', 'entity-1', errors, warnings);

      expect(result.status).toBe('warning');
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(1);
    });

    it('should calculate success status when no errors or warnings', () => {
      const errors: Record<string, ValidationError[]> = { 'other-entity': [] };
      const warnings: Record<string, ValidationError[]> = { 'other-entity': [] };

      const result = getValidationStatus('program', 'entity-1', errors, warnings);

      expect(result.status).toBe('success');
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('should return none status when no validation has run', () => {
      const errors: Record<string, ValidationError[]> = {};
      const warnings: Record<string, ValidationError[]> = {};

      const result = getValidationStatus('program', 'entity-1', errors, warnings);

      expect(result.status).toBe('none');
    });
  });

  describe('Tree Building', () => {
    it('should build empty tree structure', () => {
      const result = buildTreeStructure({}, {}, {}, {}, {}, [], {}, {});

      expect(result.programsTree).toEqual([]);
      expect(result.actionChipsTree).toEqual([]);
      expect(result.showcaseTree).toEqual([]);
    });

    it('should build program tree with single program', () => {
      const programs: Record<string, Program> = {
        'prog-1': {
          program_id: 'prog-1',
          program_name: 'Test Program',
          description: 'Test Description',
        },
      };

      const result = buildTreeStructure(programs, {}, {}, {}, {}, [], {}, {});

      expect(result.programsTree).toHaveLength(1);
      expect(result.programsTree[0].id).toBe('prog-1');
      expect(result.programsTree[0].type).toBe('program');
      expect(result.programsTree[0].name).toBe('Test Program');
      expect(result.programsTree[0].children).toEqual([]);
    });

    it('should build program tree with forms', () => {
      const programs: Record<string, Program> = {
        'prog-1': {
          program_id: 'prog-1',
          program_name: 'Test Program',
          description: 'Test Description',
        },
      };

      const forms: Record<string, ConversationalForm> = {
        'form-1': {
          enabled: true,
          form_id: 'form-1',
          program: 'prog-1',
          title: 'Test Form',
          description: 'Test Description',
          fields: [],
        },
      };

      const result = buildTreeStructure(programs, forms, {}, {}, {}, [], {}, {});

      expect(result.programsTree).toHaveLength(1);
      expect(result.programsTree[0].children).toHaveLength(1);
      expect(result.programsTree[0].children[0].id).toBe('form-1');
      expect(result.programsTree[0].children[0].type).toBe('form');
    });

    it('should build form tree with CTAs', () => {
      const programs: Record<string, Program> = {
        'prog-1': {
          program_id: 'prog-1',
          program_name: 'Test Program',
          description: 'Test Description',
        },
      };

      const forms: Record<string, ConversationalForm> = {
        'form-1': {
          enabled: true,
          form_id: 'form-1',
          program: 'prog-1',
          title: 'Test Form',
          description: 'Test Description',
          fields: [],
        },
      };

      const ctas: Record<string, CTADefinition> = {
        'cta-1': {
          label: 'Test CTA',
          action: 'start_form',
          type: 'form_trigger',
          formId: 'form-1',
        },
      };

      const result = buildTreeStructure(programs, forms, ctas, {}, {}, [], {}, {});

      expect(result.programsTree).toHaveLength(1);
      const programNode = result.programsTree[0];
      expect(programNode.children).toHaveLength(1);

      const formNode = programNode.children[0];
      expect(formNode.children).toHaveLength(1);
      expect(formNode.children[0].id).toBe('cta-1');
      expect(formNode.children[0].type).toBe('cta');
    });

    it('should build CTA tree with branches', () => {
      const programs: Record<string, Program> = {
        'prog-1': { program_id: 'prog-1', program_name: 'Test Program', description: 'Test' },
      };

      const forms: Record<string, ConversationalForm> = {
        'form-1': {
          enabled: true,
          form_id: 'form-1',
          program: 'prog-1',
          title: 'Test Form',
          description: 'Test',
          fields: [],
        },
      };

      const ctas: Record<string, CTADefinition> = {
        'cta-1': { label: 'Test CTA', action: 'start_form', type: 'form_trigger', formId: 'form-1' },
      };

      const branches: Record<string, ConversationBranch> = {
        'branch-1': {
          available_ctas: { primary: 'cta-1', secondary: [] },
        },
      };

      const result = buildTreeStructure(programs, forms, ctas, branches, {}, [], {}, {});

      const ctaNode = result.programsTree[0].children[0].children[0];
      expect(ctaNode.children).toHaveLength(1);
      expect(ctaNode.children[0].id).toBe('branch-1');
      expect(ctaNode.children[0].type).toBe('branch');
    });

    it('should build action chips tree', () => {
      const actionChips = {
        'chip-1': { label: 'Chip 1', value: 'query 1' },
        'chip-2': { label: 'Chip 2', value: 'query 2' },
      };

      const result = buildTreeStructure({}, {}, {}, {}, actionChips, [], {}, {});

      expect(result.actionChipsTree).toHaveLength(2);
      expect(result.actionChipsTree[0].type).toBe('actionChip');
      expect(result.actionChipsTree[1].type).toBe('actionChip');
    });

    it('should build showcase tree', () => {
      const showcaseItems: ShowcaseItem[] = [
        {
          id: 'showcase-1',
          type: 'program',
          enabled: true,
          name: 'Test Showcase',
          tagline: 'Tagline',
          description: 'Description',
          keywords: ['test'],
        },
      ];

      const result = buildTreeStructure({}, {}, {}, {}, {}, showcaseItems, {}, {});

      expect(result.showcaseTree).toHaveLength(1);
      expect(result.showcaseTree[0].id).toBe('showcase-1');
      expect(result.showcaseTree[0].type).toBe('showcase');
    });
  });

  describe('Tree Manipulation Utilities', () => {
    const mockTree: TreeNode[] = [
      {
        id: 'root-1',
        type: 'program',
        name: 'Root 1',
        data: {},
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
        children: [
          {
            id: 'child-1',
            type: 'form',
            name: 'Child 1',
            data: {},
            validationStatus: 'error',
            errorCount: 2,
            warningCount: 0,
            children: [],
          },
          {
            id: 'child-2',
            type: 'form',
            name: 'Child 2',
            data: {},
            validationStatus: 'warning',
            errorCount: 0,
            warningCount: 1,
            children: [
              {
                id: 'grandchild-1',
                type: 'cta',
                name: 'Grandchild 1',
                data: {},
                validationStatus: 'success',
                errorCount: 0,
                warningCount: 0,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'root-2',
        type: 'program',
        name: 'Root 2',
        data: {},
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
        children: [],
      },
    ];

    it('should count total tree nodes', () => {
      const count = countTreeNodes(mockTree);
      expect(count).toBe(5); // 2 roots + 2 children + 1 grandchild
    });

    it('should collect node IDs at specific depth', () => {
      const depth0 = collectNodeIdsAtDepth(mockTree, 0);
      expect(depth0).toEqual(['root-1', 'root-2']);

      const depth1 = collectNodeIdsAtDepth(mockTree, 1);
      expect(depth1).toEqual(['child-1', 'child-2']);

      const depth2 = collectNodeIdsAtDepth(mockTree, 2);
      expect(depth2).toEqual(['grandchild-1']);
    });

    it('should find node by ID', () => {
      const found = findNodeById(mockTree, 'grandchild-1');
      expect(found).toBeDefined();
      expect(found?.id).toBe('grandchild-1');
      expect(found?.name).toBe('Grandchild 1');
    });

    it('should return undefined for non-existent node', () => {
      const found = findNodeById(mockTree, 'non-existent');
      expect(found).toBeUndefined();
    });

    it('should get ancestor IDs', () => {
      const ancestors = getAncestorIds(mockTree, 'grandchild-1');
      expect(ancestors).toEqual(['root-1', 'child-2']);
    });

    it('should return empty array for root node ancestors', () => {
      const ancestors = getAncestorIds(mockTree, 'root-1');
      expect(ancestors).toEqual([]);
    });

    it('should return null for non-existent node ancestors', () => {
      const ancestors = getAncestorIds(mockTree, 'non-existent');
      expect(ancestors).toBeNull();
    });

    it('should count validation issues in tree', () => {
      const issues = countValidationIssues(mockTree);
      expect(issues.errors).toBe(2); // Only from child-1
      expect(issues.warnings).toBe(1); // Only from child-2
    });
  });
});
