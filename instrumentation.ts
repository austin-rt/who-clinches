export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.FIXTURE_YEAR) {
    const { mswServer } = await import('@/lib/msw/server');
    mswServer.listen({
      onUnhandledRequest(request) {
        const url = request.url;
        if (url.includes('collegefootballdata.com') || url.includes('espn.com')) {
          throw new Error(
            `[MSW] No fixture handler for ${request.method} ${url}. ` +
              'Add a handler or capture this fixture.'
          );
        }
      },
    });
  }
};
