import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import { calculateNextMondayRevalidate } from '@/lib/cfb/helpers/calculate-next-monday-revalidate';
import { ApiErrorResponse } from '@/app/store/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    if (!season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Season parameter is required',
          code: 'MISSING_SEASON',
        },
        { status: 400 }
      );
    }

    const seasonYear = parseInt(season, 10);
    if (isNaN(seasonYear)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Invalid season parameter',
          code: 'INVALID_SEASON',
        },
        { status: 400 }
      );
    }

    // Calculate revalidation time: next Monday at 5 AM ET
    // This gives buffer after latest games finish (Hawai'i games can end as late as 3:59 AM ET Sunday)
    // and allows time for CFBD API to update stats
    const REVALIDATE_SECONDS = calculateNextMondayRevalidate(5, 'America/New_York');

    const getCachedAdvancedStats = unstable_cache(
      async () => {
        const stats = await cfbdClient.getAdvancedSeasonStats({
          year: seasonYear,
        });
        return { stats };
      },
      [`advanced-stats-${seasonYear}`],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [`advanced-stats-${seasonYear}`],
      }
    );

    const data = await getCachedAdvancedStats();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/stats/advanced',
      action: 'get-advanced-stats',
    });
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};
