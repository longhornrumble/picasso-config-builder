/**
 * Config Operations
 * High-level API for configuration management
 * Exports simplified functions for use in components and hooks
 */

import { configApiClient } from './client';
import { ConfigAPIError, handleAPIError } from './errors';
import type { TenantConfig } from '@/types/config';
import type { TenantListItem, LoadConfigResponse, TenantMetadata } from '@/types/api';

/**
 * List all tenant configurations from S3
 * Returns array of tenant metadata for display in tenant selector
 */
export async function listTenants(): Promise<TenantListItem[]> {
  try {
    return await configApiClient.listTenants();
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Get metadata for a specific tenant without loading full config
 * Useful for checking if tenant exists and getting basic info
 */
export async function getTenantMetadata(tenantId: string): Promise<TenantMetadata> {
  try {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID is required');
    }

    return await configApiClient.getTenantMetadata(tenantId);
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Load tenant configuration from S3
 * Performs basic validation and returns parsed config
 */
export async function loadConfig(tenantId: string): Promise<LoadConfigResponse> {
  try {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID is required');
    }

    const response = await configApiClient.loadConfig(tenantId);

    // Basic structure validation
    if (!response.config.tenant_id) {
      throw new ConfigAPIError('INVALID_CONFIG', 'Config missing tenant_id');
    }

    if (!response.config.version) {
      throw new ConfigAPIError('INVALID_CONFIG', 'Config missing version');
    }

    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Save tenant configuration to S3
 * Creates backup before saving (unless disabled)
 * Updates version and timestamp automatically
 */
export async function saveConfig(
  tenantId: string,
  config: TenantConfig,
  options: { createBackup?: boolean } = {}
): Promise<void> {
  try {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID is required');
    }

    if (!config) {
      throw new ConfigAPIError('VALIDATION_ERROR', 'Config is required');
    }

    // Update metadata
    const updatedConfig: TenantConfig = {
      ...config,
      tenant_id: tenantId,
      generated_at: Date.now(),
      version: incrementVersion(config.version),
    };

    await configApiClient.saveConfig(tenantId, updatedConfig, options);
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Deploy tenant configuration
 * Same as save, but enforces validation and always creates backup
 */
export async function deployConfig(tenantId: string, config: TenantConfig): Promise<void> {
  try {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID is required');
    }

    if (!config) {
      throw new ConfigAPIError('VALIDATION_ERROR', 'Config is required');
    }

    // Don't spread config - it's already been filtered to editable sections only
    // The Lambda will add tenant_id, generated_at, etc. from the base config during merge
    await configApiClient.deployConfig(tenantId, config);
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Delete tenant configuration (admin operation)
 * Use with caution - this cannot be undone unless backup exists
 */
export async function deleteConfig(tenantId: string): Promise<void> {
  try {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID is required');
    }

    await configApiClient.deleteConfig(tenantId);
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Check if API is available
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    return await configApiClient.healthCheck();
  } catch {
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Increment semantic version number
 * Examples: "1.0" -> "1.1", "1.9" -> "1.10", "2.5.3" -> "2.5.4"
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');

  // Increment the last part
  const lastIndex = parts.length - 1;
  parts[lastIndex] = String(parseInt(parts[lastIndex], 10) + 1);

  return parts.join('.');
}

/**
 * Validate tenant ID format
 * Should be alphanumeric, can include hyphens and underscores
 */
export function isValidTenantId(tenantId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(tenantId);
}

/**
 * Sanitize tenant ID for use in API calls
 */
export function sanitizeTenantId(tenantId: string): string {
  return tenantId.trim().toUpperCase();
}
