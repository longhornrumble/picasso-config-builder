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
} from '@/types/api';
import type { Proposal } from '@/types/proposals';

// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourapi.com/api';

/**
 * Configuration API Client
 * All methods use retry logic for network resilience
 */
export class ConfigAPIClient {
  private baseUrl: string;
  private tokenProvider: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Set the token provider function (typically from Clerk's getToken)
   * Called once during app initialization to wire auth context into the API client
   */
  setTokenProvider(provider: () => Promise<string | null>): void {
    this.tokenProvider = provider;
  }

  /**
   * Get authentication headers from Clerk session token
   * Token is fetched on-demand from Clerk — never stored in localStorage
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.tokenProvider) {
      return {};
    }
    try {
      const token = await this.tokenProvider();
      if (!token) {
        return {};
      }
      return {
        'Authorization': `Bearer ${token}`,
      };
    } catch {
      return {};
    }
  }

  /**
   * Handle 401 responses by dispatching session expired event
   */
  private handle401Response(): void {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
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
          ...(await this.getAuthHeaders()),
        },
      });

      if (response.status === 401) {
        this.handle401Response();
        throw await parseHTTPError(response);
      }

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      const data = await response.json();
      return data.tenants || [];
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
          ...(await this.getAuthHeaders()),
        },
      });

      if (response.status === 401) {
        this.handle401Response();
        throw await parseHTTPError(response);
      }

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.config) {
        throw new ConfigAPIError('INVALID_CONFIG', 'Response missing config field');
      }

      // Prefer the ETag response header (wire-native), fall back to the
      // body field for API Gateway deployments that strip ETag.
      const etag = response.headers.get('ETag') || data.etag || undefined;

      return {
        config: data.config as TenantConfig,
        metadata: data.metadata || {
          tenantId,
          tenantName: data.config.chat_title || tenantId,
          lastModified: Date.now(),
          configVersion: data.config.version || '1.0',
        },
        etag,
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
    options: { createBackup?: boolean; ifMatch?: string } = {}
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
          // Explicit merge=true: the server merges these editable sections onto
          // its current S3 base (omitted sections preserved), same as deploy.
          // Pinned so a change to the server's default can't silently turn a
          // save into a full replace. create_backup is snake_case to match the
          // server contract — the old camelCase createBackup was ignored.
          merge: true,
          create_backup: options.createBackup ?? true,
        };
        console.log('[API CLIENT] Request body config keys:', Object.keys(requestBody.config));

        const response = await fetch(`${this.baseUrl}/config/${tenantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(await this.getAuthHeaders()),
            ...(options.ifMatch && { 'If-Match': options.ifMatch }),
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          this.handle401Response();
          throw await parseHTTPError(response);
        }

        // 409 Conflict means the server detected an ETag mismatch.
        // Surface a typed error carrying the server's current config +
        // etag so the UI can prompt the user to reload without losing
        // their local edits.
        if (response.status === 409) {
          let details: unknown = undefined;
          try {
            details = await response.json();
          } catch {
            // ignore JSON parse failures; details stays undefined
          }
          throw new ConfigAPIError(
            'VERSION_CONFLICT',
            'This config was updated elsewhere while you were editing. Reload to apply your changes on top of the latest version.',
            details,
            409
          );
        }

        if (!response.ok) {
          throw await parseHTTPError(response);
        }

        const data = await response.json();
        // Attach the new ETag from the response header as a fallback
        // for callers that need to chain another save.
        const etag = response.headers.get('ETag') || data.etag || undefined;
        return { ...data, etag } as SaveConfigResponse;
      },
      {
        // No auto-retry: this is a non-idempotent conditional write (If-Match).
        // A network error after the request is sent is ambiguous — the write
        // may have succeeded — and a retry would reuse the now-stale If-Match
        // and surface a false 409 for the caller's own successful write. Fail
        // fast; the operator re-saves (reloading a fresh ETag) if needed.
        maxRetries: 1,
      }
    );
  }

  /**
   * Deploy configuration — same PUT /config/{id} as save, with merge=true and
   * a forced backup. Sends If-Match when provided so a concurrent edit
   * surfaces as a 409 instead of being silently overwritten.
   */
  async deployConfig(
    tenantId: string,
    config: TenantConfig,
    options: { ifMatch?: string } = {}
  ): Promise<SaveConfigResponse> {
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
            ...(await this.getAuthHeaders()),
            ...(options.ifMatch && { 'If-Match': options.ifMatch }),
          },
          body: JSON.stringify({
            config,
            merge: true,  // Merge editable sections with base config to preserve read-only sections
            create_backup: true,
          }),
        });

        if (response.status === 401) {
          this.handle401Response();
          throw await parseHTTPError(response);
        }

        // 409 Conflict — ETag mismatch; same contract as saveConfig so the
        // UI can render the reload banner.
        if (response.status === 409) {
          let details: unknown = undefined;
          try {
            details = await response.json();
          } catch {
            // ignore JSON parse failures; details stays undefined
          }
          throw new ConfigAPIError(
            'VERSION_CONFLICT',
            'This config was updated elsewhere while you were editing. Reload to apply your changes on top of the latest version.',
            details,
            409
          );
        }

        if (!response.ok) {
          throw await parseHTTPError(response);
        }

        const data = await response.json();
        const etag = response.headers.get('ETag') || data.etag || undefined;
        return { ...data, etag } as SaveConfigResponse;
      },
      {
        // No auto-retry — same rationale as saveConfig: a non-idempotent
        // conditional write must not be retried on an ambiguous failure.
        maxRetries: 1,
      }
    );
  }

  /**
   * Promote a tenant's staging config to production by dispatching the gated
   * promote-tenant-config workflow. Server-side only — the browser never writes
   * prod (staging can't write prod stores); the backend fires the workflow.
   */
  async promoteConfig(
    tenantId: string
  ): Promise<{ success: boolean; tenant_id: string; message: string; baseline: number }> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    const response = await fetch(`${this.baseUrl}/config/${tenantId}/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
    });

    if (response.status === 401) {
      this.handle401Response();
      throw await parseHTTPError(response);
    }
    if (!response.ok) {
      throw await parseHTTPError(response);
    }
    return await response.json();
  }

  /**
   * Poll the outcome of a promote run started after `after` (the dispatch
   * baseline). found=false until the run appears; then status is
   * queued|in_progress|completed and conclusion is success|failure|null.
   */
  async getPromoteStatus(
    tenantId: string,
    after: number
  ): Promise<{ found: boolean; status?: string; conclusion?: string | null; run_url?: string }> {
    const response = await fetch(
      `${this.baseUrl}/config/${tenantId}/promote/status?after=${encodeURIComponent(String(after))}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders()),
        },
      }
    );

    if (response.status === 401) {
      this.handle401Response();
      throw await parseHTTPError(response);
    }
    if (!response.ok) {
      throw await parseHTTPError(response);
    }
    return await response.json();
  }

  /**
   * Delete tenant configuration (admin operation)
   * @param full - If true, permanently deletes config, all backups, and hash mapping
   */
  async deleteConfig(tenantId: string, full: boolean = false): Promise<void> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    const url = full
      ? `${this.baseUrl}/config/${tenantId}?full=true`
      : `${this.baseUrl}/config/${tenantId}`;

    return fetchWithRetry(
      async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(await this.getAuthHeaders()),
          },
        });

        if (response.status === 401) {
          this.handle401Response();
          throw await parseHTTPError(response);
        }

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
   * Create a new tenant configuration
   */
  async createTenant(request: {
    org_name: string;
    tenant_id: string;
    chat_title?: string;
    chat_subtitle?: string;
    subscription_tier?: string;
    primary_color?: string;
    welcome_message?: string;
    knowledge_base_id?: string;
  }): Promise<{
    success: boolean;
    tenant_id: string;
    tenant_hash: string;
    embed_code: string;
    config: TenantConfig;
  }> {
    return fetchWithRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await this.getAuthHeaders()),
          },
          body: JSON.stringify(request),
        });

        if (response.status === 401) {
          this.handle401Response();
          throw await parseHTTPError(response);
        }

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
   * List pending KB-freshness proposals for a tenant.
   * Returns the proposals newest-first; empty array if none.
   */
  async listProposals(tenantId: string): Promise<Proposal[]> {
    if (!tenantId || tenantId.trim() === '') {
      throw new ConfigAPIError('INVALID_TENANT_ID', 'Tenant ID cannot be empty');
    }

    return fetchWithRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/proposals?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(await this.getAuthHeaders()),
          },
        }
      );

      if (response.status === 401) {
        this.handle401Response();
        throw await parseHTTPError(response);
      }

      if (!response.ok) {
        throw await parseHTTPError(response);
      }

      const data = await response.json();
      return (data.proposals || []) as Proposal[];
    });
  }

}

// Export singleton instance
export const configApiClient = new ConfigAPIClient();
