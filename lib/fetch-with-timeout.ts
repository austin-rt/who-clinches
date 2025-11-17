/**
 * Fetch with Timeout Utility
 *
 * Wraps the native fetch API with a configurable timeout.
 * If a request doesn't complete within the timeout period, it will be aborted.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (same as native fetch)
 * @param timeoutMs - Timeout in milliseconds (default: 60000 = 60 seconds)
 * @returns Promise that resolves to the Response, or rejects with a timeout error
 */

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds

export async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // Merge the abort signal with any existing signal in options
    const signal = options.signal
      ? // If there's already a signal, create a combined signal that aborts if either aborts
        (() => {
          const combinedController = new AbortController();
          const abort = () => combinedController.abort();

          // Abort if timeout signal aborts
          controller.signal.addEventListener('abort', abort);

          // Abort if existing signal aborts
          if (options.signal) {
            options.signal.addEventListener('abort', abort);
          }

          return combinedController.signal;
        })()
      : controller.signal;

    const response = await fetch(url, {
      ...options,
      signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if the error was due to timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timeout: ${url} did not complete within ${timeoutMs}ms`
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Fetch with timeout that also handles JSON parsing
 * Convenience wrapper for common use case
 */
export async function fetchJSONWithTimeout<T = unknown>(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

