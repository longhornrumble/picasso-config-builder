/**
 * Integration Tests - CTA Creation and Branch Assignment Workflow
 *
 * Tests the end-to-end workflow of creating CTAs and branches:
 * 1. Create CTAs with different action types
 * 2. Create branches with keyword detection
 * 3. Assign primary and secondary CTAs to branches
 * 4. Add/remove keywords dynamically
 * 5. Update CTA assignments
 * 6. Validate complete workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createTestProgram,
  createTestForm,
  resetIdCounter,
  extractValidationErrors,
} from './testUtils';

describe('CTA and Branch Workflow Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    // Reset store state
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.programs.programs = {};
      result.current.forms.forms = {};
      result.current.ctas.ctas = {};
      result.current.branches.branches = {};
      result.current.validation.isValid = true;
      result.current.validation.programResults = {};
      result.current.validation.formResults = {};
      result.current.validation.ctaResults = {};
      result.current.validation.branchResults = {};
    });
  });

  it('should create CTAs with all action types', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create form for form_trigger CTA
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      const form = createTestForm(programId, 3, { form_id: 'test-form' });
      result.current.forms.createForm(form);
      formId = form.form_id;
    });

    // Create form_trigger CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Start Application',
          action: 'start_form',
          formId: formId,
          type: 'form_trigger',
          style: 'primary',
        },
        'cta-form-trigger'
      );
    });

    // Create external_link CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Visit Website',
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'secondary',
        },
        'cta-external-link'
      );
    });

    // Create send_query CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Learn More',
          action: 'send_query',
          query: 'Tell me more about this program',
          type: 'bedrock_query',
          style: 'info',
        },
        'cta-send-query'
      );
    });

    // Create show_info CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Get Info',
          action: 'show_info',
          prompt: 'Show information about eligibility requirements',
          type: 'info_request',
          style: 'info',
        },
        'cta-show-info'
      );
    });

    // Verify all CTAs created
    const allCTAs = result.current.ctas.getAllCTAs();
    expect(allCTAs).toHaveLength(4);

    // Verify each CTA type
    const formTriggerCTA = result.current.ctas.getCTA('cta-form-trigger');
    expect(formTriggerCTA?.action).toBe('start_form');
    expect(formTriggerCTA?.formId).toBe(formId);

    const externalLinkCTA = result.current.ctas.getCTA('cta-external-link');
    expect(externalLinkCTA?.action).toBe('external_link');
    expect(externalLinkCTA?.url).toBe('https://example.com');

    const sendQueryCTA = result.current.ctas.getCTA('cta-send-query');
    expect(sendQueryCTA?.action).toBe('send_query');
    expect(sendQueryCTA?.query).toBeDefined();

    const showInfoCTA = result.current.ctas.getCTA('cta-show-info');
    expect(showInfoCTA?.action).toBe('show_info');
    expect(showInfoCTA?.prompt).toBeDefined();
  });

  it('should create branch and assign CTAs', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTAs
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Primary Action',
          action: 'send_query',
          query: 'primary query',
          type: 'bedrock_query',
          style: 'primary',
        },
        'cta-primary'
      );

      result.current.ctas.createCTA(
        {
          label: 'Secondary Action 1',
          action: 'send_query',
          query: 'secondary query 1',
          type: 'bedrock_query',
          style: 'secondary',
        },
        'cta-secondary-1'
      );

      result.current.ctas.createCTA(
        {
          label: 'Secondary Action 2',
          action: 'send_query',
          query: 'secondary query 2',
          type: 'bedrock_query',
          style: 'secondary',
        },
        'cta-secondary-2'
      );
    });

    // Create branch with primary CTA
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: ['volunteer', 'help', 'community service'],
          available_ctas: {
            primary: 'cta-primary',
            secondary: [],
          },
        },
        'branch-volunteer'
      );
    });

    // Verify branch created
    const branch = result.current.branches.getBranch('branch-volunteer');
    expect(branch).toBeDefined();
    expect(branch?.available_ctas.primary).toBe('cta-primary');
    expect(branch?.available_ctas.secondary).toHaveLength(0);
    expect(branch?.detection_keywords).toHaveLength(3);

    // Add secondary CTAs
    act(() => {
      result.current.branches.addSecondaryCTA('branch-volunteer', 'cta-secondary-1');
      result.current.branches.addSecondaryCTA('branch-volunteer', 'cta-secondary-2');
    });

    // Verify secondary CTAs added
    const updatedBranch = result.current.branches.getBranch('branch-volunteer');
    expect(updatedBranch?.available_ctas.secondary).toHaveLength(2);
    expect(updatedBranch?.available_ctas.secondary).toContain('cta-secondary-1');
    expect(updatedBranch?.available_ctas.secondary).toContain('cta-secondary-2');
  });

  it('should handle keyword management in branches', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA and branch
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Test CTA',
          action: 'send_query',
          query: 'test query',
          type: 'bedrock_query',
          style: 'primary',
        },
        'test-cta'
      );

      result.current.branches.createBranch(
        {
          detection_keywords: ['initial', 'keyword'],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'test-branch'
      );
    });

    // Verify initial keywords
    let branch = result.current.branches.getBranch('test-branch');
    expect(branch?.detection_keywords).toHaveLength(2);
    expect(branch?.detection_keywords).toContain('initial');

    // Add keyword
    act(() => {
      result.current.branches.addKeyword('test-branch', 'new keyword');
    });

    // Verify keyword added
    branch = result.current.branches.getBranch('test-branch');
    expect(branch?.detection_keywords).toHaveLength(3);
    expect(branch?.detection_keywords).toContain('new keyword');

    // Remove keyword
    act(() => {
      result.current.branches.removeKeyword('test-branch', 'initial');
    });

    // Verify keyword removed
    branch = result.current.branches.getBranch('test-branch');
    expect(branch?.detection_keywords).toHaveLength(2);
    expect(branch?.detection_keywords).not.toContain('initial');
  });

  it('should update primary CTA assignment', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTAs
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Original Primary',
          action: 'send_query',
          query: 'original',
          type: 'bedrock_query',
          style: 'primary',
        },
        'cta-original'
      );

      result.current.ctas.createCTA(
        {
          label: 'New Primary',
          action: 'send_query',
          query: 'new',
          type: 'bedrock_query',
          style: 'primary',
        },
        'cta-new'
      );
    });

    // Create branch
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'cta-original',
            secondary: [],
          },
        },
        'test-branch'
      );
    });

    // Verify original primary
    let branch = result.current.branches.getBranch('test-branch');
    expect(branch?.available_ctas.primary).toBe('cta-original');

    // Update primary CTA
    act(() => {
      result.current.branches.setPrimaryCTA('test-branch', 'cta-new');
    });

    // Verify new primary
    branch = result.current.branches.getBranch('test-branch');
    expect(branch?.available_ctas.primary).toBe('cta-new');
  });

  it('should remove secondary CTA', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTAs and branch
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Primary',
          action: 'send_query',
          query: 'primary',
          type: 'bedrock_query',
          style: 'primary',
        },
        'cta-primary'
      );

      result.current.ctas.createCTA(
        {
          label: 'Secondary 1',
          action: 'send_query',
          query: 'secondary 1',
          type: 'bedrock_query',
          style: 'secondary',
        },
        'cta-secondary-1'
      );

      result.current.ctas.createCTA(
        {
          label: 'Secondary 2',
          action: 'send_query',
          query: 'secondary 2',
          type: 'bedrock_query',
          style: 'secondary',
        },
        'cta-secondary-2'
      );

      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'cta-primary',
            secondary: ['cta-secondary-1', 'cta-secondary-2'],
          },
        },
        'test-branch'
      );
    });

    // Verify initial secondary CTAs
    let branch = result.current.branches.getBranch('test-branch');
    expect(branch?.available_ctas.secondary).toHaveLength(2);

    // Remove one secondary CTA
    act(() => {
      result.current.branches.removeSecondaryCTA('test-branch', 'cta-secondary-1');
    });

    // Verify removal
    branch = result.current.branches.getBranch('test-branch');
    expect(branch?.available_ctas.secondary).toHaveLength(1);
    expect(branch?.available_ctas.secondary).toContain('cta-secondary-2');
    expect(branch?.available_ctas.secondary).not.toContain('cta-secondary-1');
  });

  it('should validate CTA requires formId for start_form action', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA without formId
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Invalid CTA',
          action: 'start_form',
          // Missing formId
          type: 'form_trigger',
          style: 'primary',
        },
        'invalid-cta'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation fails
    expect(result.current.validation.isValid).toBe(false);
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('Form ID'))).toBe(true);
  });

  it('should validate CTA requires url for external_link action', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA without url
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Invalid Link',
          action: 'external_link',
          // Missing url
          type: 'external_link',
          style: 'primary',
        },
        'invalid-link-cta'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation fails
    expect(result.current.validation.isValid).toBe(false);
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('URL'))).toBe(true);
  });

  it('should validate branch requires primary CTA', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create branch without primary CTA
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: '', // Missing primary
            secondary: [],
          },
        },
        'invalid-branch'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation fails
    expect(result.current.validation.isValid).toBe(false);
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('primary CTA'))).toBe(true);
  });

  it('should validate branch requires keywords', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Test CTA',
          action: 'send_query',
          query: 'test',
          type: 'bedrock_query',
          style: 'primary',
        },
        'test-cta'
      );
    });

    // Create branch without keywords
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: [], // No keywords
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'invalid-branch'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation fails
    expect(result.current.validation.isValid).toBe(false);
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('keyword'))).toBe(true);
  });

  it('should duplicate CTA with all properties', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      const form = createTestForm(programId, 3, { form_id: 'test-form' });
      result.current.forms.createForm(form);
      formId = form.form_id;
    });

    // Create CTA
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Original CTA',
          action: 'start_form',
          formId: formId,
          type: 'form_trigger',
          style: 'primary',
        },
        'original-cta'
      );
    });

    // Duplicate CTA
    act(() => {
      result.current.ctas.duplicateCTA('original-cta');
    });

    // Verify duplicate
    const allCTAs = result.current.ctas.getAllCTAs();
    expect(allCTAs).toHaveLength(2);

    const duplicate = allCTAs.find((c) => c.id !== 'original-cta');
    expect(duplicate).toBeDefined();
    expect(duplicate!.cta.label).toContain('Copy');
    expect(duplicate!.cta.action).toBe('start_form');
    expect(duplicate!.cta.formId).toBe(formId);
  });

  it('should duplicate branch with all keywords and CTAs', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTAs
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Primary',
          action: 'send_query',
          query: 'primary',
          type: 'bedrock_query',
          style: 'primary',
        },
        'cta-primary'
      );

      result.current.ctas.createCTA(
        {
          label: 'Secondary',
          action: 'send_query',
          query: 'secondary',
          type: 'bedrock_query',
          style: 'secondary',
        },
        'cta-secondary'
      );
    });

    // Create branch
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: ['keyword1', 'keyword2', 'keyword3'],
          available_ctas: {
            primary: 'cta-primary',
            secondary: ['cta-secondary'],
          },
        },
        'original-branch'
      );
    });

    // Duplicate branch
    act(() => {
      result.current.branches.duplicateBranch('original-branch');
    });

    // Verify duplicate
    const allBranches = result.current.branches.getAllBranches();
    expect(allBranches).toHaveLength(2);

    const duplicate = allBranches.find((b) => b.id !== 'original-branch');
    expect(duplicate).toBeDefined();
    expect(duplicate!.branch.detection_keywords).toHaveLength(3);
    expect(duplicate!.branch.available_ctas.primary).toBe('cta-primary');
    expect(duplicate!.branch.available_ctas.secondary).toContain('cta-secondary');
  });
});
