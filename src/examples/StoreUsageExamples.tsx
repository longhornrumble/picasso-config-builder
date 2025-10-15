/**
 * Store Usage Examples
 * Comprehensive examples of how to use the Zustand store in components
 */

import React from 'react';
import {
  useConfigStore,
  usePrograms,
  useForms,
  useCTAs,
  useBranches,
  useUI,
  useValidation,
  useConfig,
  useAllPrograms,
  useAllForms,
  useForm,
  useProgram,
  getEntityDependencies,
  canDeleteEntity,
  getConfigStatistics,
  isConfigDeployable,
} from '@/store';

// ============================================================================
// EXAMPLE 1: Basic CRUD Operations
// ============================================================================

export function ProgramEditor() {
  const programs = usePrograms();
  const ui = useUI();

  const handleCreate = () => {
    programs.createProgram({
      program_id: 'new-program-' + Date.now(),
      program_name: 'New Program',
      description: 'Program description',
    });
  };

  const handleUpdate = (programId: string) => {
    programs.updateProgram(programId, {
      program_name: 'Updated Name',
    });
  };

  const handleDelete = (programId: string) => {
    // Store will check dependencies automatically and show error toast if needed
    programs.deleteProgram(programId);
  };

  const handleDuplicate = (programId: string) => {
    programs.duplicateProgram(programId);
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Program</button>
      {/* Render program list */}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Using Specific Selectors (Performance Optimized)
// ============================================================================

export function FormDetails({ formId }: { formId: string }) {
  // Only re-renders when this specific form changes
  const form = useForm(formId);
  const program = useProgram(form?.program || null);
  const forms = useForms();

  if (!form) {
    return <div>Form not found</div>;
  }

  const handleAddField = () => {
    forms.addField(formId, {
      id: 'new-field-' + Date.now(),
      type: 'text',
      label: 'New Field',
      prompt: 'Please enter a value',
      required: false,
    });
  };

  const handleUpdateField = (fieldIndex: number) => {
    forms.updateField(formId, fieldIndex, {
      label: 'Updated Label',
    });
  };

  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    forms.reorderFields(formId, fromIndex, toIndex);
  };

  return (
    <div>
      <h2>{form.title}</h2>
      <p>Program: {program?.program_name}</p>
      <button onClick={handleAddField}>Add Field</button>

      <ul>
        {form.fields.map((field, index) => (
          <li key={field.id}>
            {field.label}
            <button onClick={() => handleUpdateField(index)}>Edit</button>
            <button onClick={() => forms.deleteField(formId, index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Managing UI State
// ============================================================================

export function AppLayout() {
  const ui = useUI();
  const toasts = ui.toasts;
  const activeTab = ui.activeTab;
  const sidebarOpen = ui.sidebarOpen;

  const handleTabChange = (tab: 'programs' | 'forms' | 'ctas' | 'branches' | 'cards' | 'settings') => {
    ui.setActiveTab(tab);
  };

  const handleOpenEditor = (entityType: 'forms', entityId: string) => {
    ui.openEditor(entityType, entityId);
  };

  return (
    <div>
      {/* Sidebar */}
      <aside className={sidebarOpen ? 'open' : 'closed'}>
        <button onClick={() => ui.toggleSidebar()}>Toggle Sidebar</button>
        <nav>
          <button onClick={() => handleTabChange('programs')}>Programs</button>
          <button onClick={() => handleTabChange('forms')}>Forms</button>
          <button onClick={() => handleTabChange('ctas')}>CTAs</button>
        </nav>
      </aside>

      {/* Toast notifications */}
      <div className="toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
            <button onClick={() => ui.dismissToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Main content */}
      <main>
        {activeTab === 'programs' && <ProgramsList />}
        {activeTab === 'forms' && <FormsList />}
      </main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Config Lifecycle Management
// ============================================================================

export function ConfigManager() {
  const config = useConfig();
  const validation = useValidation();
  const ui = useUI();
  const isDirty = config.isDirty;
  const isValid = validation.isValid;

  const [tenantId, setTenantId] = React.useState('');

  const handleLoad = async () => {
    ui.setLoading('config', true);
    try {
      await config.loadConfig(tenantId);
    } catch (error) {
      // Error toast shown automatically
    } finally {
      ui.setLoading('config', false);
    }
  };

  const handleSave = async () => {
    await config.saveConfig();
  };

  const handleDeploy = async () => {
    // Validate first
    await validation.validateAll();

    if (!validation.isValid) {
      ui.addToast({
        type: 'error',
        message: 'Cannot deploy: validation errors exist',
      });
      return;
    }

    await config.deployConfig();
  };

  const handleReset = () => {
    if (window.confirm('Discard all changes?')) {
      config.resetConfig();
    }
  };

  return (
    <div>
      <input
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
        placeholder="Tenant ID"
      />
      <button onClick={handleLoad}>Load Config</button>

      {config.tenantId && (
        <div>
          <p>
            Tenant: {config.tenantId}
            {isDirty && ' (unsaved changes)'}
            {!isValid && ' (validation errors)'}
          </p>

          <button onClick={handleSave} disabled={!isDirty}>
            Save
          </button>

          <button onClick={handleDeploy} disabled={!isDirty || !isValid}>
            Deploy
          </button>

          <button onClick={handleReset} disabled={!isDirty}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Validation State
// ============================================================================

export function ValidationPanel() {
  const validation = useValidation();

  const handleValidate = async () => {
    await validation.validateAll();
  };

  const errorCount = Object.values(validation.errors).reduce(
    (sum, errors) => sum + errors.length,
    0
  );

  const warningCount = Object.values(validation.warnings).reduce(
    (sum, warnings) => sum + warnings.length,
    0
  );

  return (
    <div>
      <button onClick={handleValidate}>Validate Configuration</button>

      <div>
        <p>Status: {validation.isValid ? 'Valid' : 'Invalid'}</p>
        <p>Errors: {errorCount}</p>
        <p>Warnings: {warningCount}</p>
      </div>

      {Object.entries(validation.errors).map(([entityId, errors]) => (
        <div key={entityId}>
          <h4>{entityId}</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Using Dependency Selectors
// ============================================================================

export function DependencyChecker({ entityType, entityId }: { entityType: string; entityId: string }) {
  const state = useConfigStore.getState();

  const canDelete = canDeleteEntity(
    state,
    entityType as 'program' | 'form' | 'cta' | 'branch',
    entityId
  );

  const dependencies = getEntityDependencies(
    state,
    entityType as 'program' | 'form' | 'cta' | 'branch',
    entityId
  );

  return (
    <div>
      <h3>Dependency Check</h3>
      <p>Can delete: {canDelete ? 'Yes' : 'No'}</p>

      {!canDelete && (
        <div>
          <p>Dependencies:</p>
          <ul>
            {dependencies.programs.length > 0 && (
              <li>Programs: {dependencies.programs.join(', ')}</li>
            )}
            {dependencies.forms.length > 0 && (
              <li>Forms: {dependencies.forms.join(', ')}</li>
            )}
            {dependencies.ctas.length > 0 && (
              <li>CTAs: {dependencies.ctas.join(', ')}</li>
            )}
            {dependencies.branches.length > 0 && (
              <li>Branches: {dependencies.branches.join(', ')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Config Statistics Dashboard
// ============================================================================

export function ConfigStatistics() {
  const state = useConfigStore.getState();
  const stats = getConfigStatistics(state);
  const deployable = isConfigDeployable(state);

  return (
    <div className="stats-dashboard">
      <h2>Configuration Statistics</h2>

      <div className="stats-grid">
        <div className="stat">
          <span className="label">Programs</span>
          <span className="value">{stats.programs}</span>
        </div>

        <div className="stat">
          <span className="label">Forms</span>
          <span className="value">{stats.forms}</span>
        </div>

        <div className="stat">
          <span className="label">CTAs</span>
          <span className="value">{stats.ctas}</span>
        </div>

        <div className="stat">
          <span className="label">Branches</span>
          <span className="value">{stats.branches}</span>
        </div>

        <div className="stat">
          <span className="label">Total Fields</span>
          <span className="value">{stats.totalFields}</span>
        </div>

        <div className="stat">
          <span className="label">Orphaned</span>
          <span className="value">{stats.orphanedEntities}</span>
        </div>
      </div>

      <div className={`deployment-status ${deployable ? 'ready' : 'blocked'}`}>
        {deployable ? (
          <p>Configuration is ready to deploy</p>
        ) : (
          <p>Configuration has issues preventing deployment</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Lists with Optimized Rendering
// ============================================================================

const ProgramListItem = React.memo(({ programId }: { programId: string }) => {
  const program = useProgram(programId);
  const programs = usePrograms();

  if (!program) return null;

  return (
    <li>
      <span>{program.program_name}</span>
      <button onClick={() => programs.updateProgram(programId, { program_name: 'Updated' })}>
        Edit
      </button>
      <button onClick={() => programs.deleteProgram(programId)}>Delete</button>
    </li>
  );
});

export function ProgramsList() {
  const allPrograms = useAllPrograms();

  return (
    <div>
      <h2>Programs ({allPrograms.length})</h2>
      <ul>
        {allPrograms.map((program) => (
          <ProgramListItem key={program.program_id} programId={program.program_id} />
        ))}
      </ul>
    </div>
  );
}

const FormListItem = React.memo(({ formId }: { formId: string }) => {
  const form = useForm(formId);
  const forms = useForms();

  if (!form) return null;

  return (
    <li>
      <span>{form.title}</span>
      <span className="field-count">({form.fields.length} fields)</span>
      <button onClick={() => forms.setActiveForm(formId)}>Edit</button>
      <button onClick={() => forms.deleteForm(formId)}>Delete</button>
    </li>
  );
});

export function FormsList() {
  const allForms = useAllForms();

  return (
    <div>
      <h2>Forms ({allForms.length})</h2>
      <ul>
        {allForms.map((form) => (
          <FormListItem key={form.form_id} formId={form.form_id} />
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Modal Management
// ============================================================================

export function ModalSystem() {
  const ui = useUI();
  const modalStack = ui.modalStack;

  const handleOpenModal = () => {
    ui.pushModal('delete-confirmation', {
      entityId: 'form-123',
      entityName: 'Volunteer Application',
    });
  };

  const handleConfirm = () => {
    // Perform action
    ui.popModal();
  };

  const handleCancel = () => {
    ui.popModal();
  };

  return (
    <div>
      <button onClick={handleOpenModal}>Delete Form</button>

      {modalStack.map((modal, index) => {
        if (modal.type === 'delete-confirmation') {
          return (
            <div key={index} className="modal">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete "{modal.props.entityName}"?</p>
              <button onClick={handleConfirm}>Delete</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Loading States
// ============================================================================

export function LoadingStates() {
  const ui = useUI();
  const isLoadingConfig = ui.loading['config'] || false;
  const isSaving = ui.loading['save'] || false;
  const isDeploying = ui.loading['deploy'] || false;

  return (
    <div>
      {isLoadingConfig && <div className="spinner">Loading configuration...</div>}
      {isSaving && <div className="spinner">Saving...</div>}
      {isDeploying && <div className="spinner">Deploying...</div>}

      <div className="status">
        <p>Config: {isLoadingConfig ? 'Loading' : 'Ready'}</p>
        <p>Save: {isSaving ? 'Saving' : 'Idle'}</p>
        <p>Deploy: {isDeploying ? 'Deploying' : 'Idle'}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 11: Custom Selector Hook
// ============================================================================

/**
 * Custom hook that combines multiple selectors
 */
export function useFormWithDependencies(formId: string | null) {
  return useConfigStore((state) => {
    if (!formId) return null;

    const form = state.forms.getForm(formId);
    if (!form) return null;

    const program = state.programs.getProgram(form.program);
    const dependencies = state.forms.getFormDependencies(formId);
    const errors = state.validation.getErrorsForEntity(`form-${formId}`);

    return {
      form,
      program,
      dependencies,
      errors,
      hasErrors: errors.length > 0,
    };
  });
}

// Usage:
export function FormDetailsWithDeps({ formId }: { formId: string }) {
  const data = useFormWithDependencies(formId);

  if (!data) return <div>Form not found</div>;

  return (
    <div>
      <h2>{data.form.title}</h2>
      <p>Program: {data.program?.program_name}</p>
      <p>Used by {data.dependencies.ctas.length} CTA(s)</p>
      {data.hasErrors && (
        <div className="errors">
          {data.errors.map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 12: Batch Operations
// ============================================================================

export function BatchOperations() {
  const forms = useForms();
  const programs = usePrograms();
  const ui = useUI();

  const handleBatchDelete = (formIds: string[]) => {
    formIds.forEach((formId) => {
      forms.deleteForm(formId);
    });

    ui.addToast({
      type: 'success',
      message: `Deleted ${formIds.length} forms`,
    });
  };

  const handleBatchUpdate = (programId: string, formIds: string[]) => {
    formIds.forEach((formId) => {
      forms.updateForm(formId, { program: programId });
    });

    ui.addToast({
      type: 'success',
      message: `Updated ${formIds.length} forms`,
    });
  };

  return (
    <div>
      <button onClick={() => handleBatchDelete(['form1', 'form2', 'form3'])}>
        Delete Selected
      </button>
    </div>
  );
}
