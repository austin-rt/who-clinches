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

export const describeErrorCause = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause;
  if (cause === undefined || cause === null) return undefined;
  if (!(cause instanceof Error)) return String(cause);
  const code = (cause as NodeJS.ErrnoException).code;
  const described = `${cause.name}: ${cause.message}`;
  return code ? `${described} (${code})` : described;
};

export const logError = async (error: Error | unknown, context?: ErrorContext): Promise<void> => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const cause = describeErrorCause(error);
  const analyticsContext = await getAnalyticsContext();

  console.error(
    JSON.stringify({
      error: errorMessage,
      ...(cause && { cause }),
      ...context,
      ...analyticsContext,
      timestamp: new Date().toISOString(),
    })
  );
};
