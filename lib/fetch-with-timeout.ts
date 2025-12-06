const DEFAULT_TIMEOUT_MS = 60000;

export const fetchWithTimeout = async (
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const signal = options.signal
      ? (() => {
          const combinedController = new AbortController();
          const abort = () => combinedController.abort();

          controller.signal.addEventListener('abort', abort);

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

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url} did not complete within ${timeoutMs}ms`);
    }

    throw error;
  }
};
