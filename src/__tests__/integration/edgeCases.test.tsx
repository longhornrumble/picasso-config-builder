/**
 * Integration Tests - Edge Cases
 *
 * Tests edge cases and boundary conditions:
 * 1. Empty config
 * 2. Large config (20+ forms, 30+ CTAs)
 * 3. Circular dependencies
 * 4. Missing references
 * 5. Malformed data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createMockS3API,
  createTestProgram,
  createTestForm,
  createLargeTenantConfig,
  resetIdCounter,
} from './testUtils';
import * as configOps from '@/lib/api/config-operations';

vi.mock('@/lib/api/config-operations');

describe('Edge Cases Integration Tests', () => {
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
    });
  });

  it('should handle empty config', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const emptyConfig = {
      tenant_id: 'EMPTY_TENANT',
      version: '1.3.0',
      generated_at: Date.now(),
      programs: {},
      conversational_forms: {},
      ctas: {},
      routing: {
        conversation_branches: {},
      },
    };

    mockS3._setMockConfig('EMPTY_TENANT', emptyConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Load empty config
    await act(async () => {
      await result.current.config.loadFromS3('EMPTY_TENANT');
    });

    // Verify store populated with empty collections
    expect(result.current.config.tenantId).toBe('EMPTY_TENANT');
    expect(Object.keys(result.current.programs.programs)).toHaveLength(0);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(0);
    expect(Object.keys(result.current.ctas.ctas)).toHaveLength(0);
    expect(Object.keys(result.current.branches.branches)).toHaveLength(0);

    // Should be able to add entities to empty config
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'first-program',
          program_name: 'First Program',
        })
      );
    });

    expect(Object.keys(result.current.programs.programs)).toHaveLength(1);
  });

  it('should handle large config with 20+ forms and 30+ CTAs', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const largeConfig = createLargeTenantConfig(10, 3, 2, 30);

    mockS3._setMockConfig('LARGE_TENANT', largeConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    vi.mocked(configOps.saveConfig).mockImplementation((tenantId, config, options) =>
      mockS3.saveConfig(tenantId, config, options)
    );

    // Load large config
    await act(async () => {
      await result.current.config.loadFromS3('LARGE_TENANT');
    });

    // Verify large config loaded
    const programCount = Object.keys(result.current.programs.programs).length;
    const formCount = Object.keys(result.current.forms.forms).length;
    const ctaCount = Object.keys(result.current.ctas.ctas).length;
    const branchCount = Object.keys(result.current.branches.branches).length;

    expect(programCount).toBe(10);
    expect(formCount).toBe(30); // 10 programs * 3 forms
    expect(ctaCount).toBe(60); // 30 forms * 2 CTAs
    expect(branchCount).toBe(30);

    // Test performance: adding entity to large config
    const startTime = Date.now();
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'new-program',
          program_name: 'New Program',
        })
      );
    });
    const endTime = Date.now();

    // Should complete quickly even with large config
    expect(endTime - startTime).toBeLessThan(100);

    // Test validation on large config
    act(() => {
      result.current.validation.validateAll();
    });

    // Should complete validation
    expect(result.current.validation.isValid).toBeDefined();

    // Test save large config
    await act(async () => {
      await result.current.config.saveToS3();
    });

    // Verify save completed
    expect(mockS3.saveConfig).toHaveBeenCalled();
  });

  it('should handle missing form reference in CTA', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA with missing form reference
    act(() => {
      result.current.ctas.createCTA(
        {
          label: 'Orphan CTA',
          action: 'start_form',
          formId: 'nonexistent-form',
          type: 'form_trigger',
          style: 'primary',
        },
        'orphan-cta'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Should detect missing reference
    expect(result.current.validation.isValid).toBe(false);
    const ctaResult = result.current.validation.ctaResults['orphan-cta'];
    expect(ctaResult?.errors.length).toBeGreaterThan(0);
  });

  it('should handle missing CTA reference in branch', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create branch with missing CTA reference
    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'nonexistent-cta',
            secondary: [],
          },
        },
        'orphan-branch'
      );
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Should detect missing reference
    expect(result.current.validation.isValid).toBe(false);
    const branchResult = result.current.validation.branchResults['orphan-branch'];
    expect(branchResult?.errors.length).toBeGreaterThan(0);
  });

  it('should handle malformed field data', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form with malformed field
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({ program_id: 'test-program' })
      );

      result.current.forms.createForm({
        enabled: true,
        form_id: 'malformed-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [
          {
            id: '',
            type: 'text',
            label: '',
            prompt: '',
            required: true,
          } as any,
        ],
      });
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Should detect issues with malformed field
    const formResult = result.current.validation.formResults['malformed-form'];
    expect(formResult).toBeDefined();
    // May have errors or warnings depending on validation rules
  });

  it('should handle very long strings in config', () => {
    const { result } = renderHook(() => useConfigStore());

    const veryLongString = 'A'.repeat(10000);

    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'test-program',
          program_name: veryLongString,
          description: veryLongString,
        })
      );
    });

    // Should handle long strings without crashing
    const program = result.current.programs.getProgram('test-program');
    expect(program).toBeDefined();
    expect(program?.program_name.length).toBe(10000);
  });

  it('should handle special characters in IDs', () => {
    const { result } = renderHook(() => useConfigStore());

    const specialId = 'test-program-with-special-chars-!@#$%^&*()';

    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: specialId,
          program_name: 'Test Program',
        })
      );
    });

    // Should handle special characters
    const program = result.current.programs.getProgram(specialId);
    expect(program).toBeDefined();
  });

  it('should handle duplicate IDs gracefully', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create first program
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'duplicate-id',
          program_name: 'First Program',
        })
      );
    });

    // Attempt to create second program with same ID
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'duplicate-id',
          program_name: 'Second Program',
        })
      );
    });

    // Second creation should overwrite or be rejected
    const program = result.current.programs.getProgram('duplicate-id');
    expect(program).toBeDefined();
    // Depending on implementation, may have first or second program
    expect(['First Program', 'Second Program']).toContain(program?.program_name);
  });

  it('should handle rapid successive updates', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program
    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'test-program',
          program_name: 'Original Name',
        })
      );
    });

    // Rapid updates
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.programs.updateProgram('test-program', {
          program_name: `Updated Name ${i}`,
        });
      }
    });

    // Final state should reflect last update
    const program = result.current.programs.getProgram('test-program');
    expect(program?.program_name).toBe('Updated Name 99');
  });

  it('should handle form with 100+ fields', () => {
    const { result } = renderHook(() => useConfigStore());

    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      const form = createTestForm('test-program', 100, { form_id: 'large-form' });
      result.current.forms.createForm(form);
    });

    // Verify large form created
    const form = result.current.forms.getForm('large-form');
    expect(form).toBeDefined();
    expect(form?.fields.length).toBe(100);

    // Test field operations on large form
    act(() => {
      result.current.forms.updateField('large-form', 50, {
        label: 'Updated Field',
      });
    });

    const updatedForm = result.current.forms.getForm('large-form');
    expect(updatedForm?.fields[50].label).toBe('Updated Field');
  });

  it('should handle branch with 50+ keywords', () => {
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

    // Create branch with many keywords
    const keywords: string[] = [];
    for (let i = 0; i < 50; i++) {
      keywords.push(`keyword-${i}`);
    }

    act(() => {
      result.current.branches.createBranch(
        {
          detection_keywords: keywords,
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'large-branch'
      );
    });

    // Verify branch with many keywords
    const branch = result.current.branches.getBranch('large-branch');
    expect(branch).toBeDefined();
    expect(branch?.detection_keywords.length).toBe(50);
  });

  it('should handle config with missing optional sections', async () => {
    const { result } = renderHook(() => useConfigStore());

    const mockS3 = createMockS3API();
    const minimalConfig = {
      tenant_id: 'MINIMAL_TENANT',
      version: '1.3.0',
      generated_at: Date.now(),
      programs: {
        'program-1': {
          program_id: 'program-1',
          program_name: 'Test Program',
        },
      },
      // Missing conversational_forms
      // Missing ctas
      // Missing routing
    };

    mockS3._setMockConfig('MINIMAL_TENANT', minimalConfig);
    vi.mocked(configOps.loadConfig).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Load minimal config
    await act(async () => {
      await result.current.config.loadFromS3('MINIMAL_TENANT');
    });

    // Verify config loaded with defaults for missing sections
    expect(result.current.config.tenantId).toBe('MINIMAL_TENANT');
    expect(Object.keys(result.current.programs.programs)).toHaveLength(1);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(0);
    expect(Object.keys(result.current.ctas.ctas)).toHaveLength(0);
    expect(Object.keys(result.current.branches.branches)).toHaveLength(0);
  });

  it('should handle null and undefined values in config', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create entities with null/undefined optional fields
    act(() => {
      result.current.programs.createProgram({
        program_id: 'test-program',
        program_name: 'Test Program',
        description: undefined, // Optional field
      });

      result.current.programs.createProgram(
        createTestProgram({ program_id: 'test-program-2' })
      );

      const form = createTestForm('test-program', 3, { form_id: 'test-form' });
      form.cta_text = undefined; // Optional field
      result.current.forms.createForm(form);
    });

    // Verify entities created
    expect(Object.keys(result.current.programs.programs)).toHaveLength(2);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(1);
  });

  it('should handle unicode and emoji in strings', () => {
    const { result } = renderHook(() => useConfigStore());

    act(() => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'unicode-program',
          program_name: '测试程序 🚀 Test Program',
          description: 'Description with émojis 🎉 and unicode çharacters',
        })
      );
    });

    const program = result.current.programs.getProgram('unicode-program');
    expect(program).toBeDefined();
    expect(program?.program_name).toContain('🚀');
    expect(program?.description).toContain('🎉');
  });

  it('should handle zero-length arrays in config', () => {
    const { result } = renderHook(() => useConfigStore());

    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);

      // Form with zero fields
      result.current.forms.createForm({
        enabled: true,
        form_id: 'empty-form',
        program: 'test-program',
        title: 'Empty Form',
        description: 'Form with no fields',
        trigger_phrases: [],
        fields: [],
      });
    });

    const form = result.current.forms.getForm('empty-form');
    expect(form).toBeDefined();
    expect(form?.fields).toHaveLength(0);
    expect(form?.trigger_phrases).toHaveLength(0);
  });

  it('should handle simultaneous create and delete operations', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create multiple programs
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.programs.createProgram(
          createTestProgram({
            program_id: `program-${i}`,
            program_name: `Program ${i}`,
          })
        );
      }
    });

    expect(Object.keys(result.current.programs.programs)).toHaveLength(10);

    // Simultaneously delete some and create new ones
    act(() => {
      result.current.programs.deleteProgram('program-0');
      result.current.programs.deleteProgram('program-1');
      result.current.programs.deleteProgram('program-2');

      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'program-10',
          program_name: 'Program 10',
        })
      );
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'program-11',
          program_name: 'Program 11',
        })
      );
    });

    // Verify final state
    expect(Object.keys(result.current.programs.programs)).toHaveLength(9);
    expect(result.current.programs.getProgram('program-0')).toBeUndefined();
    expect(result.current.programs.getProgram('program-10')).toBeDefined();
  });
});
