/**
 * Custom Error Classes for Config API
 * Provides type-safe error handling with specific error codes
 */

export type ConfigErrorCode =
  // Network errors
  | 'FETCH_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  // Resource errors
  | 'CONFIG_NOT_FOUND'
  | 'TENANT_NOT_FOUND'
  | 'INVALID_TENANT_ID'
  // Validation errors
  | 'VALIDATION_ERROR'
  | 'INVALID_CONFIG'
  | 'PARSE_ERROR'
  // Permission errors
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  // Save errors
  | 'SAVE_FAILED'
  | 'VERSION_CONFLICT'
  | 'STORAGE_ERROR'
  // Generic errors
  | 'UNKNOWN_ERROR'
  | 'SERVER_ERROR';

export class ConfigAPIError extends Error {
  public readonly code: ConfigErrorCode;
  public readonly details?: unknown;
  public readonly statusCode?: number;

  constructor(code: ConfigErrorCode, message: string, details?: unknown, statusCode?: number) {
    super(message);
    this.name = 'ConfigAPIError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if ('captureStackTrace' in Error && typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, ConfigAPIError);
    }
  }

  /**
   * Check if error is retryable (network/timeout errors)
   */
  isRetryable(): boolean {
    return ['FETCH_FAILED', 'NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'].includes(this.code);
  }

  /**
   * Get user-friendly error message with suggestions
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'CONFIG_NOT_FOUND':
        return 'Configuration not found. The tenant may not exist or has not been configured yet.';

      case 'TENANT_NOT_FOUND':
        return 'Tenant not found. Please verify the tenant ID and try again.';

      case 'NETWORK_ERROR':
      case 'FETCH_FAILED':
        return 'Network error occurred. Please check your connection and try again.';

      case 'TIMEOUT':
        return 'Request timed out. The server may be busy. Please try again.';

      case 'VALIDATION_ERROR':
        return 'Configuration validation failed. Please check your changes and try again.';

      case 'INVALID_CONFIG':
        return 'Invalid configuration format. The config file may be corrupted.';

      case 'SAVE_FAILED':
        return 'Failed to save configuration. Please try again.';

      case 'VERSION_CONFLICT':
        return 'Configuration was modified by another user. Please reload and try again.';

      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action.';

      case 'FORBIDDEN':
        return 'Access forbidden. You do not have permission to access this resource.';

      default:
        return this.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Convert to plain object for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Handle API errors and convert to ConfigAPIError
 */
export function handleAPIError(error: unknown): never {
  // Already a ConfigAPIError
  if (error instanceof ConfigAPIError) {
    throw error;
  }

  // Fetch/Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new ConfigAPIError('NETWORK_ERROR', 'Network request failed', error);
  }

  // Generic Error
  if (error instanceof Error) {
    throw new ConfigAPIError('UNKNOWN_ERROR', error.message, error);
  }

  // Unknown error type
  throw new ConfigAPIError('UNKNOWN_ERROR', 'An unexpected error occurred', error);
}

/**
 * Parse HTTP response errors
 */
export async function parseHTTPError(response: Response): Promise<ConfigAPIError> {
  const statusCode = response.status;
  let errorData: { message?: string; code?: string; details?: unknown } | null = null;

  try {
    errorData = await response.json();
  } catch {
    // Response body is not JSON
  }

  const message = errorData?.message || response.statusText || 'Request failed';

  // Map status codes to error codes
  let code: ConfigErrorCode;
  switch (statusCode) {
    case 401:
      code = 'UNAUTHORIZED';
      break;
    case 403:
      code = 'FORBIDDEN';
      break;
    case 404:
      code = 'CONFIG_NOT_FOUND';
      break;
    case 409:
      code = 'VERSION_CONFLICT';
      break;
    case 422:
      code = 'VALIDATION_ERROR';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = 'SERVER_ERROR';
      break;
    default:
      code = 'FETCH_FAILED';
  }

  return new ConfigAPIError(code, message, errorData?.details, statusCode);
}
