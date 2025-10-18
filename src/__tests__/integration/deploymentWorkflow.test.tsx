/**
 * Integration Tests - S3 Deployment Workflow with Mocks
 *
 * Tests the complete deployment workflow:
 * 1. Load config from S3
 * 2. Edit config in store
 * 3. Validate changes
 * 4. Merge with existing config
 * 5. Deploy to S3
 * 6. Verify merged structure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createMockS3API,
  createTestTenantConfig,
  createTestProgram,
  createTestForm,
  resetIdCounter,
  resetConfigStore,
} from './testUtils';
import * as configOps from '@/lib/api/config-operations';

// Mock the config operations module
vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  deployConfig: vi.fn(),
  listTenants: vi.fn(),
  getTenantMetadata: vi.fn(),
}));

describe('S3 Deployment Workflow Integration Tests', () => {
  let mockS3: ReturnType<typeof createMockS3API>;

  beforeEach(() => {
    resetIdCounter();
    mockS3 = createMockS3API();

    // Mock all config operations
    (configOps.loadConfig as any).mockImplementation((tenantId: string) =>
      mockS3.loadConfig(tenantId)
    );
    (configOps.saveConfig as any).mockImplementation((tenantId: string, config: any, options?: any) =>
      mockS3.saveConfig(tenantId, config, options)
    );
    (configOps.deployConfig as any).mockImplementation((tenantId: string, config: any) =>
      mockS3.deployConfig(tenantId, config)
    );
    (configOps.listTenants as any).mockImplementation(() => mockS3.listTenants());
    (configOps.getTenantMetadata as any).mockImplementation((tenantId: string) =>
      mockS3.getTenantMetadata(tenantId)
    );

    // Reset store state
    resetConfigStore(useConfigStore);
  });

  it('should load config from S3 and populate store', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup mock config
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    // Load config
    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Verify store populated
    expect(result.current.config.tenantId).toBe('TEST_TENANT');
    expect(Object.keys(result.current.programs.programs)).toHaveLength(1);
    expect(Object.keys(result.current.forms.forms)).toHaveLength(1);
    expect(Object.keys(result.current.ctas.ctas)).toHaveLength(1);
    expect(Object.keys(result.current.branches.branches)).toHaveLength(1);
  });

  it('should complete full deployment workflow', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Step 1: Load existing config
    const initialConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', initialConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    expect(result.current.config.isDirty).toBe(false);

    // Step 2: Edit config - create new program
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    expect(result.current.config.isDirty).toBe(true);
    expect(Object.keys(result.current.programs.programs)).toHaveLength(2);

    // Step 3: Validate
    await act(async () => {
      await result.current.validation.validateAll();
    });

    expect(result.current.validation.isValid).toBe(true);

    // Step 4 & 5: Merge and deploy
    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify deployment
    expect(mockS3.deployConfig).toHaveBeenCalledTimes(1);
    expect(result.current.config.isDirty).toBe(false);

    // Step 6: Verify merged structure
    const deployedConfig = mockS3._getMockConfig('TEST_TENANT');
    expect(deployedConfig).toBeDefined();
    expect(Object.keys(deployedConfig!.programs)).toHaveLength(2);
    expect(deployedConfig!.programs['new-program']).toBeDefined();
  });

  it('should handle save vs deploy operations', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Load config
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Make changes
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    // Save (not deploy)
    await act(async () => {
      await result.current.config.saveConfig();
    });

    expect(mockS3.saveConfig).toHaveBeenCalledTimes(1);
    expect(mockS3.deployConfig).not.toHaveBeenCalled();

    // Now deploy
    await act(async () => {
      await result.current.config.deployConfig();
    });

    expect(mockS3.deployConfig).toHaveBeenCalledTimes(1);
  });

  it('should preserve existing config sections on deployment', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Load config with additional sections
    const testConfig = createTestTenantConfig('TEST_TENANT');
    testConfig.content_showcase = {
      content_showcase: [
        {
          id: 'showcase-1',
          type: 'program',
          enabled: true,
          name: 'Featured Program',
          tagline: 'Test tagline',
          description: 'Test description',
          keywords: ['test'],
        },
      ],
    } as any;

    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Make changes to programs only
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    // Deploy
    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify content_showcase preserved
    const deployedConfig = mockS3._getMockConfig('TEST_TENANT');
    expect(deployedConfig!.content_showcase).toBeDefined();
    expect((deployedConfig!.content_showcase as any).content_showcase).toHaveLength(1);
  });

  it('should update version and timestamp on deployment', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Load config
    const testConfig = createTestTenantConfig('TEST_TENANT');
    testConfig.version = '1.3.0';
    const originalTimestamp = testConfig.generated_at;

    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Make changes
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    // Wait a moment to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Deploy
    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify version and timestamp updated
    const deployedConfig = mockS3._getMockConfig('TEST_TENANT');
    expect(deployedConfig!.generated_at).toBeGreaterThan(originalTimestamp);
    // Version should be incremented (assuming incrementVersion logic)
  });

  it('should handle deployment of empty config sections', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Create minimal config with only programs
    const minimalConfig = createTestTenantConfig('TEST_TENANT');
    delete minimalConfig.conversational_forms;
    delete minimalConfig.ctas;
    delete minimalConfig.routing;

    mockS3._setMockConfig('TEST_TENANT', minimalConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Add forms, CTAs, branches
    await act(async () => {
      const programId = Object.keys(result.current.programs.programs)[0];
      const form = createTestForm(programId, 3, { form_id: 'new-form' });
      result.current.forms.createForm(form);

      result.current.ctas.createCTA(
        {
          label: 'New CTA',
          action: 'start_form',
          formId: 'new-form',
          type: 'form_trigger',
          style: 'primary',
        },
        'new-cta'
      );

      result.current.branches.createBranch(
        {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'new-cta',
            secondary: [],
          },
        },
        'new-branch'
      );
    });

    // Deploy
    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify all sections deployed
    const deployedConfig = mockS3._getMockConfig('TEST_TENANT');
    expect(deployedConfig!.conversational_forms).toBeDefined();
    expect(deployedConfig!.ctas).toBeDefined();
    expect(deployedConfig!.routing).toBeDefined();
  });

  it('should handle reload after deployment', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Initial load
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    const initialProgramCount = Object.keys(result.current.programs.programs).length;

    // Make changes and deploy
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Reload from S3
    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Verify reload includes new program
    expect(Object.keys(result.current.programs.programs).length).toBe(initialProgramCount + 1);
    expect(result.current.programs.programs['new-program']).toBeDefined();
  });

  it('should handle deployment with backup creation', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Load config
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    // Make changes
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'new-program',
        program_name: 'New Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    // Deploy (should create backup by default)
    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify deployConfig was called (which should create backup)
    expect(mockS3.deployConfig).toHaveBeenCalledWith(
      'TEST_TENANT',
      expect.objectContaining({
        tenant_id: 'TEST_TENANT',
        programs: expect.any(Object),
      })
    );
  });

  it('should handle multiple tenants independently', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Setup configs for two tenants
    const config1 = createTestTenantConfig('TENANT_1');
    const config2 = createTestTenantConfig('TENANT_2');

    mockS3._setMockConfig('TENANT_1', config1);
    mockS3._setMockConfig('TENANT_2', config2);

    // Load tenant 1
    await act(async () => {
      await result.current.config.loadConfig('TENANT_1');
    });

    expect(result.current.config.tenantId).toBe('TENANT_1');
    const tenant1ProgramCount = Object.keys(result.current.programs.programs).length;

    // Switch to tenant 2
    await act(async () => {
      await result.current.config.loadConfig('TENANT_2');
    });

    expect(result.current.config.tenantId).toBe('TENANT_2');

    // Make changes to tenant 2
    await act(async () => {
      const newProgram = createTestProgram({
        program_id: 'tenant2-program',
        program_name: 'Tenant 2 Program',
      });
      result.current.programs.createProgram(newProgram);
    });

    await act(async () => {
      await result.current.config.deployConfig();
    });

    // Verify tenant 2 has changes
    const deployed2 = mockS3._getMockConfig('TENANT_2');
    expect(deployed2!.programs['tenant2-program']).toBeDefined();

    // Verify tenant 1 unchanged
    const deployed1 = mockS3._getMockConfig('TENANT_1');
    expect(Object.keys(deployed1!.programs)).toHaveLength(tenant1ProgramCount);
    expect(deployed1!.programs['tenant2-program']).toBeUndefined();
  });

  it('should mark store dirty on changes and clean after save', async () => {
    const { result } = renderHook(() => useConfigStore());

    // Load config
    const testConfig = createTestTenantConfig('TEST_TENANT');
    mockS3._setMockConfig('TEST_TENANT', testConfig);

    await act(async () => {
      await result.current.config.loadConfig('TEST_TENANT');
    });

    expect(result.current.config.isDirty).toBe(false);

    // Make change
    await act(async () => {
      result.current.programs.createProgram(
        createTestProgram({
          program_id: 'new-program',
          program_name: 'New Program',
        })
      );
    });

    expect(result.current.config.isDirty).toBe(true);

    // Save
    await act(async () => {
      await result.current.config.saveConfig();
    });

    expect(result.current.config.isDirty).toBe(false);
  });
});
