/**
 * EntityNode Component Tests
 * Tests for the EntityNode rendering component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityNode } from '../EntityNode';
import type { TreeNode, EntityType } from '../types';

describe('EntityNode Component', () => {
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
    it('should render node with name', () => {
      const node = createMockNode();
      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should render node type label', () => {
      const node = createMockNode();
      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Program')).toBeInTheDocument();
    });

    it('should render entity icon', () => {
      const node = createMockNode();
      const { container } = render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Check for icon SVG element
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct depth indentation', () => {
      const node = createMockNode();
      const { container } = render(
        <EntityNode
          node={node}
          depth={2}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // The Card component receives style prop with marginLeft
      const card = container.querySelector('div[style]');
      expect(card).toBeInTheDocument();
      expect(card?.getAttribute('style')).toContain('48px'); // 2 * 24px
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should show chevron when node has children', () => {
      const node = createMockNode({
        children: [createMockNode({ id: 'child-1' })],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      const button = screen.getByLabelText('Expand');
      expect(button).toBeInTheDocument();
    });

    it('should hide chevron when node has no children', () => {
      const node = createMockNode({ children: [] });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Button should still exist but be invisible
      const button = screen.getByLabelText('Expand');
      expect(button).toHaveClass('invisible');
    });

    it('should show ChevronRight when collapsed', () => {
      const node = createMockNode({
        children: [createMockNode({ id: 'child-1' })],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByLabelText('Expand')).toBeInTheDocument();
    });

    it('should show ChevronDown when expanded', () => {
      const node = createMockNode({
        children: [createMockNode({ id: 'child-1' })],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
    });

    it('should call onToggleExpand when chevron is clicked', () => {
      const node = createMockNode({
        id: 'toggle-test',
        children: [createMockNode({ id: 'child-1' })],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      const button = screen.getByLabelText('Expand');
      fireEvent.click(button);

      expect(mockOnToggleExpand).toHaveBeenCalledWith('toggle-test');
      expect(mockOnToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('should not call onToggleExpand when node has no children', () => {
      const node = createMockNode({ children: [] });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      const button = screen.getByLabelText('Expand');
      fireEvent.click(button);

      expect(mockOnToggleExpand).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate when node is clicked', () => {
      const node = createMockNode({ id: 'nav-test', type: 'program' });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      const card = screen.getByText('Test Node').closest('div')?.parentElement;
      if (card) {
        fireEvent.click(card);
      }

      expect(mockOnNavigate).toHaveBeenCalledWith('program', 'nav-test');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not call onNavigate when chevron is clicked', () => {
      const node = createMockNode({
        children: [createMockNode({ id: 'child-1' })],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      const button = screen.getByLabelText('Expand');
      fireEvent.click(button);

      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Validation Status', () => {
    it('should show error badge when node has errors', () => {
      const node = createMockNode({
        validationStatus: 'error',
        errorCount: 3,
        warningCount: 0,
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show warning badge when node has warnings only', () => {
      const node = createMockNode({
        validationStatus: 'warning',
        errorCount: 0,
        warningCount: 2,
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show success icon when node is valid', () => {
      const node = createMockNode({
        validationStatus: 'success',
        errorCount: 0,
        warningCount: 0,
      });

      const { container } = render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Success icon should be rendered
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should prioritize errors over warnings in display', () => {
      const node = createMockNode({
        validationStatus: 'error',
        errorCount: 1,
        warningCount: 2,
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Should show error count, not warning count
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  describe('Children Count Badge', () => {
    it('should show children count when node has children', () => {
      const node = createMockNode({
        children: [
          createMockNode({ id: 'child-1' }),
          createMockNode({ id: 'child-2' }),
          createMockNode({ id: 'child-3' }),
        ],
      });

      render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show children count when node has no children', () => {
      const node = createMockNode({ children: [] });

      const { container } = render(
        <EntityNode
          node={node}
          depth={0}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onNavigate={mockOnNavigate}
        />
      );

      // Should not have a badge element for children count
      const badges = container.querySelectorAll('.rounded-full');
      const childCountBadge = Array.from(badges).find((badge) =>
        badge.classList.contains('bg-gray-200')
      );
      expect(childCountBadge).toBeUndefined();
    });
  });

  describe('Different Entity Types', () => {
    const entityTypes: EntityType[] = ['program', 'form', 'cta', 'branch', 'actionChip', 'showcase'];

    entityTypes.forEach((type) => {
      it(`should render ${type} node correctly`, () => {
        const node = createMockNode({ type });

        const { container } = render(
          <EntityNode
            node={node}
            depth={0}
            isExpanded={false}
            onToggleExpand={mockOnToggleExpand}
            onNavigate={mockOnNavigate}
          />
        );

        expect(screen.getByText('Test Node')).toBeInTheDocument();
        // Should have entity-specific styling
        const card = container.querySelector('div[class*="border-l-4"]');
        expect(card).toBeInTheDocument();
      });
    });
  });
});
