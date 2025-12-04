/**
 * Cache fallback utilities for graceful degradation.
 *
 * Provides utilities to handle cache failures gracefully by falling back
 * to dynamic rendering when the cache is unavailable.
 *
 * Requirements:
 * - 8.2: WHEN cache invalidation fails THEN the System SHALL log the error and serve stale content
 * - 8.3: IF the cache is unavailable THEN the Application SHALL fall back to dynamic rendering
 */

/**
 * Wraps a cached function with a fallback for graceful degradation.
 *
 * If the cached function fails, it will:
 * 1. Log the error for monitoring
 * 2. Execute the fallback function to serve dynamic content
 *
 * @param cachedFn - The primary cached function to execute
 * @param fallbackFn - The fallback function to execute if cache fails
 * @param options - Optional configuration
 * @returns The result from either the cached or fallback function
 *
 * @example
 * ```typescript
 * const data = await withCacheFallback(
 *   () => getCachedPricingPlans(),
 *   () => fetchPricingPlansFromDb(),
 *   { context: 'PricingSection' }
 * );
 * ```
 */
export async function withCacheFallback<T>(
  cachedFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  options?: {
    context?: string;
    onError?: (error: Error) => void;
  }
): Promise<T> {
  try {
    return await cachedFn();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const context = options?.context ? ` [${options.context}]` : "";

    // Log error for monitoring (Requirement 8.2)
    console.error(
      `[CacheFallback]${context} Cache failed, falling back to dynamic:`,
      errorMessage
    );

    // Call custom error handler if provided
    if (options?.onError && error instanceof Error) {
      options.onError(error);
    }

    // Fall back to dynamic rendering (Requirement 8.3)
    return await fallbackFn();
  }
}

/**
 * Wraps a cached function with a default value fallback.
 *
 * Useful when you have a sensible default that can be used
 * if both cache and dynamic fetch fail.
 *
 * @param cachedFn - The primary cached function to execute
 * @param defaultValue - The default value to return on failure
 * @param options - Optional configuration
 * @returns The result from the cached function or the default value
 *
 * @example
 * ```typescript
 * const plans = await withCacheDefault(
 *   () => getCachedPricingPlans(),
 *   [], // Return empty array if cache fails
 *   { context: 'PricingSection' }
 * );
 * ```
 */
export async function withCacheDefault<T>(
  cachedFn: () => Promise<T>,
  defaultValue: T,
  options?: {
    context?: string;
    onError?: (error: Error) => void;
  }
): Promise<T> {
  try {
    return await cachedFn();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const context = options?.context ? ` [${options.context}]` : "";

    // Log error for monitoring
    console.error(
      `[CacheFallback]${context} Cache failed, using default value:`,
      errorMessage
    );

    // Call custom error handler if provided
    if (options?.onError && error instanceof Error) {
      options.onError(error);
    }

    return defaultValue;
  }
}

/**
 * Creates a cached function with automatic fallback behavior.
 *
 * This is a higher-order function that wraps a data fetching function
 * with cache-first behavior and automatic fallback.
 *
 * @param fetchFn - The data fetching function
 * @param options - Configuration options
 * @returns A function that tries cache first, then falls back to fetch
 *
 * @example
 * ```typescript
 * const getPricingWithFallback = createCachedWithFallback(
 *   fetchPricingPlans,
 *   { context: 'Pricing', defaultValue: [] }
 * );
 *
 * const plans = await getPricingWithFallback();
 * ```
 */
export function createCachedWithFallback<T, Args extends unknown[]>(
  fetchFn: (...args: Args) => Promise<T>,
  options: {
    context?: string;
    defaultValue?: T;
    onError?: (error: Error) => void;
  } = {}
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fetchFn(...args);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const context = options.context ? ` [${options.context}]` : "";

      console.error(
        `[CacheFallback]${context} Fetch failed:`,
        errorMessage
      );

      if (options.onError && error instanceof Error) {
        options.onError(error);
      }

      if (options.defaultValue !== undefined) {
        return options.defaultValue;
      }

      throw error;
    }
  };
}
