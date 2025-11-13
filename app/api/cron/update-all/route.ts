import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Batch Cron Endpoint - Hobby Tier
 *
 * Calls all cron jobs from a single endpoint to work around Vercel's
 * "2 cron jobs, once per day" limit. Runs daily at 4 AM ET (9 AM UTC).
 *
 * Each sub-job handles its own:
 * - Authentication (uses same CRON_SECRET)
 * - Error handling
 * - Early exits (e.g., update-rankings only runs in season)
 *
 * Flow:
 * 1. update-games?allGames=true - Updates ALL games (completed, in-progress, pre-game) for current week
 * 2. update-rankings - Updates team rankings (only runs in season, weekly logic)
 * 3. update-test-data - Updates test data snapshots
 *    → Triggers run-reshape-tests automatically (non-blocking)
 */
export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const authHeaders = {
    Authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  const results: Array<{
    job: string;
    success: boolean;
    status?: number;
    error?: string;
    duration: number;
  }> = [];

  // 2. Call update-games with allGames=true (updates ALL games, not just active ones)
  // Hobby tier: Daily batch update at 4 AM when no games are active
  // Pro tier: update-games without allGames handles active games during game windows
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/cron/update-games?allGames=true`, {
      method: 'GET',
      headers: authHeaders,
    });
    const duration = Date.now() - start;

    results.push({
      job: 'update-games',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error) {
    results.push({
      job: 'update-games',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });
  }

  // 3. Call update-rankings (handles its own season check)
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/cron/update-rankings`, {
      method: 'GET',
      headers: authHeaders,
    });
    const duration = Date.now() - start;

    results.push({
      job: 'update-rankings',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error) {
    results.push({
      job: 'update-rankings',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });
  }

  // 4. Call update-test-data (triggers reshape tests automatically)
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/cron/update-test-data`, {
      method: 'GET',
      headers: authHeaders,
    });
    const duration = Date.now() - start;

    results.push({
      job: 'update-test-data',
      success: response.ok,
      status: response.status,
      duration,
    });

    // Note: update-test-data automatically triggers run-reshape-tests
    // Tests run in background (non-blocking, fire-and-forget)
    // Results logged to ErrorLog database for monitoring
  } catch (error) {
    results.push({
      job: 'update-test-data',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });
  }

  // 5. Summary
  const successCount = results.filter((r) => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  return NextResponse.json(
    {
      success: successCount === results.length,
      jobsRun: results.length,
      jobsSucceeded: successCount,
      totalDuration,
      results,
      lastUpdated: new Date().toISOString(),
      note: 'update-test-data automatically triggers reshape tests in background',
    },
    { status: successCount === results.length ? 200 : 207 } // 207 = Multi-Status
  );
};
