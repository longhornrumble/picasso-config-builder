/**
 * Config API Usage Examples
 * This file demonstrates how to use the config operations and hooks
 */

import React from 'react';
import {
  useTenantList,
  useLoadConfig,
  useSaveConfig,
  useDeployConfig,
  useConfigManager,
} from '@/hooks/useConfig';
import { loadConfig, saveConfig, ConfigAPIError } from '@/lib/api';
import type { TenantConfig } from '@/types/config';

// ============================================================================
// EXAMPLE 1: Simple Tenant List
// ============================================================================

export function TenantListExample() {
  const { tenants, loading, error, refetch } = useTenantList();

  if (loading) return <div>Loading tenants...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Tenants</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {tenants.map((tenant) => (
          <li key={tenant.tenantId}>
            {tenant.tenantName} - {tenant.version}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Load and Display Config
// ============================================================================

export function ConfigViewerExample({ tenantId }: { tenantId: string }) {
  const { config, loading, error, refetch } = useLoadConfig(tenantId);

  if (loading) return <div>Loading config...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>No config found</div>;

  return (
    <div>
      <h2>{config.chat_title}</h2>
      <p>Tenant ID: {config.tenant_id}</p>
      <p>Version: {config.version}</p>
      <p>Tier: {config.subscription_tier}</p>
      <button onClick={refetch}>Reload</button>

      <h3>Features</h3>
      <ul>
        <li>Streaming: {config.features.streaming ? 'Yes' : 'No'}</li>
        <li>Forms: {config.features.conversational_forms ? 'Yes' : 'No'}</li>
        <li>Smart Cards: {config.features.smart_cards ? 'Yes' : 'No'}</li>
      </ul>

      <h3>Forms</h3>
      <ul>
        {Object.entries(config.conversational_forms || {}).map(([id, form]) => (
          <li key={id}>
            {form.title} ({form.fields.length} fields)
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Save Config with Feedback
// ============================================================================

export function ConfigEditorExample({ tenantId }: { tenantId: string }) {
  const { config, loading: configLoading } = useLoadConfig(tenantId);
  const { saveConfig: save, saving, error, success, reset } = useSaveConfig();

  const [editedConfig, setEditedConfig] = React.useState<TenantConfig | null>(null);

  React.useEffect(() => {
    if (config) {
      setEditedConfig(config);
    }
  }, [config]);

  const handleSave = async () => {
    if (!editedConfig) return;
    await save(tenantId, editedConfig);
  };

  if (configLoading) return <div>Loading...</div>;
  if (!editedConfig) return <div>No config</div>;

  return (
    <div>
      <h2>Edit Config</h2>

      <label>
        Chat Title:
        <input
          type="text"
          value={editedConfig.chat_title}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, chat_title: e.target.value })
          }
        />
      </label>

      <label>
        Welcome Message:
        <textarea
          value={editedConfig.welcome_message}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, welcome_message: e.target.value })
          }
        />
      </label>

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Config'}
      </button>

      {success && <div style={{ color: 'green' }}>Saved successfully!</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {(success || error) && <button onClick={reset}>Dismiss</button>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Deploy with Validation
// ============================================================================

export function DeployConfigExample({ tenantId }: { tenantId: string }) {
  const { config, loading: configLoading } = useLoadConfig(tenantId);
  const { deployConfig: deploy, deploying, error, success, reset } = useDeployConfig();

  const handleDeploy = async () => {
    if (!config) return;

    // In real app, run validation first
    const confirmed = window.confirm('Deploy this config to production?');
    if (confirmed) {
      await deploy(tenantId, config);
    }
  };

  if (configLoading) return <div>Loading...</div>;
  if (!config) return <div>No config</div>;

  return (
    <div>
      <h2>Deploy Config</h2>
      <p>Current version: {config.version}</p>

      <button onClick={handleDeploy} disabled={deploying}>
        {deploying ? 'Deploying...' : 'Deploy to Production'}
      </button>

      {success && (
        <div style={{ color: 'green' }}>
          Deployed successfully! Version: {config.version}
        </div>
      )}
      {error && <div style={{ color: 'red' }}>Deployment failed: {error}</div>}
      {(success || error) && <button onClick={reset}>Dismiss</button>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Combined Config Manager
// ============================================================================

export function ConfigManagerExample() {
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);

  const {
    // Tenant list
    tenants,
    tenantsLoading,
    tenantsError,
    refetchTenants,
    // Config
    config,
    configLoading,
    configError,
    loadConfig,
    // Save/Deploy
    saveConfig,
    deployConfig,
    saving,
    deploying,
    saveError,
    deployError,
    saveSuccess,
    deploySuccess,
    resetSaveState,
    resetDeployState,
  } = useConfigManager();

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenant(tenantId);
    loadConfig(tenantId);
  };

  return (
    <div>
      <h1>Config Manager</h1>

      {/* Tenant Selector */}
      <div>
        <h2>Select Tenant</h2>
        {tenantsLoading && <p>Loading tenants...</p>}
        {tenantsError && <p style={{ color: 'red' }}>{tenantsError}</p>}
        <select onChange={(e) => handleSelectTenant(e.target.value)} value={selectedTenant || ''}>
          <option value="">-- Select Tenant --</option>
          {tenants.map((tenant) => (
            <option key={tenant.tenantId} value={tenant.tenantId}>
              {tenant.tenantName}
            </option>
          ))}
        </select>
        <button onClick={refetchTenants}>Refresh</button>
      </div>

      {/* Config Editor */}
      {selectedTenant && (
        <div>
          <h2>Config</h2>
          {configLoading && <p>Loading config...</p>}
          {configError && <p style={{ color: 'red' }}>{configError}</p>}
          {config && (
            <>
              <h3>{config.chat_title}</h3>
              <p>Version: {config.version}</p>
              <button onClick={() => saveConfig(selectedTenant, config)} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => deployConfig(selectedTenant, config)} disabled={deploying}>
                {deploying ? 'Deploying...' : 'Deploy'}
              </button>

              {saveSuccess && <p style={{ color: 'green' }}>Saved!</p>}
              {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
              {deploySuccess && <p style={{ color: 'green' }}>Deployed!</p>}
              {deployError && <p style={{ color: 'red' }}>{deployError}</p>}

              {(saveSuccess || saveError) && <button onClick={resetSaveState}>Clear</button>}
              {(deploySuccess || deployError) && (
                <button onClick={resetDeployState}>Clear</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Direct API Usage (without hooks)
// ============================================================================

export async function directAPIExample() {
  try {
    // Load config
    console.log('Loading config...');
    const { config, metadata } = await loadConfig('MYR384719');
    console.log('Config loaded:', config.chat_title);
    console.log('Last modified:', new Date(metadata.lastModified));

    // Modify config
    const updatedConfig: TenantConfig = {
      ...config,
      chat_title: 'Updated Title',
      welcome_message: 'Welcome to our updated chat!',
    };

    // Save config
    console.log('Saving config...');
    await saveConfig('MYR384719', updatedConfig, { createBackup: true });
    console.log('Config saved successfully!');
  } catch (error) {
    if (error instanceof ConfigAPIError) {
      console.error('Error code:', error.code);
      console.error('User message:', error.getUserMessage());
      console.error('Retryable:', error.isRetryable());
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// ============================================================================
// EXAMPLE 7: Error Handling
// ============================================================================

export function ErrorHandlingExample({ tenantId }: { tenantId: string }) {
  const { config, loading, error } = useLoadConfig(tenantId);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    window.location.reload();
  };

  if (loading) {
    return (
      <div>
        <p>Loading configuration...</p>
        <p>This may take a few moments.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
        <h3>Configuration Error</h3>
        <p>{error}</p>
        <p>Retry attempts: {retryCount}</p>
        <button onClick={handleRetry}>Retry</button>
        <p style={{ fontSize: '12px', color: '#666' }}>
          If the problem persists, please contact support.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <p>No configuration found for tenant: {tenantId}</p>
        <p>Please select a valid tenant or create a new configuration.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{config.chat_title}</h2>
      <p>Configuration loaded successfully!</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Loading States
// ============================================================================

export function LoadingStatesExample({ tenantId }: { tenantId: string }) {
  const { config, loading, error } = useLoadConfig(tenantId);
  const { saveConfig: save, saving, success } = useSaveConfig();

  const getStatus = () => {
    if (loading) return 'loading';
    if (saving) return 'saving';
    if (success) return 'success';
    if (error) return 'error';
    return 'idle';
  };

  const status = getStatus();

  const statusMessages = {
    loading: 'Loading configuration...',
    saving: 'Saving changes...',
    success: 'Changes saved successfully!',
    error: 'An error occurred',
    idle: 'Ready',
  };

  const statusColors = {
    loading: '#0066cc',
    saving: '#ff9900',
    success: '#00cc66',
    error: '#cc0000',
    idle: '#666666',
  };

  return (
    <div>
      <div
        style={{
          padding: '10px',
          backgroundColor: statusColors[status],
          color: 'white',
          borderRadius: '4px',
          marginBottom: '20px',
        }}
      >
        {statusMessages[status]}
      </div>

      {config && (
        <div>
          <h2>{config.chat_title}</h2>
          <button onClick={() => save(tenantId, config)} disabled={loading || saving}>
            Save Config
          </button>
        </div>
      )}
    </div>
  );
}
