/**
 * React Hooks for Config Management
 * Provides hooks for loading, saving, and managing tenant configurations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listTenants,
  loadConfig,
  saveConfig,
  deployConfig,
  getTenantMetadata,
} from '@/lib/api/config-operations';
import { ConfigAPIError } from '@/lib/api/errors';
import type { TenantConfig } from '@/types/config';
import type { TenantListItem, TenantMetadata, LoadConfigResponse } from '@/types/api';

// ============================================================================
// TENANT LIST HOOK
// ============================================================================

export interface UseTenantListResult {
  tenants: TenantListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage tenant list
 * Automatically fetches on mount
 */
export function useTenantList(): UseTenantListResult {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listTenants();
      setTenants(data);
    } catch (err) {
      const message =
        err instanceof ConfigAPIError ? err.getUserMessage() : 'Failed to load tenants';
      setError(message);
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    refetch: fetchTenants,
  };
}

// ============================================================================
// TENANT METADATA HOOK
// ============================================================================

export interface UseTenantMetadataResult {
  metadata: TenantMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch tenant metadata without loading full config
 */
export function useTenantMetadata(tenantId: string | null): UseTenantMetadataResult {
  const [metadata, setMetadata] = useState<TenantMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!tenantId) {
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTenantMetadata(tenantId);
      setMetadata(data);
    } catch (err) {
      const message =
        err instanceof ConfigAPIError ? err.getUserMessage() : 'Failed to load metadata';
      setError(message);
      console.error('Failed to fetch metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
  };
}

// ============================================================================
// LOAD CONFIG HOOK
// ============================================================================

export interface UseLoadConfigResult {
  config: TenantConfig | null;
  metadata: TenantMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load tenant configuration
 * Only loads when tenantId is provided
 */
export function useLoadConfig(tenantId: string | null): UseLoadConfigResult {
  const [configData, setConfigData] = useState<LoadConfigResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!tenantId) {
      setConfigData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadConfig(tenantId);
      setConfigData(data);
    } catch (err) {
      const message =
        err instanceof ConfigAPIError ? err.getUserMessage() : 'Failed to load configuration';
      setError(message);
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config: configData?.config || null,
    metadata: configData?.metadata || null,
    loading,
    error,
    refetch: fetchConfig,
  };
}

// ============================================================================
// SAVE CONFIG HOOK
// ============================================================================

export interface UseSaveConfigResult {
  saveConfig: (tenantId: string, config: TenantConfig) => Promise<void>;
  saving: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Hook to save tenant configuration
 * Provides save function and tracks save state
 */
export function useSaveConfig(): UseSaveConfigResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async (tenantId: string, config: TenantConfig) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await saveConfig(tenantId, config, { createBackup: true });
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof ConfigAPIError ? err.getUserMessage() : 'Failed to save configuration';
      setError(message);
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    saveConfig: handleSave,
    saving,
    error,
    success,
    reset,
  };
}

// ============================================================================
// DEPLOY CONFIG HOOK
// ============================================================================

export interface UseDeployConfigResult {
  deployConfig: (tenantId: string, config: TenantConfig) => Promise<void>;
  deploying: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Hook to deploy tenant configuration
 * Similar to save but enforces validation and always creates backup
 */
export function useDeployConfig(): UseDeployConfigResult {
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDeploy = useCallback(async (tenantId: string, config: TenantConfig) => {
    setDeploying(true);
    setError(null);
    setSuccess(false);

    try {
      await deployConfig(tenantId, config);
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof ConfigAPIError ? err.getUserMessage() : 'Failed to deploy configuration';
      setError(message);
      console.error('Failed to deploy config:', err);
    } finally {
      setDeploying(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    deployConfig: handleDeploy,
    deploying,
    error,
    success,
    reset,
  };
}

// ============================================================================
// COMBINED CONFIG MANAGER HOOK
// ============================================================================

export interface UseConfigManagerResult {
  // Tenant list
  tenants: TenantListItem[];
  tenantsLoading: boolean;
  tenantsError: string | null;
  refetchTenants: () => Promise<void>;

  // Current config
  config: TenantConfig | null;
  configLoading: boolean;
  configError: string | null;
  loadConfig: (tenantId: string) => Promise<void>;

  // Save/deploy
  saveConfig: (tenantId: string, config: TenantConfig) => Promise<void>;
  deployConfig: (tenantId: string, config: TenantConfig) => Promise<void>;
  saving: boolean;
  deploying: boolean;
  saveError: string | null;
  deployError: string | null;
  saveSuccess: boolean;
  deploySuccess: boolean;
  resetSaveState: () => void;
  resetDeployState: () => void;
}

/**
 * Combined hook for complete config management
 * Provides all config operations in a single hook
 */
export function useConfigManager(initialTenantId?: string): UseConfigManagerResult {
  const tenantList = useTenantList();
  const loadConfigResult = useLoadConfig(initialTenantId || null);
  const saveConfigResult = useSaveConfig();
  const deployConfigResult = useDeployConfig();

  const handleLoadConfig = useCallback(async (tenantId: string) => {
    // Load config for the specified tenant
    // Note: The useLoadConfig hook doesn't support dynamic tenantId changes yet
    // This will be implemented when we add Zustand store integration
    console.log('Loading config for tenant:', tenantId);
  }, []);

  return {
    // Tenant list
    tenants: tenantList.tenants,
    tenantsLoading: tenantList.loading,
    tenantsError: tenantList.error,
    refetchTenants: tenantList.refetch,

    // Current config
    config: loadConfigResult.config,
    configLoading: loadConfigResult.loading,
    configError: loadConfigResult.error,
    loadConfig: handleLoadConfig,

    // Save/deploy
    saveConfig: saveConfigResult.saveConfig,
    deployConfig: deployConfigResult.deployConfig,
    saving: saveConfigResult.saving,
    deploying: deployConfigResult.deploying,
    saveError: saveConfigResult.error,
    deployError: deployConfigResult.error,
    saveSuccess: saveConfigResult.success,
    deploySuccess: deployConfigResult.success,
    resetSaveState: saveConfigResult.reset,
    resetDeployState: deployConfigResult.reset,
  };
}
