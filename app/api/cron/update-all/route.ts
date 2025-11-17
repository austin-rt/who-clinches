import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Batch Cron Endpoint - Pull Everything
 *
 * Calls all cron jobs to pull/update all data:
 * - Games (entire season)
 * - Teams
 * - Rankings
 * - Spreads
 *
 * Each sub-job handles its own:
 * - Authentication (uses same CRON_SECRET)
 * - Error handling
 * - Early exits (e.g., update-rankings only runs in season)
 *
 * Flow:
 * 1. pull-teams - Pull all SEC teams
 * 2. update-games?mode=season - Pull/update entire season (all weeks)
 * 3. update-rankings - Update team rankings
 * 4. update-spreads - Update game spreads
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

  // 1. Pull teams (POST endpoint, requires body)
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/pull-teams`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sport: 'football',
        league: 'college-football',
        conferenceId: 8, // SEC
      }),
    });
    const duration = Date.now() - start;

    results.push({
      job: 'pull-teams',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error) {
    results.push({
      job: 'pull-teams',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });
  }

  // 2. Pull/update games for entire season
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/cron/update-games?mode=season`, {
      method: 'GET',
      headers: authHeaders,
    });
    const duration = Date.now() - start;

    results.push({
      job: 'update-games-season',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error) {
    results.push({
      job: 'update-games-season',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });
  }

  // 3. Update rankings
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

  // 4. Update spreads
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/api/cron/update-spreads`, {
      method: 'GET',
      headers: authHeaders,
    });
    const duration = Date.now() - start;

    results.push({
      job: 'update-spreads',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error) {
    results.push({
      job: 'update-spreads',
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
    },
    { status: successCount === results.length ? 200 : 207 } // 207 = Multi-Status
  );
};
