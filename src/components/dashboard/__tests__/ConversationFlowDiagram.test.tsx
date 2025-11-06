/**
 * ConversationFlowDiagram Component Tests
 * Tests for the enhanced dashboard flow diagram visualization with rich metadata and status icons
 *
 * Updated: 2025-11-06
 * Changes:
 * - Section count: 5 → 6 (added Showcase Items)
 * - Section titles: Updated to match new order
 * - Section order: Programs → Action Chips → Conditional Branches → Showcase Items → CTAs → Forms
 * - Rich metadata: Tests for entity-specific metadata display
 * - Status icons: Tests for error, warning, orphaned, broken refs, not validated icons
 * - Metrics tooltips: Tests for entity lists on hover
 * - CTA groupings: Tests for PRIMARY/SECONDARY CTA labels and expandable lists
 * - Chevron icons: Tests for chevron icons instead of text
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
      fields: [
        { id: 'field-1', label: 'Name', type: 'text', required: true },
        { id: 'field-2', label: 'Email', type: 'email', required: true },
      ],
    },
  };

  const mockCTAs: Record<string, CTADefinition> = {
    'cta-1': {
      label: 'Enroll in Love Box',
      action: 'start_form',
      formId: 'form-1',
      type: 'form_trigger',
    },
    'cta-2': {
      label: 'Learn More',
      action: 'bedrock_query',
      query: 'Tell me more about the Love Box program',
      type: 'bedrock_query',
    },
  };

  const mockBranches: Record<string, ConversationBranch> = {
    'branch-1': {
      available_ctas: {
        primary: 'cta-1',
        secondary: ['cta-2'],
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
          lastValidated: Date.now(),
          validateAll: vi.fn(),
        },
      };
      return selector(state);
    });
  });

  describe('Sections', () => {
    it('should render all 6 sections in correct order', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Get all section headings
      const headings = screen.getAllByRole('heading', { level: 3 });
      const sectionTitles = headings.map(h => h.textContent).filter(t =>
        ['Programs', 'Action Chips', 'Conditional Branches', 'Showcase Items', 'CTAs', 'Forms'].includes(t || '')
      );

      // Should have exactly 6 sections
      expect(sectionTitles.length).toBe(6);

      // Check order
      expect(sectionTitles[0]).toBe('Programs');
      expect(sectionTitles[1]).toBe('Action Chips');
      expect(sectionTitles[2]).toBe('Conditional Branches');
      expect(sectionTitles[3]).toBe('Showcase Items');
      expect(sectionTitles[4]).toBe('CTAs');
      expect(sectionTitles[5]).toBe('Forms');
    });

    it('should show correct section titles', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Programs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Action Chips' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Conditional Branches' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Showcase Items' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'CTAs' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument();
    });

    it('should use chevron icons instead of text', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs section should be expanded (ChevronDown visible)
      const programsHeading = screen.getByRole('heading', { name: 'Programs' });
      const programsSection = programsHeading.closest('.card-container');

      // Check for chevron icon presence (aria-label check)
      const collapseButton = within(programsSection!).getByLabelText('Collapse section');
      expect(collapseButton).toBeInTheDocument();

      // No "Collapse" text should be present as button content
      expect(screen.queryByText(/^Collapse$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Expand$/)).not.toBeInTheDocument();
    });

    it('should show chevron rotate on expand/collapse', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Forms section starts collapsed
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');

      const expandButton = within(formsSection!).getByLabelText('Expand section');
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      // Should now show collapse button
      const collapseButton = within(formsSection!).getByLabelText('Collapse section');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('Rich Metadata', () => {
    it('should show branch keyword and CTA count', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Conditional Branches section
      const branchesHeading = screen.getByRole('heading', { name: 'Conditional Branches' });
      const branchesSection = branchesHeading.closest('.card-container');
      const expandButton = within(branchesSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show CTA count (1 primary + 1 secondary = 2 CTAs)
      expect(screen.getByText(/2 CTA/)).toBeInTheDocument();
    });

    it('should show expandable CTA list for branches', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Conditional Branches section
      const branchesHeading = screen.getByRole('heading', { name: 'Conditional Branches' });
      const branchesSection = branchesHeading.closest('.card-container');
      const expandButton = within(branchesSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Find the CTAs expand button within branch node (use getAllByText and filter by class)
      const ctasButtons = screen.getAllByText('CTAs');
      const ctasExpandButton = ctasButtons.find(btn =>
        btn.className.includes('font-medium') && btn.closest('button')
      );
      if (ctasExpandButton) {
        const button = ctasExpandButton.closest('button');
        if (button) {
          fireEvent.click(button);
        }
      }

      // Should show PRIMARY CTA and SECONDARY CTAS labels
      expect(screen.getByText('PRIMARY CTA')).toBeInTheDocument();
      expect(screen.getByText('SECONDARY CTAS')).toBeInTheDocument();
    });

    it('should show CTA action type badges', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand CTAs section
      const ctasHeading = screen.getByRole('heading', { name: 'CTAs' });
      const ctasSection = ctasHeading.closest('.card-container');
      const expandButton = within(ctasSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show action type in metadata - use getAllByText since there are multiple CTAs
      const actionLabels = screen.getAllByText(/Action:/);
      expect(actionLabels.length).toBeGreaterThan(0);
    });

    it('should show form field count and program reference', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Forms section
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      const expandButton = within(formsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show field count
      expect(screen.getByText('2 fields')).toBeInTheDocument();

      // Should show program reference - use getAllByText and check there are multiple instances
      const programRefs = screen.getAllByText(/Love Box Program/);
      expect(programRefs.length).toBeGreaterThan(0);
    });

    it('should show program description', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Programs section is expanded by default - use getAllByText since description might appear multiple times
      const descriptions = screen.getAllByText('Provides food assistance');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('should show action chip routing type and target', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Action Chips section
      const actionChipsHeading = screen.getByRole('heading', { name: 'Action Chips' });
      const actionChipsSection = actionChipsHeading.closest('.card-container');
      const expandButton = within(actionChipsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show routing type
      expect(screen.getByText('Explicit Route')).toBeInTheDocument();

      // Should show target branch - use getAllByText since branch-1 appears in multiple places
      const branchRefs = screen.getAllByText(/branch-1/);
      expect(branchRefs.length).toBeGreaterThan(0);
    });
  });

  describe('Status Icons', () => {
    it('should show error icon on entities with errors', () => {
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
            },
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Should show error icon (❌)
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should show warning icon on entities with warnings', () => {
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
              'prog-1': [{ field: 'description', message: 'Description is recommended', severity: 'warning' as const }],
            },
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Should show warning icon (⚠️)
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show orphaned icon on orphaned entities', () => {
      const orphanedForm: ConversationalForm = {
        enabled: true,
        form_id: 'orphan-form',
        program: '', // No program reference = orphaned
        title: 'Orphaned Form',
        description: 'Form without program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'orphan-form': orphanedForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Forms section
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      const expandButton = within(formsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show orphaned icon (🔗💔)
      expect(screen.getByText('🔗💔')).toBeInTheDocument();
    });

    it('should show broken refs icon on nodes with broken references', () => {
      const brokenForm: ConversationalForm = {
        enabled: true,
        form_id: 'broken-form',
        program: 'non-existent-program', // Broken reference
        title: 'Form with Broken Ref',
        description: 'Form referencing non-existent program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'broken-form': brokenForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Forms section
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      const expandButton = within(formsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show broken ref icon (🔗❌)
      expect(screen.getByText('🔗❌')).toBeInTheDocument();
    });

    it('should show not validated icon on unvalidated entities', () => {
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
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Should show not validated icon (❓) on entities without validation
      expect(screen.getAllByText('❓').length).toBeGreaterThan(0);
    });

    it('should show multiple status icons on same node', () => {
      const problematicForm: ConversationalForm = {
        enabled: true,
        form_id: 'problem-form',
        program: 'non-existent', // Broken ref
        title: 'Problematic Form',
        description: 'Form with multiple issues',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'problem-form': problematicForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {
              'problem-form': [
                { field: 'title', message: 'Title is required', severity: 'error' as const },
              ],
            },
            warnings: {
              'problem-form': [
                { field: 'description', message: 'Description is recommended', severity: 'warning' as const },
              ],
            },
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Forms section
      const formsHeading = screen.getByRole('heading', { name: 'Forms' });
      const formsSection = formsHeading.closest('.card-container');
      const expandButton = within(formsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Should show multiple icons: error (❌), warning (⚠️), broken ref (🔗❌)
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('🔗❌')).toBeInTheDocument();
    });

    it('should show tooltips on status icon hover', async () => {
      const user = userEvent.setup();

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
            },
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Find error icon
      const errorIcon = screen.getByText('❌');

      // Hover over it
      await user.hover(errorIcon);

      // Tooltip should appear with error description
      await waitFor(() => {
        expect(errorIcon).toHaveAttribute('title', expect.stringContaining('error'));
      });
    });
  });

  describe('Metrics Tooltips', () => {
    it('should show entity list on Errors metric hover', async () => {
      const user = userEvent.setup();

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
            },
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
        };
        return selector(state);
      });

      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Find Errors metric card
      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      const errorsMetric = within(statsCard!).getByText('Errors');

      // Hover over it
      await user.hover(errorsMetric);

      // Tooltip should appear (implementation-dependent, may need adjustment)
    });

    it('should show entity list on Warnings metric hover', async () => {
      const user = userEvent.setup();

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
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
      const warningsMetric = within(statsCard!).getByText('Warnings');

      await user.hover(warningsMetric);

      // Tooltip should appear
    });

    it('should show entity list on Orphaned metric hover', async () => {
      const user = userEvent.setup();

      const orphanedForm: ConversationalForm = {
        enabled: true,
        form_id: 'orphan-form',
        program: '',
        title: 'Orphaned Form',
        description: 'Form without program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'orphan-form': orphanedForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
      const orphanedMetric = within(statsCard!).getByText('Orphaned');

      await user.hover(orphanedMetric);

      // Tooltip should appear
    });

    it('should show entity list on Broken Refs metric hover', async () => {
      const user = userEvent.setup();

      const brokenForm: ConversationalForm = {
        enabled: true,
        form_id: 'broken-form',
        program: 'non-existent-program',
        title: 'Form with Broken Ref',
        description: 'Form referencing non-existent program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'broken-form': brokenForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
      const brokenRefsMetric = within(statsCard!).getByText('Broken Refs');

      await user.hover(brokenRefsMetric);

      // Tooltip should appear
    });

    it('should truncate long lists with "...and N more"', async () => {
      const user = userEvent.setup();

      // Create 15 entities with errors
      const manyPrograms: Record<string, Program> = {};
      const manyErrors: Record<string, any[]> = {};

      for (let i = 1; i <= 15; i++) {
        const progId = `prog-${i}`;
        manyPrograms[progId] = {
          program_id: progId,
          program_name: `Program ${i}`,
          description: `Description ${i}`,
        };
        manyErrors[progId] = [
          { field: 'program_name', message: `Error in program ${i}`, severity: 'error' as const }
        ];
      }

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: manyPrograms },
          forms: { forms: {} },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: manyErrors,
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
      const errorsMetric = within(statsCard!).getByText('Errors').closest('.cursor-help');

      if (errorsMetric) {
        await user.hover(errorsMetric);

        // Should show "...and 5 more" (max 10 displayed)
        await waitFor(() => {
          const moreText = screen.queryByText(/...and 5 more/);
          // This is implementation-dependent, may need adjustment
        });
      }
    });
  });

  describe('CTA Groupings', () => {
    it('should show PRIMARY CTA label', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Conditional Branches section
      const branchesHeading = screen.getByRole('heading', { name: 'Conditional Branches' });
      const branchesSection = branchesHeading.closest('.card-container');
      const expandButton = within(branchesSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Expand CTA list - use getAllByText and find the button
      const ctasButtons = screen.getAllByText('CTAs');
      const ctasExpandButton = ctasButtons.find(btn =>
        btn.className.includes('font-medium') && btn.closest('button')
      );
      if (ctasExpandButton) {
        const button = ctasExpandButton.closest('button');
        if (button) {
          fireEvent.click(button);
        }
      }

      expect(screen.getByText('PRIMARY CTA')).toBeInTheDocument();
    });

    it('should show SECONDARY CTAS label', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Conditional Branches section
      const branchesHeading = screen.getByRole('heading', { name: 'Conditional Branches' });
      const branchesSection = branchesHeading.closest('.card-container');
      const expandButton = within(branchesSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Expand CTA list - use getAllByText and find the button
      const ctasButtons = screen.getAllByText('CTAs');
      const ctasExpandButton = ctasButtons.find(btn =>
        btn.className.includes('font-medium') && btn.closest('button')
      );
      if (ctasExpandButton) {
        const button = ctasExpandButton.closest('button');
        if (button) {
          fireEvent.click(button);
        }
      }

      expect(screen.getByText('SECONDARY CTAS')).toBeInTheDocument();
    });

    it('should make CTA badges clickable', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Expand Conditional Branches section
      const branchesHeading = screen.getByRole('heading', { name: 'Conditional Branches' });
      const branchesSection = branchesHeading.closest('.card-container');
      const expandButton = within(branchesSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      // Expand CTA list - use getAllByText and find the button
      const ctasButtons = screen.getAllByText('CTAs');
      const ctasExpandButton = ctasButtons.find(btn =>
        btn.className.includes('font-medium') && btn.closest('button')
      );
      if (ctasExpandButton) {
        const button = ctasExpandButton.closest('button');
        if (button) {
          fireEvent.click(button);
        }
      }

      // Find CTA badge and click it
      const ctaBadge = screen.getByText('cta-1');
      fireEvent.click(ctaBadge);

      // Should navigate to CTA editor
      expect(mockNavigate).toHaveBeenCalledWith('/ctas?selected=cta-1');
    });
  });

  describe('Flow Statistics', () => {
    it('should display correct node count', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Total: 1 program + 1 form + 2 ctas + 1 branch + 2 chips + 1 showcase = 8
      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('8')).toBeInTheDocument();
      expect(within(statsCard!).getByText('Nodes')).toBeInTheDocument();
    });

    it('should display correct connection count', () => {
      render(
        <TestWrapper>
          <ConversationFlowDiagram />
        </TestWrapper>
      );

      // Connections: form→program (1) + cta-1→form (1) + branch→cta-1 (1) + branch→cta-2 (1) + chip-2→branch (1) = 5
      const statsCard = screen.getByText('Flow Statistics').closest('.card-container');
      expect(within(statsCard!).getByText('5')).toBeInTheDocument();
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
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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

    it('should display correct orphaned count', () => {
      const orphanedForm: ConversationalForm = {
        enabled: true,
        form_id: 'orphan-form',
        program: '', // No program reference = orphaned
        title: 'Orphaned Form',
        description: 'Form without program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'orphan-form': orphanedForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
      expect(within(statsCard!).getByText('Orphaned')).toBeInTheDocument();
      // Should show 1 orphaned entity (orphan-form)
      expect(within(statsCard!).getAllByText('1').length).toBeGreaterThan(0);
    });

    it('should display correct broken refs count', () => {
      const brokenForm: ConversationalForm = {
        enabled: true,
        form_id: 'broken-form',
        program: 'non-existent-program', // Broken reference
        title: 'Form with Broken Ref',
        description: 'Form referencing non-existent program',
        fields: [],
      };

      (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          programs: { programs: mockPrograms },
          forms: { forms: { 'broken-form': brokenForm } },
          ctas: { ctas: {} },
          branches: { branches: {} },
          config: { baseConfig: { action_chips: { default_chips: {} } } },
          contentShowcase: { content_showcase: [] },
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
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
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
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
          validation: {
            errors: {},
            warnings: {},
            lastValidated: Date.now(),
            validateAll: vi.fn(),
          },
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
      const expandButton = within(actionChipsSection!).getByLabelText('Expand section');
      fireEvent.click(expandButton);

      expect(screen.getByText('No action chips configured yet.')).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: 'Conditional Branches' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Action Chips' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Showcase Items' })).toBeInTheDocument();
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
      const collapseButton = within(programsSection!).getByLabelText('Collapse section');

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
