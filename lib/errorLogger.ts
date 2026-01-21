/* eslint-disable */
type ErrorContext = Record<string, unknown>;

const logErrorToExternalService = async (
  error: Error | unknown,
  context?: ErrorContext
): Promise<void> => {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const payload = {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    // TODO: Implement external logging service integration
    // Examples: LogRocket, Sentry, DataDog, etc.
    // Replace this with your actual logging service implementation
  } catch {
    // Silently fail if logging fails
  }
};

export const logError = async (
  error: Error | unknown,
  context?: ErrorContext,
  logExternally: boolean = true
): Promise<void> => {
  if (logExternally) {
    await logErrorToExternalService(error, context);
  }
};
