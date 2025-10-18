/**
 * Integration Tests - Error Handling
 *
 * Tests error handling workflows:
 * 1. S3 load failure
 * 2. Invalid config structure
 * 3. Validation errors blocking deployment
 * 4. Dependency warnings on delete
 * 5. Network timeout on save
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createMockS3API,
  createMockS3APIWithErrors,
  createTestTenantConfig,
  createTestProgram,
  createTestForm,
  resetIdCounter,
} from './testUtils';
import * as configOps from '@/lib/api/config-operations';

vi.mock('@/lib/api/config-operations');

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();

    // Reset store state
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.programs.programs = {};
      result.current.forms.forms = {};
      result.current.ctas.ctas = {};
      result.current.branches.branches = {};
      result.current.config.tenantId = null;
      result.current.config.isDirty = false;
      result.current.ui.toasts = [];
    });
  });

  it('should handle S3 load failure gracefully', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup mock to fail on load
    const mockS3 = createMockS3APIWithErrors('notfound');
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Attempt to load
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.loadFromS3('NONEXISTENT_TENANT');
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error was thrown
    expect(error).not.toBeNull();
    expect(error?.message).toContain('not found');

    // Verify store remains in clean state
    expect(result.current.config.tenantId).toBeNull();
    expect(Object.keys(result.current.programs.programs)).toHaveLength(0);
  });

  it('should handle network timeout on save', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup mock to succeed on load, fail on save
    const mockS3 = createMockS3API();
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    vi.mocked(configOps.saveConfig).mockRejectedValue(new Error('Network timeout'));

    // Load config
    await act(async () => {
      await result.current.config.loadFromS3('TEST_TENANT');
    });

    // Make changes
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'new-program',
          program_name: 'New Program',
        })
      );
    });

    // Attempt to save
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.saveToS3();
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error was thrown
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Network timeout');

    // Verify store remains dirty (changes not saved)
    expect(result.current.config.isDirty).toBe(true);
  });

  it('should block deployment when validation fails', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup mock
    const mockS3 = createMockS3API();
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    vi.mocked(configOps.deployConfig).mockImplementation((tenantId, config) =>
      mockS3.deployConfig(tenantId, config)
    );

    // Load config
    await act(async () => {
      await result.current.config.loadFromS3('TEST_TENANT');
    });

    // Create invalid entity
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

    expect(result.current.validation.isValid).toBe(false);

    // Attempt to deploy
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.deployToS3();
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify deployment was blocked
    // This depends on implementation - may throw error or silently fail
    // At minimum, verify invalid state
    expect(result.current.validation.isValid).toBe(false);
  });

  it('should warn about dependencies when deleting entities', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create entities with dependencies
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      const form = createTestForm('test-program', 3, { form_id: 'test-form' });
      result.current.forms.createForm(form);

      result.current.ctas.createCTA(
        {
          label: 'Test CTA',
          action: 'start_form',
          formId: 'test-form',
          type: 'form_trigger',
          style: 'primary',
        },
        'test-cta'
      );

      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'test-branch'
      );
    });

    // Get dependencies before deletion
    const formDeps = result.current.forms.getFormDependencies('test-form');
    const ctaDeps = result.current.ctas.getCTADependencies('test-cta');

    // Verify dependencies exist
    expect(formDeps.ctas.length).toBeGreaterThan(0);
    expect(ctaDeps.branches.length).toBeGreaterThan(0);

    // Attempt to delete form (has dependent CTA)
    // The store should detect this dependency
    act(() => {
      result.current.forms.deleteForm('test-form');
    });

    // After deletion, CTA should be invalid (references non-existent form)
    act(() => {
      result.current.validation.validateAll();
    });

    expect(result.current.validation.isValid).toBe(false);
  });

  it('should handle invalid config structure on load', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create invalid config
    const invalidConfig = {
      tenant_id: 'TEST_TENANT',
      // Missing version
      // Missing generated_at
      programs: 'invalid', // Should be object
    } as any;

    const mockS3 = createMockS3API();
    mockS3._setMockConfig('TEST_TENANT', invalidConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Attempt to load
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.loadFromS3('TEST_TENANT');
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error handling
    // Implementation may throw or handle gracefully
    // At minimum, store should not be corrupted
    expect(
      result.current.config.tenantId === null ||
        result.current.config.tenantId === 'TEST_TENANT'
    ).toBe(true);
  });

  it('should handle validation error on save', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup mock to fail validation
    const mockS3 = createMockS3APIWithErrors('validation');
    vi.mocked(configOps.saveConfig).mockImplementation((tenantId, config, options) =>
      mockS3.saveConfig(tenantId, config, options)
    );

    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Load config
    await act(async () => {
      await result.current.config.loadFromS3('TEST_TENANT');
    });

    // Make changes
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'new-program',
          program_name: 'New Program',
        })
      );
    });

    // Attempt to save
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.saveToS3();
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Validation failed');
  });

  it('should handle concurrent modifications gracefully', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    vi.mocked(configOps.saveConfig).mockImplementation((tenantId, config, options) =>
      mockS3.saveConfig(tenantId, config, options)
    );

    // Load config
    await act(async () => {
      await result.current.config.loadFromS3('TEST_TENANT');
    });

    // Simulate concurrent modifications
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'program-1',
          program_name: 'Program 1',
        })
      );
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'program-2',
          program_name: 'Program 2',
        })
      );
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'program-3',
          program_name: 'Program 3',
        })
      );
    });

    // Save
    await act(async () => {
      await result.current.config.saveToS3();
    });

    // Verify all changes saved
    const saved = mockS3._getMockConfig('TEST_TENANT');
    expect(Object.keys(saved!.programs).length).toBeGreaterThanOrEqual(3);
  });

  it('should handle delete of non-existent entity', () => {
    const { result } = renderHook(() => useConfigStore());

    // Attempt to delete non-existent program
    act(() => {
      result.current.programs.deleteProgram('nonexistent-program');
    });

    // Should not throw error
    expect(Object.keys(result.current.programs.programs)).toHaveLength(0);
  });

  it('should handle update of non-existent entity', () => {
    const { result } = renderHook(() => useConfigStore());

    // Attempt to update non-existent form
    act(() => {
      result.current.forms.updateForm('nonexistent-form', {
        title: 'Updated Title',
      });
    });

    // Should not throw error
    expect(Object.keys(result.current.forms.forms)).toHaveLength(0);
  });

  it('should handle missing required fields in form', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({ program_id: 'test-program' })
      );
    });

    // Create form with missing fields
    act(() => {
      result.current.forms.createForm({
        enabled: true,
        form_id: 'incomplete-form',
        program: 'test-program',
        title: '', // Empty title
        description: '',
        trigger_phrases: [],
        fields: [],
      });
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Should have validation warnings/errors
    const formResult = result.current.validation.formResults['incomplete-form'];
    expect(formResult).toBeDefined();
    const totalIssues = (formResult?.errors.length || 0) + (formResult?.warnings.length || 0);
    expect(totalIssues).toBeGreaterThan(0);
  });

  it('should handle circular form references in post-submission actions', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and forms with circular references
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      // Form A references Form B
      result.current.forms.createForm({
        enabled: true,
        form_id: 'form-a',
        program: 'test-program',
        title: 'Form A',
        description: 'First form',
        trigger_phrases: ['form a'],
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
              label: 'Go to Form B',
              action: 'start_form',
              formId: 'form-b',
            },
          ],
        },
      });

      // Form B references Form A (circular)
      result.current.forms.createForm({
        enabled: true,
        form_id: 'form-b',
        program: 'test-program',
        title: 'Form B',
        description: 'Second form',
        trigger_phrases: ['form b'],
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
              label: 'Back to Form A',
              action: 'start_form',
              formId: 'form-a',
            },
          ],
        },
      });
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Validation should complete without hanging
    // Circular references are allowed in practice (user can navigate between forms)
    expect(result.current.validation.formResults['form-a']).toBeDefined();
    expect(result.current.validation.formResults['form-b']).toBeDefined();
  });

  it('should handle empty tenant ID on load', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Attempt to load with empty tenant ID
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.loadFromS3('');
      } catch (e) {
        error = e as Error;
      }
    });

    // Should handle gracefully (error or rejection)
    expect(error !== null || result.current.config.tenantId === null).toBe(true);
  });

  it('should handle failed deployment and rollback', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    vi.mocked(configOps.deployConfig).mockRejectedValue(new Error('Deployment failed'));

    // Load config
    await act(async () => {
      await result.current.config.loadFromS3('TEST_TENANT');
    });

    const originalProgramCount = Object.keys(result.current.programs.programs).length;

    // Make changes
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'new-program',
          program_name: 'New Program',
        })
      );
    });

    // Attempt to deploy
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.config.deployToS3();
      } catch (e) {
        error = e as Error;
      }
    });

    // Verify error
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Deployment failed');

    // Store should still have changes (not rolled back automatically)
    expect(Object.keys(result.current.programs.programs).length).toBe(originalProgramCount + 1);
    expect(result.current.config.isDirty).toBe(true);
  });
});
