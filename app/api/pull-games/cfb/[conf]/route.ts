import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/cfb/helpers/reshape-games';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { PullGamesResponse, ApiErrorResponse } from '@/lib/api-types';
import { CONFERENCE_METADATA, type ConferenceSlug } from '@/lib/cfb/constants';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest, { params }: { params: { conf: string } }) => {
  const conf = (await params).conf as ConferenceSlug;

  try {
    await dbConnect();

    const body = await request.json();
    const { season, week, force } = body;

    if (!season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Missing required field: season',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const sport = 'football';
    const league = 'college-football';

    if (!CONFERENCE_METADATA[conf]) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${conf}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    // Check if in season using ESPN calendar (with manual override for testing)
    // Tests automatically bypass the check since they're testing functionality, not season logic
    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      force === true || searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, league, conf, season))) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const client = createESPNClient(sport, league);

    let weeksToPull: number[] = [];

    if (week !== undefined) {
      weeksToPull = [week];
    } else {
      try {
        // Fetch calendar without season parameter - ESPN only returns calendar without season
        const calendarResponse = await client.getScoreboard({
          groups: CONFERENCE_METADATA[conf].espnId,
        });

        const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
          (cal) => cal.label === 'Regular Season'
        );

        if (regularSeason?.entries) {
          weeksToPull = regularSeason.entries
            .map((entry) => parseInt(entry.value, 10))
            .filter((val: number) => !isNaN(val));
        }

        // If no weeks found from calendar, calculate maxWeek from entries if available
        if (weeksToPull.length === 0) {
          let maxWeek = 15; // Default fallback
          if (regularSeason?.entries && regularSeason.entries.length > 0) {
            // Calculate maxWeek from the highest week number in entries
            const weekNumbers = regularSeason.entries
              .map((entry) => parseInt(entry.value, 10))
              .filter((val: number) => !isNaN(val));
            if (weekNumbers.length > 0) {
              maxWeek = Math.max(...weekNumbers);
            }
          }
          weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
        }
      } catch {
        // Fallback: try to use a reasonable default, but ESPN data should always be available
        const maxWeek = 15;
        weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
      }
    }

    let totalUpserted = 0;
    const errors: string[] = [];
    const weeksPulled: number[] = [];

    for (const weekNumber of weeksToPull) {
      try {
        const scoreboardResponse = await client.getScoreboard({
          groups: CONFERENCE_METADATA[conf].espnId,
          season: season,
          week: weekNumber,
        });

        const reshaped = reshapeScoreboardData(scoreboardResponse, sport, league, season);

        if (!reshaped.games || reshaped.games.length === 0) {
          continue;
        }

        // When pulling games for a specific conference, mark all games as conference games
        // since we're filtering by conference group
        // Also ensure season is set correctly
        for (const game of reshaped.games) {
          game.conferenceGame = true;
          game.season = season;
        }

        // Fetch teams for predictedScore calculation
        const teamIds = [
          ...new Set([
            ...reshaped.games.map((g) => g.home.teamEspnId),
            ...reshaped.games.map((g) => g.away.teamEspnId),
          ]),
        ];
        const teams = await Team.find({ _id: { $in: teamIds } }).lean();
        const teamMap = new Map(teams.map((t) => [String(t._id), t]));

        for (const game of reshaped.games) {
          try {
            const homeTeam = teamMap.get(game.home.teamEspnId) || {};
            const awayTeam = teamMap.get(game.away.teamEspnId) || {};

            const predictedScore = calculatePredictedScore(
              game,
              homeTeam as {
                record?: {
                  stats?: {
                    avgPointsFor?: number;
                    avgPointsAgainst?: number;
                  };
                };
              },
              awayTeam as {
                record?: {
                  stats?: {
                    avgPointsFor?: number;
                    avgPointsAgainst?: number;
                  };
                };
              }
            );

            await Game.findOneAndUpdate(
              { espnId: game.espnId },
              {
                ...game,
                predictedScore,
              },
              { upsert: true, new: true }
            );
            totalUpserted++;
          } catch (error) {
            const errorMsg = `Failed to upsert game ${game.espnId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`;
            errors.push(errorMsg);

            await ErrorModel.create({
              timestamp: new Date(),
              endpoint: `/api/pull-games/cfb/${conf}`,
              payload: { gameId: game.espnId, week: weekNumber },
              error: errorMsg,
              stackTrace: error instanceof Error ? error.stack || '' : '',
            });
          }
        }

        weeksPulled.push(weekNumber);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const errorMsg = `Failed to pull week ${weekNumber}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);

        await ErrorModel.create({
          timestamp: new Date(),
          endpoint: `/api/pull-games/cfb/${conf}`,
          payload: { week: weekNumber },
          error: errorMsg,
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    return NextResponse.json<PullGamesResponse>(
      {
        upserted: totalUpserted,
        weeksPulled,
        lastUpdated: new Date().toISOString(),
        ...(errors.length > 0 && { errors }),
      },
      { status: 200 }
    );
  } catch (error) {
    await ErrorModel.create({
      timestamp: new Date(),
      endpoint: `/api/pull-games/cfb/${conf}`,
      payload: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
};
