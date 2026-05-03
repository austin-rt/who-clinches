type ErrorContext = Record<string, unknown>;

const getAnalyticsContext = async (): Promise<ErrorContext> => {
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const anonymousId = h.get('X-Anonymous-ID');
    const sessionRecordingURL = h.get('X-Session-Recording-URL');
    return {
      ...(anonymousId && { anonymousId }),
      ...(sessionRecordingURL && { sessionRecordingURL }),
    };
  } catch {
    return {};
  }
};

export const logError = async (
  error: Error | unknown,
  context?: ErrorContext
): Promise<void> => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const analyticsContext = await getAnalyticsContext();

  console.error(JSON.stringify({
    error: errorMessage,
    ...context,
    ...analyticsContext,
    timestamp: new Date().toISOString(),
  }));
};
