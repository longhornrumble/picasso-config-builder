/**
 * Type Tests for Flow Diagram Dashboard Types
 *
 * These tests verify that all type definitions compile correctly
 * and work as expected with TypeScript's type system.
 */

import { describe, it, expect } from 'vitest';
import type {
  EntityType,
  ValidationStatus,
  TreeNode,
  EntityNodeProps,
  EntityListProps,
  FlowDiagramProps,
  FlowDiagramSection,
  EntityTypeConfig,
  ReadonlyTreeNode,
  PartialTreeNode,
} from '../types';
import {
  isProgram,
  isForm,
  isCTA,
  isBranch,
  isActionChip,
  isShowcase,
} from '../types';

describe('Flow Diagram Dashboard Types', () => {
  describe('Type Guards', () => {
    it('should correctly identify program nodes', () => {
      const programNode: TreeNode = {
        id: 'prog-1',
        type: 'program',
        name: 'Test Program',
        data: {
          program_id: 'prog-1',
          program_name: 'Test Program',
          description: 'Test Description',
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isProgram(programNode)).toBe(true);
      expect(isForm(programNode)).toBe(false);
      expect(isCTA(programNode)).toBe(false);
    });

    it('should correctly identify form nodes', () => {
      const formNode: TreeNode = {
        id: 'form-1',
        type: 'form',
        name: 'Test Form',
        data: {
          enabled: true,
          form_id: 'form-1',
          program: 'prog-1',
          title: 'Test Form',
          description: 'Test Description',
          fields: [],
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isForm(formNode)).toBe(true);
      expect(isProgram(formNode)).toBe(false);
      expect(isCTA(formNode)).toBe(false);
    });

    it('should correctly identify CTA nodes', () => {
      const ctaNode: TreeNode = {
        id: 'cta-1',
        type: 'cta',
        name: 'Test CTA',
        data: {
          label: 'Test CTA',
          action: 'start_form',
          type: 'form_trigger',
          formId: 'form-1',
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isCTA(ctaNode)).toBe(true);
      expect(isProgram(ctaNode)).toBe(false);
      expect(isForm(ctaNode)).toBe(false);
    });

    it('should correctly identify branch nodes', () => {
      const branchNode: TreeNode = {
        id: 'branch-1',
        type: 'branch',
        name: 'Test Branch',
        data: {
          available_ctas: {
            primary: 'cta-1',
            secondary: [],
          },
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isBranch(branchNode)).toBe(true);
      expect(isProgram(branchNode)).toBe(false);
      expect(isForm(branchNode)).toBe(false);
    });

    it('should correctly identify action chip nodes', () => {
      const chipNode: TreeNode = {
        id: 'chip-1',
        type: 'actionChip',
        name: 'Test Chip',
        data: {
          label: 'Test Chip',
          value: 'test query',
          action: 'send_query',
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isActionChip(chipNode)).toBe(true);
      expect(isProgram(chipNode)).toBe(false);
      expect(isForm(chipNode)).toBe(false);
    });

    it('should correctly identify showcase nodes', () => {
      const showcaseNode: TreeNode = {
        id: 'showcase-1',
        type: 'showcase',
        name: 'Test Showcase',
        data: {
          id: 'showcase-1',
          type: 'program',
          enabled: true,
          name: 'Test Showcase',
          tagline: 'Test Tagline',
          description: 'Test Description',
          keywords: ['test'],
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(isShowcase(showcaseNode)).toBe(true);
      expect(isProgram(showcaseNode)).toBe(false);
      expect(isForm(showcaseNode)).toBe(false);
    });
  });

  describe('Type Definitions', () => {
    it('should allow valid EntityType values', () => {
      const validTypes: EntityType[] = [
        'program',
        'form',
        'cta',
        'branch',
        'actionChip',
        'showcase',
      ];

      expect(validTypes.length).toBe(6);
    });

    it('should allow valid ValidationStatus values', () => {
      const validStatuses: ValidationStatus[] = [
        'error',
        'warning',
        'success',
        'none',
      ];

      expect(validStatuses.length).toBe(4);
    });

    it('should create valid TreeNode with metadata', () => {
      const node: TreeNode = {
        id: 'test-1',
        type: 'program',
        name: 'Test',
        data: {
          program_id: 'test-1',
          program_name: 'Test',
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
        metadata: {
          usageCount: 5,
          lastModified: Date.now(),
          customField: 'value',
        },
      };

      expect(node.metadata?.usageCount).toBe(5);
      expect(node.metadata?.customField).toBe('value');
    });

    it('should create valid PartialTreeNode', () => {
      const partialNode: PartialTreeNode = {
        id: 'test-1',
        type: 'program',
        name: 'Test',
        data: {
          program_id: 'test-1',
          program_name: 'Test',
        },
        children: [],
        // validation fields are optional
      };

      expect(partialNode.id).toBe('test-1');
      expect(partialNode.validationStatus).toBeUndefined();
    });

    it('should create valid ReadonlyTreeNode', () => {
      const readonlyNode: ReadonlyTreeNode = {
        id: 'test-1',
        type: 'program',
        name: 'Test',
        data: {
          program_id: 'test-1',
          program_name: 'Test',
        },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      expect(readonlyNode.id).toBe('test-1');
    });
  });

  describe('Interface Compatibility', () => {
    it('should create valid EntityNodeProps', () => {
      const mockNode: TreeNode = {
        id: 'test-1',
        type: 'program',
        name: 'Test',
        data: { program_id: 'test-1', program_name: 'Test' },
        children: [],
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      };

      const props: EntityNodeProps = {
        node: mockNode,
        depth: 0,
        isExpanded: true,
        onToggleExpand: (id: string) => {
          console.log('Toggle:', id);
        },
        onNavigate: (type: EntityType, id: string) => {
          console.log('Navigate:', type, id);
        },
      };

      expect(props.node.id).toBe('test-1');
      expect(props.depth).toBe(0);
    });

    it('should create valid EntityListProps', () => {
      const props: EntityListProps = {
        entities: [],
        depth: 1,
        expandedIds: new Set(['test-1', 'test-2']),
        onToggleExpand: (id: string) => {
          console.log('Toggle:', id);
        },
        onNavigate: (type: EntityType, id: string) => {
          console.log('Navigate:', type, id);
        },
      };

      expect(props.depth).toBe(1);
      expect(props.expandedIds.size).toBe(2);
    });

    it('should create valid FlowDiagramSection', () => {
      const MockIcon = ({ className }: { className?: string }) => null;

      const section: FlowDiagramSection = {
        title: 'Programs',
        icon: MockIcon,
        nodes: [],
        initiallyExpanded: true,
      };

      expect(section.title).toBe('Programs');
      expect(section.initiallyExpanded).toBe(true);
    });

    it('should create valid EntityTypeConfig', () => {
      const MockIcon = ({ className }: { className?: string }) => null;

      const config: EntityTypeConfig = {
        label: 'Program',
        icon: MockIcon,
        color: 'bg-green-50 border-green-200 text-green-800',
        route: '/programs',
      };

      expect(config.label).toBe('Program');
      expect(config.route).toBe('/programs');
    });
  });
});
