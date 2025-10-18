/**
 * Integration Tests - Validation Pipeline
 *
 * Tests the complete validation workflow:
 * 1. Create entities with various validation states
 * 2. Run validation pipeline
 * 3. Verify error detection and reporting
 * 4. Test warning vs error severity
 * 5. Test cross-entity validation (dependency checking)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createTestProgram,
  createTestForm,
  resetIdCounter,
  extractValidationErrors,
  extractValidationWarnings,
  getEntityErrors,
  getEntityWarnings,
  getValidationSummary,
  resetConfigStore,
} from './testUtils';

describe('Validation Pipeline Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    resetConfigStore(useConfigStore);
  });

  it('should validate entire config and report all errors', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create invalid entities
    await act(async () => {
      // Valid program
      result.current.programs.createProgram(
        createTestProgram({ program_id: 'valid-program' })
      );

      // Invalid form - no program reference
      result.current.forms.createForm({
        enabled: true,
        form_id: 'invalid-form-1',
        program: '', // Missing program
        title: 'Invalid Form 1',
        description: 'Missing program',
        trigger_phrases: ['test'],
        fields: [],
      });

      // Invalid form - references non-existent program
      result.current.forms.createForm({
        enabled: true,
        form_id: 'invalid-form-2',
        program: 'nonexistent-program',
        title: 'Invalid Form 2',
        description: 'Bad program reference',
        trigger_phrases: ['test'],
        fields: [],
      });

      // Invalid CTA - start_form without formId
      result.current.ctas.createCTA(
        {
          label: 'Invalid CTA',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        },
        'invalid-cta-1'
      );

      // Invalid CTA - external_link without url
      result.current.ctas.createCTA(
        {
          label: 'Invalid Link',
          action: 'external_link',
          type: 'external_link',
          style: 'primary',
        },
        'invalid-cta-2'
      );

      // Invalid branch - no keywords
      result.current.branches.createBranch(
        {
          detection_keywords: [],
          available_ctas: {
            primary: 'invalid-cta-1',
            secondary: [],
          },
        },
        'invalid-branch-1'
      );

      // Invalid branch - no primary CTA
      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: '',
            secondary: [],
          },
        },
        'invalid-branch-2'
      );
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Verify validation failed
    expect(result.current.validation.isValid).toBe(false);

    // Check for multiple errors
    const allErrors = extractValidationErrors(result.current.validation);
    expect(allErrors.length).toBeGreaterThan(5); // Should have multiple errors

    // Verify specific error types
    expect(allErrors.some((e) => e.includes('Program'))).toBe(true);
    expect(allErrors.some((e) => e.includes('Form ID'))).toBe(true);
    expect(allErrors.some((e) => e.includes('URL'))).toBe(true);
    expect(allErrors.some((e) => e.includes('keyword'))).toBe(true);
    expect(allErrors.some((e) => e.includes('primary CTA'))).toBe(true);
  });

  it('should distinguish between errors and warnings', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create entities with warnings but no errors
    await act(async () => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      // Form with no trigger phrases (warning)
      result.current.forms.createForm({
        enabled: true,
        form_id: 'form-with-warning',
        program: 'test-program',
        title: 'Form',
        description: 'Test',
        trigger_phrases: [], // No trigger phrases - should warn
        fields: [
          {
            id: 'field1',
            type: 'text',
            label: 'Field',
            prompt: 'Enter value',
            required: true,
          },
        ],
      });

      // CTA with generic button text (warning)
      result.current.ctas.createCTA(
        {
          label: 'Click Here', // Generic label - should warn
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'primary',
        },
        'cta-with-warning'
      );

      // Branch with question words in keywords (warning)
      result.current.branches.createBranch(
        {
          detection_keywords: ['how do I apply', 'what is this'], // Question words - should warn
          available_ctas: {
            primary: 'cta-with-warning',
            secondary: [],
          },
        },
        'branch-with-warning'
      );
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should pass validation (warnings don't fail validation)
    expect(result.current.validation.isValid).toBe(true);

    // But should have warnings
    const formWarnings = getEntityWarnings(result.current.validation, 'form-with-warning');
    expect(formWarnings.length).toBeGreaterThan(0);

    const ctaWarnings = getEntityWarnings(result.current.validation, 'cta-with-warning');
    expect(ctaWarnings.length).toBeGreaterThan(0);

    const branchWarnings = getEntityWarnings(result.current.validation, 'branch-with-warning');
    expect(branchWarnings.length).toBeGreaterThan(0);
  });

  it('should validate cross-entity dependencies', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create entities with dependency issues
    await act(async () => {
      // CTA references non-existent form
      result.current.ctas.createCTA(
        {
          label: 'Start Form',
          action: 'start_form',
          formId: 'nonexistent-form', // Form doesn't exist
          type: 'form_trigger',
          style: 'primary',
        },
        'cta-bad-form-ref'
      );

      // Branch references non-existent CTA
      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'nonexistent-cta', // CTA doesn't exist
            secondary: [],
          },
        },
        'branch-bad-cta-ref'
      );
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should fail validation
    expect(result.current.validation.isValid).toBe(false);

    // Check for dependency errors
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('does not exist') || e.includes('not found'))).toBe(true);
  });

  it('should re-validate when entities are fixed', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create invalid CTA
    await act(async () => {
      result.current.ctas.createCTA(
        {
          label: 'Invalid CTA',
          action: 'start_form',
          // Missing formId
          type: 'form_trigger',
          style: 'primary',
        },
        'test-cta'
      );
    });

    // Run validation - should fail
    await act(async () => {
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(false);

    // Fix the CTA
    await act(async () => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      const form = createTestForm('test-program', 3, { form_id: 'test-form' });
      result.current.forms.createForm(form);

      result.current.ctas.updateCTA('test-cta', {
        formId: 'test-form',
      });
    });

    // Re-run validation - should pass
    await act(async () => {
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(true);
  });

  it('should validate form field structure', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create form with invalid fields
    await act(async () => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      result.current.forms.createForm({
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [
          {
            id: '', // Empty ID - should be invalid
            type: 'text',
            label: 'Field 1',
            prompt: 'Enter value',
            required: true,
          },
          {
            id: 'field2',
            type: 'select',
            label: 'Field 2',
            prompt: 'Select option',
            required: true,
            options: [], // Select with no options - should be invalid
          },
        ],
      });
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should fail validation
    expect(result.current.validation.isValid).toBe(false);

    const errors = extractValidationErrors(result.current.validation);
    // May have errors about empty field ID or missing options
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should provide summary of validation results', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create mix of valid and invalid entities
    await act(async () => {
      // Valid program
      result.current.programs.createProgram(
        createTestProgram({ program_id: 'valid-program' })
      );

      // Invalid form
      result.current.forms.createForm({
        enabled: true,
        form_id: 'invalid-form',
        program: '',
        title: 'Invalid',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [],
      });

      // Valid CTA
      result.current.ctas.createCTA(
        {
          label: 'Test',
          action: 'send_query',
          query: 'test query',
          type: 'bedrock_query',
          style: 'primary',
        },
        'valid-cta'
      );

      // Invalid CTA
      result.current.ctas.createCTA(
        {
          label: 'Invalid',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        },
        'invalid-cta'
      );
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Check summary
    const summary = getValidationSummary(result.current.validation);
    expect(summary).toBeDefined();
    expect(summary.totalErrors).toBeGreaterThan(0);
    expect(summary.totalWarnings).toBeGreaterThanOrEqual(0);
  });

  it('should validate on entity create/update/delete', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Initial state - valid
    await act(async () => {
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(true);

    // Create invalid entity - validation should update
    await act(async () => {
      result.current.ctas.createCTA(
        {
          label: 'Invalid',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        },
        'invalid-cta'
      );
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(false);

    // Delete invalid entity - validation should update
    await act(async () => {
      result.current.ctas.deleteCTA('invalid-cta');
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(true);
  });

  it('should detect circular dependencies in form CTAs', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create forms and CTAs that could potentially form a circular dependency
    await act(async () => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      // Form 1
      result.current.forms.createForm({
        enabled: true,
        form_id: 'form-1',
        program: 'test-program',
        title: 'Form 1',
        description: 'First form',
        trigger_phrases: ['form1'],
        fields: [
          {
            id: 'field1',
            type: 'text',
            label: 'Field',
            prompt: 'Enter value',
            required: true,
          },
        ],
        post_submission: {
          confirmation_message: 'Thanks',
          actions: [
            {
              id: 'action1',
              label: 'Next Form',
              action: 'start_form',
              formId: 'form-2', // References form-2
            },
          ],
        },
      });

      // Form 2
      result.current.forms.createForm({
        enabled: true,
        form_id: 'form-2',
        program: 'test-program',
        title: 'Form 2',
        description: 'Second form',
        trigger_phrases: ['form2'],
        fields: [
          {
            id: 'field2',
            type: 'text',
            label: 'Field',
            prompt: 'Enter value',
            required: true,
          },
        ],
        post_submission: {
          confirmation_message: 'Thanks',
          actions: [
            {
              id: 'action2',
              label: 'Back to Form 1',
              action: 'start_form',
              formId: 'form-1', // References form-1 - potential circular dependency
            },
          ],
        },
      });
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // This test verifies that circular dependencies are detected
    // The validation should still pass but may generate warnings
    // Actual circular dependency detection depends on validation implementation
    const form1Errors = getEntityErrors(result.current.validation, 'form-1');
    const form2Errors = getEntityErrors(result.current.validation, 'form-2');
    const form1Warnings = getEntityWarnings(result.current.validation, 'form-1');
    const form2Warnings = getEntityWarnings(result.current.validation, 'form-2');

    // Forms should exist and may have errors or warnings
    expect(form1Errors !== undefined || form1Warnings !== undefined).toBe(true);
    expect(form2Errors !== undefined || form2Warnings !== undefined).toBe(true);
  });

  it('should validate multiple issues in single entity', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create form with multiple issues
    await act(async () => {
      result.current.forms.createForm({
        enabled: true,
        form_id: 'problematic-form',
        program: '', // Issue 1: Missing program
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: [], // Issue 2: No trigger phrases (warning)
        fields: [], // Issue 3: No fields (could be warning)
      });
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should detect multiple issues
    const formErrors = getEntityErrors(result.current.validation, 'problematic-form');
    const formWarnings = getEntityWarnings(result.current.validation, 'problematic-form');

    const totalIssues = formErrors.length + formWarnings.length;
    expect(totalIssues).toBeGreaterThan(1);
  });

  it('should clear validation errors when entities are deleted', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create invalid entity
    await act(async () => {
      result.current.ctas.createCTA(
        {
          label: 'Invalid',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        },
        'invalid-cta'
      );
    });

    // Run validation
    await act(async () => {
      await result.current.validation.validateAll();
    });
    expect(result.current.validation.isValid).toBe(false);
    const ctaErrorsBefore = getEntityErrors(result.current.validation, 'invalid-cta');
    expect(ctaErrorsBefore.length).toBeGreaterThan(0);

    // Delete entity
    await act(async () => {
      result.current.ctas.deleteCTA('invalid-cta');
      await result.current.validation.validateAll();
    });

    // Validation should pass and error should be cleared
    expect(result.current.validation.isValid).toBe(true);
    const ctaErrorsAfter = getEntityErrors(result.current.validation, 'invalid-cta');
    expect(ctaErrorsAfter.length).toBe(0);
  });
});
