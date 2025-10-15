/**
 * Retry Logic with Exponential Backoff
 * Retries failed requests with increasing delays
 */

import { ConfigAPIError } from './errors';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  onRetry: () => {}, // No-op by default
};

/**
 * Execute a function with retry logic
 * Retries on network/timeout errors with exponential backoff
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | ConfigAPIError;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error | ConfigAPIError;

      // Don't retry on client errors (4xx) or non-retryable errors
      if (error instanceof ConfigAPIError) {
        if (!error.isRetryable()) {
          throw error;
        }
      }

      // Don't retry on the last attempt
      if (attempt >= opts.maxRetries) {
        throw lastError;
      }

      // Call retry callback
      opts.onRetry(attempt, lastError);

      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry decorator for async functions
 * Usage: const result = await withRetry(asyncFunction, options);
 */
export function withRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => fetchWithRetry(() => fn(...args), options);
}

/**
 * Create a retry wrapper with predefined options
 */
export function createRetryWrapper(options: RetryOptions) {
  return <T>(fn: () => Promise<T>) => fetchWithRetry(fn, options);
}
