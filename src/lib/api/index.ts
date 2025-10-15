/**
 * API Module Exports
 * Central export point for all API-related functionality
 */

// Client
export { ConfigAPIClient, configApiClient } from './client';

// Operations
export {
  listTenants,
  getTenantMetadata,
  loadConfig,
  saveConfig,
  deployConfig,
  deleteConfig,
  checkAPIHealth,
  isValidTenantId,
  sanitizeTenantId,
} from './config-operations';

// Errors
export { ConfigAPIError, handleAPIError, parseHTTPError } from './errors';
export type { ConfigErrorCode } from './errors';

// Retry logic
export { fetchWithRetry, withRetry, createRetryWrapper } from './retry';
export type { RetryOptions } from './retry';
