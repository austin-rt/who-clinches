import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createESPNClient } from '@/lib/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/prefill-helpers';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { PullGamesResponse } from '@/lib/api-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint to pull all games for the entire season
 * Pulls games from ESPN for all weeks and updates/creates them in the database
 */
export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Connect to database
    await dbConnect();

    const season = 2025; // Hardcoded for now
    const sport = 'football';
    const league = 'college-football';
    const conferenceId = SEC_CONFERENCE_ID;

    // 3. Create ESPN client
    const client = createESPNClient(sport, league);

    // 4. Determine which weeks to pull
    let weeksToPull: number[] = [];

    try {
      const calendarResponse = await client.getScoreboard({
        groups: conferenceId,
        season: season,
      });

      // Extract week numbers from Regular Season calendar
      const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
        (cal) => cal.label === 'Regular Season'
      );

      if (regularSeason?.entries) {
        weeksToPull = regularSeason.entries
          .map((entry) => parseInt(entry.value, 10))
          .filter((val: number) => !isNaN(val));
      }

      // Fallback to weeks 1-15 if calendar not available
      if (weeksToPull.length === 0) {
        const maxWeek = 15;
        weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
      }
    } catch {
      // If calendar fetch fails, fall back to weeks 1-15
      const maxWeek = 15;
      weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
    }

    // 5. Pull games for each week
    let totalUpserted = 0;
    const errors: string[] = [];
    const weeksPulled: number[] = [];

    for (const weekNumber of weeksToPull) {
      try {
        // Fetch data from ESPN
        const espnResponse = await client.getScoreboard({
          groups: conferenceId,
          season: season,
          week: weekNumber,
        });

        if (!espnResponse.events || espnResponse.events.length === 0) {
          continue; // Skip weeks with no games
        }

        // Reshape ESPN data
        const reshapeResult = reshapeScoreboardData(espnResponse, sport, league);
        const { games: reshapedGames } = reshapeResult;

        if (!reshapedGames || reshapedGames.length === 0) {
          continue;
        }

        // Fetch all teams needed for predictedScore calculation
        const teamIds = [
          ...new Set([
            ...reshapedGames.map((g) => g.home.teamEspnId),
            ...reshapedGames.map((g) => g.away.teamEspnId),
          ]),
        ];
        const teams = await Team.find({ _id: { $in: teamIds } }).lean();
        const teamMap = new Map(teams.map((t) => [t._id, t]));

        // Write games to database using upsert
        for (const gameData of reshapedGames) {
          try {
            // Calculate predictedScore for this game
            const homeTeam = teamMap.get(gameData.home.teamEspnId) || {};
            const awayTeam = teamMap.get(gameData.away.teamEspnId) || {};

            const predictedScore = calculatePredictedScore(
              gameData,
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

            const result = await Game.updateOne(
              { espnId: gameData.espnId },
              {
                $set: {
                  ...gameData,
                  predictedScore,
                  lastUpdated: new Date(),
                },
              },
              { upsert: true }
            );

            if (result.upsertedCount > 0 || result.modifiedCount > 0) {
              totalUpserted++;
            }
          } catch (error) {
            const errorMsg = `Failed to upsert game ${gameData.espnId} (week ${weekNumber}): ${
              error instanceof Error ? error.message : String(error)
            }`;
            errors.push(errorMsg);
          }
        }

        weeksPulled.push(weekNumber);
      } catch (error) {
        const errorMsg = `Failed to pull week ${weekNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
      }
    }

    // 6. Log errors if any
    if (errors.length > 0) {
      await ErrorLog.create({
        timestamp: new Date(),
        endpoint: '/api/cron/pull-games',
        payload: { season, sport, league, conferenceId },
        error: errors.join('; '),
        stackTrace: '',
      });
    }

    return NextResponse.json<PullGamesResponse>({
      upserted: totalUpserted,
      weeksPulled,
      lastUpdated: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    // Unexpected error - log and return
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/pull-games',
      payload: {},
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
