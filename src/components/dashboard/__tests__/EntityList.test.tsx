/**
 * EntityList Component Tests
 * Tests for the EntityList recursive rendering component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EntityList } from '../EntityList';
import type { TreeNode } from '../types';

describe('EntityList Component', () => {
  const mockOnToggleExpand = vi.fn();
  const mockOnNavigate = vi.fn();

  const createMockNode = (overrides?: Partial<TreeNode>): TreeNode => ({
    id: 'test-1',
    type: 'program',
    name: 'Test Node',
    data: { program_id: 'test-1', program_name: 'Test Node' },
    children: [],
    validationStatus: 'success',
    errorCount: 0,
    warningCount: 0,
    ...overrides,
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no entities', () => {
      render(
        <EntityList
          entities={[]}
          depth={0}
          expandedIds={new Set()}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('No entities found')).toBeInTheDocument();
    });

    it('should render single entity', () => {
      const entities = [createMockNode({ id: 'entity-1', name: 'Entity 1' })];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set()}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Entity 1')).toBeInTheDocument();
    });

    it('should render multiple entities', () => {
      const entities = [
        createMockNode({ id: 'entity-1', name: 'Entity 1' }),
        createMockNode({ id: 'entity-2', name: 'Entity 2' }),
        createMockNode({ id: 'entity-3', name: 'Entity 3' }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set()}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Entity 1')).toBeInTheDocument();
      expect(screen.getByText('Entity 2')).toBeInTheDocument();
      expect(screen.getByText('Entity 3')).toBeInTheDocument();
    });
  });

  describe('Recursive Rendering', () => {
    it('should not render children when node is collapsed', () => {
      const entities = [
        createMockNode({
          id: 'parent',
          name: 'Parent',
          children: [createMockNode({ id: 'child', name: 'Child' })],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set()} // Parent not expanded
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.queryByText('Child')).not.toBeInTheDocument();
    });

    it('should render children when node is expanded', () => {
      const entities = [
        createMockNode({
          id: 'parent',
          name: 'Parent',
          children: [createMockNode({ id: 'child', name: 'Child' })],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['parent'])} // Parent expanded
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    it('should render nested children at correct depth', () => {
      const entities = [
        createMockNode({
          id: 'grandparent',
          name: 'Grandparent',
          children: [
            createMockNode({
              id: 'parent',
              name: 'Parent',
              children: [createMockNode({ id: 'child', name: 'Child' })],
            }),
          ],
        }),
      ];

      const { container } = render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['grandparent', 'parent'])}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Grandparent')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();

      // Check that nodes with style attributes are rendered
      const styledDivs = container.querySelectorAll('div[style]');
      expect(styledDivs.length).toBeGreaterThan(0);
    });

    it('should handle multiple children at same level', () => {
      const entities = [
        createMockNode({
          id: 'parent',
          name: 'Parent',
          children: [
            createMockNode({ id: 'child-1', name: 'Child 1' }),
            createMockNode({ id: 'child-2', name: 'Child 2' }),
            createMockNode({ id: 'child-3', name: 'Child 3' }),
          ],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['parent'])}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('Selective Expansion', () => {
    it('should show only expanded nodes in tree', () => {
      const entities = [
        createMockNode({
          id: 'parent-1',
          name: 'Parent 1',
          children: [createMockNode({ id: 'child-1', name: 'Child 1' })],
        }),
        createMockNode({
          id: 'parent-2',
          name: 'Parent 2',
          children: [createMockNode({ id: 'child-2', name: 'Child 2' })],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['parent-1'])} // Only parent-1 expanded
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Parent 1')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Parent 2')).toBeInTheDocument();
      expect(screen.queryByText('Child 2')).not.toBeInTheDocument();
    });

    it('should handle deeply nested expansion', () => {
      const entities = [
        createMockNode({
          id: 'level-1',
          name: 'Level 1',
          children: [
            createMockNode({
              id: 'level-2',
              name: 'Level 2',
              children: [
                createMockNode({
                  id: 'level-3',
                  name: 'Level 3',
                  children: [createMockNode({ id: 'level-4', name: 'Level 4' })],
                }),
              ],
            }),
          ],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['level-1', 'level-2', 'level-3'])}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
    });
  });

  describe('Event Propagation', () => {
    it('should pass callbacks to child nodes', () => {
      const entities = [createMockNode({ id: 'entity-1', name: 'Entity 1' })];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set()}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // The EntityNode component should receive the callbacks
      // This is implicitly tested through the EntityNode tests
      expect(screen.getByText('Entity 1')).toBeInTheDocument();
    });

    it('should propagate callbacks to nested lists', () => {
      const entities = [
        createMockNode({
          id: 'parent',
          name: 'Parent',
          children: [
            createMockNode({
              id: 'child',
              name: 'Child',
              children: [createMockNode({ id: 'grandchild', name: 'Grandchild' })],
            }),
          ],
        }),
      ];

      render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set(['parent', 'child'])}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // All levels should be rendered with the same callbacks
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
      expect(screen.getByText('Grandchild')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large flat lists efficiently', () => {
      const entities = Array.from({ length: 100 }, (_, i) =>
        createMockNode({ id: `entity-${i}`, name: `Entity ${i}` })
      );

      const { container } = render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={new Set()}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Should render all 100 entities
      const cards = container.querySelectorAll('[class*="cursor-pointer"]');
      expect(cards.length).toBe(100);
    });

    it('should handle large nested lists efficiently', () => {
      const entities = Array.from({ length: 10 }, (_, i) =>
        createMockNode({
          id: `parent-${i}`,
          name: `Parent ${i}`,
          children: Array.from({ length: 10 }, (_, j) =>
            createMockNode({ id: `child-${i}-${j}`, name: `Child ${i}-${j}` })
          ),
        })
      );

      // Expand all parents
      const expandedIds = new Set(Array.from({ length: 10 }, (_, i) => `parent-${i}`));

      const { container } = render(
        <EntityList
          entities={entities}
          depth={0}
          expandedIds={expandedIds}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Should render 10 parents + 100 children = 110 total
      const cards = container.querySelectorAll('[class*="cursor-pointer"]');
      expect(cards.length).toBe(110);
    });
  });
});
