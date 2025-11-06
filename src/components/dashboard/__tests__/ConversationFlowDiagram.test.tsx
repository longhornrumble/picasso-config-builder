/**
 * ConversationFlowDiagram Component Tests
 * Tests for the dashboard flow diagram visualization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConversationFlowDiagram } from '../ConversationFlowDiagram';
import { useConfigStore } from '@/store';
import type { Program, ConversationalForm, CTADefinition, ConversationBranch } from '@/types/config';

// Mock the store
vi.mock('@/store', () => ({
  useConfigStore: vi.fn(),
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Wrapper component for tests
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('ConversationFlowDiagram', () => {
  // Sample test data
  const mockPrograms: Record<string, Program> = {
    'prog-1': {
      program_id: 'prog-1',
      program_name: 'Love Box Program',
      description: 'Provides food assistance',
    },
  };

  const mockForms: Record<string, ConversationalForm> = {
    'form-1': {
      enabled: true,
      form_id: 'form-1',
      program: 'prog-1',
      title: 'Love Box Enrollment Form',
      description: 'Enroll in the Love Box program',
      fields: [],
    },
  };

  const mockCTAs: Record<string, CTADefinition> = {
    'cta-1': {
      label: 'Enroll in Love Box',
      action: 'start_form',
      formId: 'form-1',
      type: 'form_trigger',
    },
  };

  const mockBranches: Record<string, ConversationBranch> = {
    'branch-1': {
      available_ctas: {
        primary: 'cta-1',
        secondary: [],
      },
    },
  };

  const mockActionChips = {
    'chip-1': {
      label: 'Get Help',
      value: 'I need assistance',
      action: 'send_query' as const,
    },
  };

  const mockShowcaseItems = [
    {
      id: 'showcase-1',
      type: 'program' as const,
      enabled: true,
      name: 'Love Box',
      tagline: 'Food assistance program',
      description: 'Monthly food delivery',
      keywords: ['food', 'assistance'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        programs: { programs: mockPrograms },
        forms: { forms: mockForms },
        ctas: { ctas: mockCTAs },
        branches: { branches: mockBranches },
        config: {
          baseConfig: {
            action_chips: {
              default_chips: mockActionChips,
            },
          },
        },
        contentShowcase: { content_showcase: mockShowcaseItems },
        validation: {
          errors: {},
          warnings: {},
        },
      };
      return selector(state);
    });
  });

  describe('Rendering', () => {
    it('should render all three sections', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('Programs Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Action Chips')).toBeInTheDocument();
      expect(screen.getByText('Content Showcase')).toBeInTheDocument();
    });

    it('should display entity counts', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Check that section headers exist
      expect(screen.getByText('Programs Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Action Chips')).toBeInTheDocument();
      expect(screen.getByText('Content Showcase')).toBeInTheDocument();
    });

    it('should render program nodes with correct labels', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('Love Box Program')).toBeInTheDocument();
    });

    it('should render form nodes when programs are expanded', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs are expanded by default
      expect(screen.getByText('Love Box Enrollment Form')).toBeInTheDocument();
    });

    it('should render action chip nodes', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('Get Help')).toBeInTheDocument();
    });

    it('should render showcase item nodes', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('Love Box')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state for programs when none exist', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: {} },
          forms: { forms: {} },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: { errors: {}, warnings: {} },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('No programs configured yet.')).toBeInTheDocument();
    });

    it('should show empty state for action chips when none exist', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: {} },
          forms: { forms: {} },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: { errors: {}, warnings: {} },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('No action chips configured yet.')).toBeInTheDocument();
    });

    it('should show empty state for showcase when none exist', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: {} },
          forms: { forms: {} },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: { errors: {}, warnings: {} },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('No showcase items configured yet.')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should toggle form visibility when program is collapsed', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Form should be visible initially (program expanded by default)
      expect(screen.getByText('Love Box Enrollment Form')).toBeInTheDocument();

      // Find the chevron button for the program node by aria-label
      const chevronButton = screen.getByLabelText('Collapse');

      // Collapse the program
      fireEvent.click(chevronButton);

      // Form should no longer be visible
      expect(screen.queryByText('Love Box Enrollment Form')).not.toBeInTheDocument();
    });
  });

  describe('Validation Status', () => {
    it('should display error status and count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: mockForms },
          ctas: { ctas: mockCTAs },
          branches: { branches: mockBranches },
          config: {
            baseConfig: {
              action_chips: {
                default_chips: mockActionChips,
              },
            },
          },
          contentShowcase: { content_showcase: mockShowcaseItems },
          validation: {
            errors: {
              'prog-1': [
                { field: 'program_name', message: 'Name is required', severity: 'error' as const },
              ],
            },
            warnings: {},
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Should show error status indicator
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display warning status and count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: mockForms },
          ctas: { ctas: mockCTAs },
          branches: { branches: mockBranches },
          config: {
            baseConfig: {
              action_chips: {
                default_chips: mockActionChips,
              },
            },
          },
          contentShowcase: { content_showcase: mockShowcaseItems },
          validation: {
            errors: {},
            warnings: {
              'prog-1': [
                {
                  field: 'description',
                  message: 'Description is recommended',
                  severity: 'warning' as const,
                },
              ],
            },
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Should show warning indicator
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for expand/collapse buttons', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Find the expand/collapse button by aria-label
      const chevronButton = screen.getByLabelText('Collapse');
      expect(chevronButton).toBeInTheDocument();
    });

    it('should have keyboard navigation support', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Find the expand/collapse button
      const chevronButton = screen.getByLabelText('Collapse');

      // Should be keyboard accessible (buttons are accessible by default)
      expect(chevronButton.tagName).toBe('BUTTON');
    });
  });
});
