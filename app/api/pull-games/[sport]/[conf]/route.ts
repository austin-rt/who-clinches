import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { PullGamesResponse, ApiErrorResponse } from '@/lib/api-types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';
import { extractTeamsFromScoreboard } from '@/lib/reshape-teams-from-scoreboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  const { sport, conf } = await params;

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

    const { conferences, espnRoute } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${conf} for sport: ${sport}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      force === true || searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, conf))) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const client = createESPNClient(espnRoute);

    let seasonYear: number;
    try {
      const calendarResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
      });
      seasonYear =
        calendarResponse.season?.year ||
        calendarResponse.leagues?.[0]?.season?.year ||
        season ||
        new Date().getFullYear();
    } catch {
      seasonYear = season || new Date().getFullYear();
    }

    // If week is specified, use it; otherwise fetch entire season
    let scoreboardResponse;
    if (week !== undefined) {
      scoreboardResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
        season: season,
        week: week,
      });
    } else {
      // Fetch entire season in one call using dates parameter
      scoreboardResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
        dates: seasonYear,
      });
    }

    // Extract and store teams from scoreboard response BEFORE reshaping/checking games
    // Teams must exist even if there are no games yet (early season, etc.)
    const conferenceId = String(conferenceMeta.espnId);
    const existingTeams = await Team.find({ conferenceId }).lean();

    let totalUpserted = 0;
    const errors: string[] = [];

    if (existingTeams.length === 0 || existingTeams.length < conferenceMeta.teams) {
      // Extract teams from scoreboard response
      const teams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);

      if (process.env.NODE_ENV === 'test' && teams.length === 0) {
        throw new Error(
          `No teams extracted. Events: ${scoreboardResponse.events?.length || 0}, ` +
            `Conference: ${conferenceMeta.espnId}, ` +
            `Conference games: ${scoreboardResponse.events?.flatMap((e) => e.competitions || []).filter((c) => c.conferenceCompetition).length || 0}, ` +
            `Total competitors: ${scoreboardResponse.events?.flatMap((e) => e.competitions || []).flatMap((c) => c.competitors || []).length || 0}`
        );
      }

      // Store teams with required fields only (upsert handles both create and update)
      for (const team of teams) {
        try {
          await Team.findOneAndUpdate({ _id: team._id }, team, { upsert: true, new: true });
        } catch (error) {
          const errorMsg = `Failed to upsert team ${team._id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMsg);

          await ErrorModel.create({
            timestamp: new Date(),
            endpoint: `/api/pull-games/${sport}/${conf}`,
            payload: { teamId: team._id },
            error: errorMsg,
            stackTrace: error instanceof Error ? error.stack || '' : '',
          });
        }
      }
    }

    const reshaped = reshapeScoreboardData(scoreboardResponse, espnRoute, season);

    if (!reshaped.games || reshaped.games.length === 0) {
      return NextResponse.json<PullGamesResponse>(
        {
          upserted: 0,
          weeksPulled: [],
          lastUpdated: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Filter games to only include conference games (using ESPN's conferenceCompetition field)
    // ESPN's API already tells us which games are conference games
    const conferenceGamesOnly = reshaped.games.filter((game) => game.conferenceGame === true);

    if (conferenceGamesOnly.length === 0) {
      return NextResponse.json<PullGamesResponse>(
        {
          upserted: 0,
          weeksPulled: [],
          lastUpdated: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Ensure season is set correctly (conferenceGame is already set from ESPN's conferenceCompetition)
    for (const game of conferenceGamesOnly) {
      game.season = season;
    }

    // Fetch teams for predictedScore calculation
    const teamIds = [
      ...new Set([
        ...conferenceGamesOnly.map((g) => g.home.teamEspnId),
        ...conferenceGamesOnly.map((g) => g.away.teamEspnId),
      ]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    for (const game of conferenceGamesOnly) {
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
          endpoint: `/api/pull-games/${sport}/${conf}`,
          payload: { gameId: game.espnId },
          error: errorMsg,
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    // Extract unique week numbers from conference games
    const weeksPulled = [
      ...new Set(conferenceGamesOnly.map((g) => g.week).filter((w) => w !== null)),
    ].sort((a, b) => (a || 0) - (b || 0)) as number[];

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
      endpoint: `/api/pull-games/${sport}/${conf}`,
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
