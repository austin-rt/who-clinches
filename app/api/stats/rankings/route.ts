import { NextRequest, NextResponse } from 'next/server';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import type { PollWeek } from 'cfbd';
import { ApiErrorResponse } from '@/app/store/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');
    const week = searchParams.get('week');

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

    const weekNumber = week ? parseInt(week, 10) : undefined;
    if (week && isNaN(weekNumber!)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Invalid week parameter',
          code: 'INVALID_WEEK',
        },
        { status: 400 }
      );
    }

    // Always fetch fresh - no caching (rankings update at different times throughout the week)
    const pollWeeks = await cfbdClient.getRankings({
      year: seasonYear,
      week: weekNumber,
    });

    // Filter for CFP rankings (Playoff Committee Rankings)
    const cfpRankings = pollWeeks
      .map((pollWeek) => {
        const cfpPoll = pollWeek.polls?.find(
          (poll) =>
            poll.poll?.toLowerCase().includes('playoff') ||
            poll.poll?.toLowerCase().includes('cfp') ||
            poll.poll?.toLowerCase().includes('college football playoff')
        );
        return cfpPoll ? pollWeek : null;
      })
      .filter((pw): pw is PollWeek => pw !== null);

    return NextResponse.json(
      {
        rankings: cfpRankings.length > 0 ? cfpRankings : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/stats/rankings',
      action: 'get-rankings',
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
