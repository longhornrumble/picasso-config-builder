/**
 * Integration Test Utilities
 * Shared utilities, mocks, and helpers for integration tests
 */

import { vi } from 'vitest';
import type {
  Program,
  ConversationalForm,
  FormField,
  CTADefinition,
  ConversationBranch,
  TenantConfig,
} from '@/types/config';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID for tests
 */
export function generateTestId(prefix: string = 'test'): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Reset ID counter (call in beforeEach)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Create a test program
 */
export function createTestProgram(overrides?: Partial<Program>): Program {
  return {
    program_id: generateTestId('program'),
    program_name: 'Test Program',
    description: 'Test program description',
    ...overrides,
  };
}

/**
 * Create a test form field
 */
export function createTestFormField(overrides?: Partial<FormField>): FormField {
  return {
    id: generateTestId('field'),
    type: 'text',
    label: 'Test Field',
    prompt: 'Please provide test information',
    required: true,
    ...overrides,
  };
}

/**
 * Create a test form with specified number of fields
 */
export function createTestForm(
  programId: string,
  fieldCount: number = 5,
  overrides?: Partial<ConversationalForm>
): ConversationalForm {
  const fieldTypes: Array<FormField['type']> = ['text', 'email', 'phone', 'select', 'textarea'];

  const fields: FormField[] = [];
  for (let i = 0; i < fieldCount; i++) {
    const fieldType = fieldTypes[i % fieldTypes.length];
    fields.push(
      createTestFormField({
        id: `field_${i + 1}`,
        type: fieldType,
        label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field ${i + 1}`,
        prompt: `Please provide your ${fieldType}`,
        required: i < 3, // First 3 fields required
        ...(fieldType === 'select'
          ? {
              options: [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
              ],
            }
          : {}),
      })
    );
  }

  return {
    enabled: true,
    form_id: generateTestId('form'),
    program: programId,
    title: 'Test Form',
    description: 'Test form description',
    trigger_phrases: ['test form', 'apply now', 'get started'],
    fields,
    post_submission: {
      confirmation_message: 'Thank you for your submission!',
      next_steps: ['We will review your application', 'Expect a response within 2-3 business days'],
      fulfillment: {
        method: 'email',
        recipients: ['test@example.com'],
        notification_enabled: true,
      },
    },
    ...overrides,
  };
}

/**
 * Create a test CTA
 */
export function createTestCTA(
  formId?: string,
  overrides?: Partial<CTADefinition>
): CTADefinition {
  return {
    label: 'Start Application',
    action: 'start_form',
    formId: formId || generateTestId('form'),
    type: 'form_trigger',
    style: 'primary',
    ...overrides,
  };
}

/**
 * Create a test branch
 */
export function createTestBranch(
  primaryCtaId: string,
  overrides?: Partial<ConversationBranch>
): ConversationBranch {
  return {
    detection_keywords: ['application', 'apply', 'sign up'],
    available_ctas: {
      primary: primaryCtaId,
      secondary: [],
    },
    ...overrides,
  };
}

/**
 * Create a complete tenant config
 */
export function createTestTenantConfig(
  tenantId: string = 'TEST_TENANT',
  overrides?: Partial<TenantConfig>
): TenantConfig {
  const program = createTestProgram({ program_id: 'program-1', program_name: 'Test Program' });
  const form = createTestForm('program-1', 3, { form_id: 'form-1' });
  const cta = createTestCTA('form-1');
  const branch = createTestBranch('cta-1');

  return {
    tenant_id: tenantId,
    version: '1.3.0',
    generated_at: Date.now(),
    programs: {
      'program-1': program,
    },
    conversational_forms: {
      'form-1': form,
    },
    cta_definitions: {
      'cta-1': cta,
    },
    conversation_branches: {
      'branch-1': branch,
    },
    ...overrides,
  } as any;
}

// ============================================================================
// S3 API MOCKS
// ============================================================================

/**
 * Mock S3 API responses
 */
export function createMockS3API() {
  const mockConfigs = new Map<string, TenantConfig>();

  return {
    listTenants: vi.fn().mockResolvedValue([
      { tenantId: 'TEST_TENANT_1', lastModified: Date.now() },
      { tenantId: 'TEST_TENANT_2', lastModified: Date.now() },
    ]),

    getTenantMetadata: vi.fn((tenantId: string) =>
      Promise.resolve({
        tenantId,
        version: '1.3.0',
        lastModified: Date.now(),
        exists: true,
      })
    ),

    loadConfig: vi.fn((tenantId: string) => {
      const config = mockConfigs.get(tenantId) || createTestTenantConfig(tenantId);
      mockConfigs.set(tenantId, config);
      return Promise.resolve({
        config,
        metadata: {
          tenantId,
          version: config.version,
          lastModified: config.generated_at,
        },
      });
    }),

    saveConfig: vi.fn((tenantId: string, config: TenantConfig) => {
      mockConfigs.set(tenantId, config);
      return Promise.resolve();
    }),

    deployConfig: vi.fn((tenantId: string, config: TenantConfig) => {
      mockConfigs.set(tenantId, config);
      return Promise.resolve();
    }),

    deleteConfig: vi.fn((tenantId: string) => {
      mockConfigs.delete(tenantId);
      return Promise.resolve();
    }),

    healthCheck: vi.fn().mockResolvedValue(true),

    // Utility methods for tests
    _getMockConfig: (tenantId: string) => mockConfigs.get(tenantId),
    _setMockConfig: (tenantId: string, config: TenantConfig) => mockConfigs.set(tenantId, config),
    _clearMockConfigs: () => mockConfigs.clear(),
    _getAllMockConfigs: () => mockConfigs,
  };
}

// ============================================================================
// ERROR SIMULATION
// ============================================================================

/**
 * Create mock API with simulated errors
 */
export function createMockS3APIWithErrors(errorType: 'network' | 'validation' | 'notfound') {
  const api = createMockS3API();

  switch (errorType) {
    case 'network':
      api.loadConfig = vi.fn().mockRejectedValue(new Error('Network timeout'));
      api.saveConfig = vi.fn().mockRejectedValue(new Error('Network timeout'));
      break;
    case 'validation':
      api.saveConfig = vi
        .fn()
        .mockRejectedValue(new Error('Validation failed: Invalid config structure'));
      break;
    case 'notfound':
      api.loadConfig = vi.fn().mockRejectedValue(new Error('Tenant config not found'));
      break;
  }

  return api;
}

// ============================================================================
// LARGE CONFIG GENERATION
// ============================================================================

/**
 * Generate a large config for performance testing
 */
export function createLargeTenantConfig(
  programCount: number = 10,
  formsPerProgram: number = 3,
  ctasPerForm: number = 2,
  branchCount: number = 30
): TenantConfig {
  const config: any = {
    tenant_id: 'LARGE_TENANT',
    version: '1.3.0',
    generated_at: Date.now(),
    programs: {},
    conversational_forms: {},
    cta_definitions: {},
    conversation_branches: {},
  };

  // Create programs
  for (let p = 0; p < programCount; p++) {
    const programId = `program-${p + 1}`;
    config.programs[programId] = createTestProgram({
      program_id: programId,
      program_name: `Program ${p + 1}`,
    });

    // Create forms for each program
    for (let f = 0; f < formsPerProgram; f++) {
      const formId = `form-${p + 1}-${f + 1}`;
      config.conversational_forms![formId] = createTestForm(programId, 5, {
        form_id: formId,
        title: `Form ${p + 1}-${f + 1}`,
      });

      // Create CTAs for each form
      for (let c = 0; c < ctasPerForm; c++) {
        const ctaId = `cta-${p + 1}-${f + 1}-${c + 1}`;
        config.cta_definitions[ctaId] = createTestCTA(formId, {
          label: `CTA ${p + 1}-${f + 1}-${c + 1}`,
        });
      }
    }
  }

  // Create branches
  const allCtaIds = Object.keys(config.cta_definitions);
  for (let b = 0; b < branchCount; b++) {
    const branchId = `branch-${b + 1}`;
    const primaryCtaId = allCtaIds[b % allCtaIds.length];
    config.conversation_branches[branchId] = createTestBranch(primaryCtaId, {
      detection_keywords: [`keyword-${b + 1}`, `topic-${b + 1}`],
    });
  }

  return config;
}

// ============================================================================
// TEST STORE UTILITIES
// ============================================================================

/**
 * Wait for store state to update
 */
export async function waitForStoreUpdate(checkFn: () => boolean, timeout: number = 1000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (checkFn()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Store state did not update within timeout');
}

/**
 * Extract all validation errors from store state
 */
export function extractValidationErrors(validationState: any): string[] {
  const errors: string[] = [];

  // New validation structure uses errors and warnings objects keyed by entityId
  if (validationState.errors) {
    Object.values(validationState.errors).forEach((entityErrors: any) => {
      if (Array.isArray(entityErrors)) {
        entityErrors.forEach((error: any) => {
          errors.push(error.message);
        });
      }
    });
  }

  return errors;
}

/**
 * Extract all validation warnings from store state
 */
export function extractValidationWarnings(validationState: any): string[] {
  const warnings: string[] = [];

  if (validationState.warnings) {
    Object.values(validationState.warnings).forEach((entityWarnings: any) => {
      if (Array.isArray(entityWarnings)) {
        entityWarnings.forEach((warning: any) => {
          warnings.push(warning.message);
        });
      }
    });
  }

  return warnings;
}

/**
 * Get validation errors for a specific entity
 */
export function getEntityErrors(validationState: any, entityId: string): any[] {
  return validationState.errors?.[entityId] || [];
}

/**
 * Get validation warnings for a specific entity
 */
export function getEntityWarnings(validationState: any, entityId: string): any[] {
  return validationState.warnings?.[entityId] || [];
}

/**
 * Calculate validation summary from errors and warnings
 */
export function getValidationSummary(validationState: any): { totalErrors: number; totalWarnings: number } {
  let totalErrors = 0;
  let totalWarnings = 0;

  if (validationState.errors) {
    Object.values(validationState.errors).forEach((entityErrors: any) => {
      if (Array.isArray(entityErrors)) {
        totalErrors += entityErrors.length;
      }
    });
  }

  if (validationState.warnings) {
    Object.values(validationState.warnings).forEach((entityWarnings: any) => {
      if (Array.isArray(entityWarnings)) {
        totalWarnings += entityWarnings.length;
      }
    });
  }

  return { totalErrors, totalWarnings };
}

/**
 * Reset Zustand store to clean state for testing
 * Import useConfigStore in your test and call this in beforeEach
 */
export function resetConfigStore(useConfigStore: any) {
  useConfigStore.setState((state: any) => {
    // Reset only data properties, preserve all action methods
    state.programs.programs = {};
    state.programs.activeProgramId = null;
    state.forms.forms = {};
    state.forms.activeFormId = null;
    state.ctas.ctas = {};
    state.ctas.activeCtaId = null;
    state.branches.branches = {};
    state.branches.activeBranchId = null;
    state.contentShowcase = { content_showcase: [] };
    state.cardInventory = { cardInventory: null };
    state.validation.errors = {};
    state.validation.warnings = {};
    state.validation.isValid = true;
    state.validation.lastValidated = null;
    state.config.tenantId = null;
    state.config.isDirty = false;
    state.config.baseConfig = null;
    state.config.lastSaved = null;
    state.ui.toasts = [];
    state.ui.loading = {};
    state.ui.activeTab = 'programs';
    state.ui.modalStack = [];
  });
}
