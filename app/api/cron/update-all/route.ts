import { NextRequest, NextResponse } from 'next/server';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';

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

  // Get bypass token from environment or request for protected Vercel deployments
  const bypassToken =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    request.nextUrl.searchParams.get('x-vercel-protection-bypass') ||
    '';
  const bypassParam = bypassToken ? `x-vercel-protection-bypass=${bypassToken}` : '';

  const results: Array<{
    job: string;
    success: boolean;
    status?: number;
    error?: string;
    duration: number;
  }> = [];

  // Loop through all supported sport/conf combinations
  for (const [sport, sportConfig] of Object.entries(sports)) {
    for (const conf of Object.keys(sportConfig.conferences)) {
      const sportSlug = sport as SportSlug;
      const confSlug = conf as ConferenceSlug;

    // 1. Pull teams
    try {
      const start = Date.now();
      const pullTeamsUrl = bypassParam
          ? `${baseUrl}/api/pull-teams/${sportSlug}/${confSlug}?${bypassParam}`
          : `${baseUrl}/api/pull-teams/${sportSlug}/${confSlug}`;
      const response = await fetch(pullTeamsUrl, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const duration = Date.now() - start;

      results.push({
          job: `pull-teams-${sportSlug}-${confSlug}`,
        success: response.ok,
        status: response.status,
        duration,
      });
    } catch (error) {
      results.push({
          job: `pull-teams-${sportSlug}-${confSlug}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      });
    }

    // 2. Pull/update games for entire season
    try {
      const start = Date.now();
      const pullGamesUrl = bypassParam
          ? `${baseUrl}/api/pull-games/${sportSlug}/${confSlug}?${bypassParam}`
          : `${baseUrl}/api/pull-games/${sportSlug}/${confSlug}`;
      const response = await fetch(pullGamesUrl, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season: new Date().getFullYear(),
        }),
      });
      const duration = Date.now() - start;

      results.push({
          job: `pull-games-${sportSlug}-${confSlug}`,
        success: response.ok,
        status: response.status,
        duration,
      });
    } catch (error) {
      results.push({
          job: `pull-games-${sportSlug}-${confSlug}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      });
    }

    // 3. Update rankings
    try {
      const start = Date.now();
      const updateRankingsUrl = bypassParam
          ? `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-rankings?${bypassParam}`
          : `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-rankings`;
      const response = await fetch(updateRankingsUrl, {
        method: 'GET',
        headers: authHeaders,
      });
      const duration = Date.now() - start;

      results.push({
          job: `update-rankings-${sportSlug}-${confSlug}`,
        success: response.ok,
        status: response.status,
        duration,
      });
    } catch (error) {
      results.push({
          job: `update-rankings-${sportSlug}-${confSlug}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      });
    }

    // 4. Update spreads
    try {
      const start = Date.now();
      const updateSpreadsUrl = bypassParam
          ? `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-spreads?${bypassParam}`
          : `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-spreads`;
      const response = await fetch(updateSpreadsUrl, {
        method: 'GET',
        headers: authHeaders,
      });
      const duration = Date.now() - start;

      results.push({
          job: `update-spreads-${sportSlug}-${confSlug}`,
        success: response.ok,
        status: response.status,
        duration,
      });
    } catch (error) {
      results.push({
          job: `update-spreads-${sportSlug}-${confSlug}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      });
    }

    // 5. Update team averages
    try {
      const start = Date.now();
      const updateTeamAveragesUrl = bypassParam
          ? `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-team-averages?${bypassParam}`
          : `${baseUrl}/api/cron/${sportSlug}/${confSlug}/update-team-averages`;
      const response = await fetch(updateTeamAveragesUrl, {
        method: 'GET',
        headers: authHeaders,
      });
      const duration = Date.now() - start;

      results.push({
          job: `update-team-averages-${sportSlug}-${confSlug}`,
        success: response.ok,
        status: response.status,
        duration,
      });
    } catch (error) {
      results.push({
          job: `update-team-averages-${sportSlug}-${confSlug}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      });
      }
    }
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
