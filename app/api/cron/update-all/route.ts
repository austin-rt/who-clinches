import { NextRequest, NextResponse } from 'next/server';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
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

  for (const [sport, sportConfig] of Object.entries(sports)) {
    for (const conf of Object.keys(sportConfig.conferences)) {
      const sportSlug = sport as SportSlug;
      const confSlug = conf as ConferenceSlug;

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
    { status: successCount === results.length ? 200 : 207 }
  );
};
