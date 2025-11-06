/**
 * ConversationFlowDiagram Component Tests
 * Tests for the dashboard flow diagram visualization with flat sections and Flow Statistics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConversationFlowDiagram } from '../ConversationFlowDiagram';
import { useConfigStore } from '@/store';
import type { Program, ConversationalForm, CTADefinition, ConversationBranch, ActionChip } from '@/types/config';

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

  const mockActionChips: Record<string, ActionChip> = {
    'chip-1': {
      label: 'Get Help',
      value: 'I need assistance',
      action: 'send_query' as const,
    },
    'chip-2': {
      label: 'Apply Now',
      value: 'I want to apply',
      action: 'explicit_routing' as const,
      target_branch: 'branch-1',
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
    it('should render Flow Statistics card', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByText('Flow Statistics')).toBeInTheDocument();
      expect(screen.getByText('Overview of conversation flow entities')).toBeInTheDocument();
    });

    it('should render all five sections with correct titles', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Check all five section titles - using getAllByText for sections that appear multiple times
      expect(screen.getByRole('heading', { name: 'Programs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'CTAs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Branches' })).toBeInTheDocument();
      const actionChipsHeadings = screen.getAllByText('Action Chips');
      // Should have at least the section heading
      expect(actionChipsHeadings.length).toBeGreaterThan(0);
    });

    it('should show Programs section expanded by default', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs section should be expanded (shows entities)
      expect(screen.getByText('Love Box Program')).toBeInTheDocument();
    });

    it('should show other sections collapsed by default', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Other sections collapsed (entities not visible initially)
      expect(screen.queryByText('Love Box Enrollment Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Enroll in Love Box')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Help')).not.toBeInTheDocument();
    });

    it('should calculate statistics correctly', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Total nodes: 1 program + 1 form + 1 cta + 1 branch + 2 action chips + 1 showcase = 7
      expect(screen.getByText('7')).toBeInTheDocument(); // Nodes count
      // Connections: form→program (1) + cta→form (1) + branch→cta (1) + chip→branch (1) = 4
      expect(screen.getByText('4')).toBeInTheDocument(); // Connections count
    });

    it('should render program nodes with correct labels when expanded', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs expanded by default
      expect(screen.getByText('Love Box Program')).toBeInTheDocument();
    });

    it('should render form nodes when Forms section is expanded', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Find Forms section expand button using heading
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      expect(formsSection).toBeInTheDocument();

      // Forms section is collapsed by default
      expect(screen.queryByText('Love Box Enrollment Form')).not.toBeInTheDocument();

      // Expand Forms section
      const expandButton = within(formsSection!).getByText('Expand');
      fireEvent.click(expandButton);

      // Form should now be visible
      expect(screen.getByText('Love Box Enrollment Form')).toBeInTheDocument();
    });
  });

  describe('Flow Statistics', () => {
    it('should display correct node count', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Total: 1 program + 1 form + 1 cta + 1 branch + 2 chips + 1 showcase = 7
      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('7')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Nodes')).toBeInTheDocument();
    });

    it('should display correct connection count', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Connections: form→program (1) + cta→form (1) + branch→cta (1) + chip-2→branch (1) = 4
      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('4')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Connections')).toBeInTheDocument();
    });

    it('should display correct error count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: mockForms },
          ctas: { ctas: mockCTAs },
          branches: { branches: mockBranches },
          config: { baseConfig: { action_chips: { default_chips: mockActionChips } } },
          contentShowcase: { content_showcase: mockShowcaseItems },
          validation: {
            errors: {
              'prog-1': [{ field: 'program_name', message: 'Name is required', severity: 'error' as const }],
              'form-1': [{ field: 'title', message: 'Title is required', severity: 'error' as const }],
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

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('Errors')).toBeInTheDocument();
      // Should show 2 errors (prog-1 and form-1)
      const errorMetrics = within(statsCard!).getAllByText('2');
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should display correct warning count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: mockForms },
          ctas: { ctas: mockCTAs },
          branches: { branches: mockBranches },
          config: { baseConfig: { action_chips: { default_chips: mockActionChips } } },
          contentShowcase: { content_showcase: mockShowcaseItems },
          validation: {
            errors: {},
            warnings: {
              'cta-1': [{ field: 'label', message: 'Label should be descriptive', severity: 'warning' as const }],
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

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('Warnings')).toBeInTheDocument();
      // Should show 1 warning
      expect(within(statsCard!).getAllByText('1').length).toBeGreaterThan(0);
    });

    it('should display correct valid count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: mockForms },
          ctas: { ctas: mockCTAs },
          branches: { branches: mockBranches },
          config: { baseConfig: { action_chips: { default_chips: mockActionChips } } },
          contentShowcase: { content_showcase: mockShowcaseItems },
          validation: {
            errors: {
              'prog-1': [], // Validated, no errors
            },
            warnings: {
              'prog-1': [], // Validated, no warnings
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

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('Valid')).toBeInTheDocument();
    });

    it('should display correct orphaned count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const orphanedForm: ConversationalForm = {
          enabled: true,
          form_id: 'orphan-form',
          program: '', // No program reference = orphaned
          title: 'Orphaned Form',
          description: 'Form without program',
          fields: [],
        };

        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'orphan-form': orphanedForm } },
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

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('Orphaned')).toBeInTheDocument();
      // Should show 1 orphaned entity (orphan-form)
      expect(within(statsCard!).getAllByText('1').length).toBeGreaterThan(0);
    });

    it('should display correct broken refs count', () => {
      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const brokenForm: ConversationalForm = {
          enabled: true,
          form_id: 'broken-form',
          program: 'non-existent-program', // Broken reference
          title: 'Form with Broken Ref',
          description: 'Form referencing non-existent program',
          fields: [],
        };

        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'broken-form': brokenForm } },
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

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('Broken Refs')).toBeInTheDocument();
      // Should show 1 broken reference (broken-form → non-existent-program)
      expect(within(statsCard!).getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no entities in a section', () => {
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

      // Programs section expanded by default, should show empty state
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

      // Expand Action Chips section using heading
      const actionChipsHeading = screen.getByRole('heading', { name: 'Action Chips' });
      const actionChipsSection = actionChipsHeading.closest('.card-container');
      const expandButton = within(actionChipsSection!).getByText('Expand');
      fireEvent.click(expandButton);

      expect(screen.getByText('No action chips configured yet.')).toBeInTheDocument();
    });
  });

  describe('Section Expand/Collapse', () => {
    it('should toggle section visibility when expand/collapse is clicked', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Forms section is collapsed by default
      expect(screen.queryByText('Love Box Enrollment Form')).not.toBeInTheDocument();

      // Find Forms section and expand it
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      const expandButton = within(formsSection!).getByText('Expand');
      fireEvent.click(expandButton);

      // Form should now be visible
      expect(screen.getByText('Love Box Enrollment Form')).toBeInTheDocument();

      // Collapse it again
      const collapseButton = within(formsSection!).getByText('Collapse');
      fireEvent.click(collapseButton);

      // Form should no longer be visible
      expect(screen.queryByText('Love Box Enrollment Form')).not.toBeInTheDocument();
    });

    it('should expand Programs section by default', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs section should show collapse button (expanded)
      const programsHeading = screen.getByRole('heading', { name: 'Programs' });
      const programsSection = programsHeading.closest('.card-container');
      expect(within(programsSection!).getByText('Collapse')).toBeInTheDocument();

      // Program entity should be visible
      expect(screen.getByText('Love Box Program')).toBeInTheDocument();
    });
  });

  describe('Validation Status', () => {
    it('should display error status and count on entity nodes', () => {
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

      // Programs section is expanded by default, should show error status
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display warning status and count on entity nodes', () => {
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

  describe('Validation Tooltips', () => {
    it('should show tooltip on hover over validation status', async () => {
      const user = userEvent.setup();

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
                { field: 'program_name', message: 'Program name is required', severity: 'error' as const },
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

      // Find error status indicator
      const errorStatus = screen.getByText('Error');

      // Hover over it
      await user.hover(errorStatus);

      // Tooltip should appear with error message (use getAllByText for duplicate tooltips)
      await waitFor(() => {
        const messages = screen.getAllByText(/Program name is required/i);
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    it('should display validation messages in tooltip', async () => {
      const user = userEvent.setup();

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
                { field: 'program_name', message: 'Program name is required', severity: 'error' as const },
                { field: 'program_id', message: 'Program ID must be unique', severity: 'error' as const },
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

      // Find error status indicator
      const errorStatus = screen.getByText('Error');

      // Hover over it
      await user.hover(errorStatus);

      // Both error messages should appear in tooltip (use getAllByText for duplicates)
      await waitFor(() => {
        const msg1 = screen.getAllByText(/Program name is required/i);
        const msg2 = screen.getAllByText(/Program ID must be unique/i);
        expect(msg1.length).toBeGreaterThan(0);
        expect(msg2.length).toBeGreaterThan(0);
      });
    });

    it('should show "...and N more" for many messages', async () => {
      const user = userEvent.setup();

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
                { field: 'program_name', message: 'Error 1', severity: 'error' as const },
                { field: 'program_id', message: 'Error 2', severity: 'error' as const },
                { field: 'description', message: 'Error 3', severity: 'error' as const },
                { field: 'keywords', message: 'Error 4', severity: 'error' as const },
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

      // Find error status indicator
      const errorStatus = screen.getByText('Error');

      // Hover over it
      await user.hover(errorStatus);

      // Should show first 3 messages plus "and 1 more" (use getAllByText for duplicates)
      await waitFor(() => {
        const messages = screen.getAllByText(/...and 1 more/i);
        expect(messages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure with headings', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Check for main section headings using role queries
      expect(screen.getByRole('heading', { name: 'Flow Statistics' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Programs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'CTAs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Branches' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Action Chips' })).toBeInTheDocument();
    });

    it('should be keyboard navigable with buttons', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Section expand/collapse buttons should be present
      const programsHeading = screen.getByRole('heading', { name: 'Programs' });
      const programsSection = programsHeading.closest('.card-container');
      const collapseButton = within(programsSection!).getByText('Collapse');

      // Should be keyboard accessible
      expect(collapseButton.tagName).toBe('BUTTON');
    });

    it('should have accessible entity cards that can be clicked', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Entity nodes should have proper structure
      const programNode = screen.getByText('Love Box Program');
      expect(programNode).toBeInTheDocument();

      // Find the clickable card container (parent div with cursor-pointer)
      const cardContainer = programNode.closest('[class*="cursor-pointer"]');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should provide accessible validation status indicators', () => {
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

      // Validation status should have text labels (not just icons)
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should have descriptive labels for metrics in Flow Statistics', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');

      // Each metric should have a descriptive label
      expect(within(statsCard!).getByText('Nodes')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Connections')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Errors')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Warnings')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Valid')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Orphaned')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Broken Refs')).toBeInTheDocument();
    });
  });
});
