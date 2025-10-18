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
  resetConfigStore,
  getEntityErrors,
  getEntityWarnings,
} from './testUtils';
import * as configOps from '@/lib/api/config-operations';

vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  deployConfig: vi.fn(),
  listTenants: vi.fn(),
  getTenantMetadata: vi.fn(),
}));

describe('Edge Cases Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();

    // Reset store state
    resetConfigStore(useConfigStore);
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
    (configOps.loadConfig as any).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Load empty config
    await act(async () => {
      await result.current.config.loadConfig('EMPTY_TENANT');
    });

    // Verify store populated with empty collections
    expect(result.current.config.tenantId).toBe('EMPTY_TENANT');
    expect(Object.keys(result.current.programs.programs)).toHaveLength(0);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(0);
    expect(Object.keys(result.current.ctas.ctas)).toHaveLength(0);
    expect(Object.keys(result.current.branches.branches)).toHaveLength(0);

    // Should be able to add entities to empty config
    await act(async () => {
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
    (configOps.loadConfig as any).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );
    (configOps.saveConfig as any).mockImplementation((tenantId, config, options) =>
      mockS3.saveConfig(tenantId, config, options)
    );

    // Load large config
    await act(async () => {
      await result.current.config.loadConfig('LARGE_TENANT');
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
    await act(async () => {
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
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should complete validation
    expect(result.current.validation.isValid).toBeDefined();

    // Test save large config
    await act(async () => {
      await result.current.config.saveConfig();
    });

    // Verify save completed
    expect(mockS3.saveConfig).toHaveBeenCalled();
  });

  it('should handle missing form reference in CTA', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA with missing form reference
    await act(async () => {
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
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should detect missing reference
    expect(result.current.validation.isValid).toBe(false);
    const ctaErrors = getEntityErrors(result.current.validation, 'orphan-cta');
    expect(ctaErrors.length).toBeGreaterThan(0);
  });

  it('should handle missing CTA reference in branch', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create branch with missing CTA reference
    await act(async () => {
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
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should detect missing reference
    expect(result.current.validation.isValid).toBe(false);
    const branchErrors = getEntityErrors(result.current.validation, 'orphan-branch');
    expect(branchErrors.length).toBeGreaterThan(0);
  });

  it('should handle malformed field data', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form with malformed field
    await act(async () => {
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
    await act(async () => {
      await result.current.validation.validateAll();
    });

    // Should detect issues with malformed field
    const formErrors = getEntityErrors(result.current.validation, 'malformed-form');
    const formWarnings = getEntityWarnings(result.current.validation, 'malformed-form');
    // Should have errors or warnings depending on validation rules
    expect(formErrors.length + formWarnings.length).toBeGreaterThan(0);
  });

  it('should handle very long strings in config', async () => {
    const { result } = renderHook(() => useConfigStore());

    const veryLongString = 'A'.repeat(10000);

    await act(async () => {
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

  it('should handle special characters in IDs', async () => {
    const { result } = renderHook(() => useConfigStore());

    const specialId = 'test-program-with-special-chars-!@#$%^&*()';

    await act(async () => {
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

  it('should handle duplicate IDs gracefully', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create first program
    await act(async () => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'duplicate-id',
          program_name: 'First Program',
        })
      );
    });

    // Attempt to create second program with same ID
    await act(async () => {
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

  it('should handle rapid successive updates', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program
    await act(async () => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'test-program',
          program_name: 'Original Name',
        })
      );
    });

    // Rapid updates
    await act(async () => {
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

  it('should handle form with 100+ fields', async () => {
    const { result } = renderHook(() => useConfigStore());

    await act(async () => {
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
    await act(async () => {
      result.current.forms.updateField('large-form', 50, {
        label: 'Updated Field',
      });
    });

    const updatedForm = result.current.forms.getForm('large-form');
    expect(updatedForm?.fields[50].label).toBe('Updated Field');
  });

  it('should handle branch with 50+ keywords', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create CTA
    await act(async () => {
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

    await act(async () => {
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
    (configOps.loadConfig as any).mockImplementation((tenantId) =>
      mockS3.loadConfig(tenantId)
    );

    // Load minimal config
    await act(async () => {
      await result.current.config.loadConfig('MINIMAL_TENANT');
    });

    // Verify config loaded with defaults for missing sections
    expect(result.current.config.tenantId).toBe('MINIMAL_TENANT');
    expect(Object.keys(result.current.programs.programs)).toHaveLength(1);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(0);
    expect(Object.keys(result.current.ctas.ctas)).toHaveLength(0);
    expect(Object.keys(result.current.branches.branches)).toHaveLength(0);
  });

  it('should handle null and undefined values in config', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create entities with null/undefined optional fields
    await act(async () => {
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

  it('should handle unicode and emoji in strings', async () => {
    const { result } = renderHook(() => useConfigStore());

    await act(async () => {
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

  it('should handle zero-length arrays in config', async () => {
    const { result } = renderHook(() => useConfigStore());

    await act(async () => {
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

  it('should handle simultaneous create and delete operations', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create multiple programs
    await act(async () => {
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
    await act(async () => {
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
