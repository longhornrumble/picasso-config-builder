/**
 * Lambda Proxy Client for S3 Operations
 * Uses HTTP API Gateway to invoke Lambda functions that have S3 access
 * This approach is more secure than direct S3 access from the browser
 */

import { ConfigAPIError, parseHTTPError } from './errors';
import { fetchWithRetry } from './retry';
import type { TenantConfig } from '@/types/config';
import type {
  TenantListItem,
  LoadConfigResponse,
  SaveConfigResponse,
  TenantMetadata,
} from '@/types/api';

// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourapi.com/api';

/**
 * Configuration API Client
 * All methods use retry logic for network resilience
 */
export class ConfigAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * List all tenants from S3
   */
  async listTenants(): Promise<TenantListItem[]> {
    return fetchWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/config/tenants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      const data = await response.json();
      return data.tenants || [];
    });
  }

  /**
   * Get metadata for a specific tenant
   */
  async getTenantMetadata(tenantId: string): Promise<TenantMetadata> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    return fetchWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/config/${tenantId}/metadata`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      return response.json();
    });
  }

  /**
   * Load configuration for a specific tenant
   */
  async loadConfig(tenantId: string): Promise<LoadConfigResponse> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    return fetchWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/config/${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.config) {
        throw new ConfigAPIError('INVALID_CONFIG', 'Response missing config field');
      }

      return {
        config: data.config as TenantConfig,
        metadata: data.metadata || {
          tenantId,
          tenantName: data.config.chat_title || tenantId,
          lastModified: Date.now(),
          configVersion: data.config.version || '1.0',
        },
      };
    });
  }

  /**
   * Save configuration to S3
   * Note: This performs validation before saving
   */
  async saveConfig(
    tenantId: string,
    config: TenantConfig,
    options: { createBackup?: boolean } = {}
  ): Promise<SaveConfigResponse> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    if (!config) {
      throw new ConfigAPIError('VALIDATION_ERROR', 'Config cannot be null or undefined');
    }

    // Ensure tenant_id in config matches the request
    if (config.tenant_id && config.tenant_id !== tenantId) {
      throw new ConfigAPIError(
        'VALIDATION_ERROR',
        'Config tenant_id does not match requested tenant ID'
      );
    }

    console.log('[API CLIENT] saveConfig called with config keys:', Object.keys(config));

    return fetchWithRetry(
      async () => {
        const requestBody = {
          config,
          createBackup: options.createBackup ?? true,
        };
        console.log('[API CLIENT] Request body config keys:', Object.keys(requestBody.config));

        const response = await fetch(`${this.baseUrl}/config/${tenantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw await parseHTTPError(response);
        }

        return response.json();
      },
      {
        maxRetries: 2, // Save operations get fewer retries
      }
    );
  }

  /**
   * Deploy configuration - sends full config with merge=false to bypass section validation
   */
  async deployConfig(tenantId: string, config: TenantConfig): Promise<SaveConfigResponse> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    if (!config) {
      throw new ConfigAPIError('VALIDATION_ERROR', 'Config cannot be null or undefined');
    }

    return fetchWithRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/config/${tenantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config,
            merge: false,  // Skip validation and merge - save full config directly
            createBackup: true,
          }),
        });

        if (!response.ok) {
          throw await parseHTTPError(response);
        }

        return response.json();
      },
      {
        maxRetries: 2,
      }
    );
  }

  /**
   * Delete tenant configuration (admin operation)
   */
  async deleteConfig(tenantId: string): Promise<void> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    return fetchWithRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/config/${tenantId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw await parseHTTPError(response);
        }
      },
      {
        maxRetries: 1, // Delete operations should not retry multiple times
      }
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const configApiClient = new ConfigAPIClient();
