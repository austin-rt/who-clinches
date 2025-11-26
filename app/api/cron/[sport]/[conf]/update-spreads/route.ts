import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { CronGamesResponse } from '@/lib/api-types';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sport, conf } = await params;

  const { conferences, espnRoute } = sports[sport];
  const conferenceMeta = conferences[conf];

  if (!conferenceMeta) {
    return NextResponse.json({ error: `Unsupported conference: ${conf}` }, { status: 400 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';
    const season = 2025;

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, conf))) {
      return NextResponse.json(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const games = await Game.find({
      season: season,
      conferenceGame: true,
      state: 'pre',
    }).lean();

    if (games.length === 0) {
      return NextResponse.json<CronGamesResponse>({
        updated: 0,
        gamesChecked: 0,
        activeGames: 0,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    const currentWeek = games[0].week;
    if (!currentWeek) {
      return NextResponse.json<CronGamesResponse>({
        updated: 0,
        gamesChecked: 0,
        activeGames: 0,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    const client = createESPNClient(espnRoute);
    const scoreboard = await client.getScoreboard({
      groups: conferenceMeta.espnId,
      week: parseInt(String(currentWeek), 10),
      season: 2025,
    });

    const result = reshapeScoreboardData(scoreboard, espnRoute);
    const reshapedGames = result.games || [];

    const gameIds = new Set(games.map((g) => String(g.espnId)));
    const gamesToUpdate = reshapedGames.filter((game) => gameIds.has(game.espnId));

    const teamIds = [
      ...new Set([
        ...gamesToUpdate.map((g) => g.home.teamEspnId),
        ...gamesToUpdate.map((g) => g.away.teamEspnId),
      ]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    let updateCount = 0;
    for (const reshapedGame of gamesToUpdate) {
      const currentGame = games.find((g) => String(g.espnId) === reshapedGame.espnId);
      if (!currentGame) continue;

      const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
      const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

      if (!homeTeam || !awayTeam) continue;

      const predictedScore = calculatePredictedScore(
        reshapedGame,
        homeTeam as unknown as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        },
        awayTeam as unknown as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        }
      );

      const hasChanges =
        reshapedGame.odds?.spread !== currentGame.odds?.spread ||
        reshapedGame.odds?.favoriteTeamEspnId !== currentGame.odds?.favoriteTeamEspnId ||
        reshapedGame.odds?.overUnder !== currentGame.odds?.overUnder ||
        predictedScore.home !== currentGame.predictedScore?.home ||
        predictedScore.away !== currentGame.predictedScore?.away;

      if (hasChanges) {
        await Game.updateOne(
          { espnId: reshapedGame.espnId },
          {
            $set: {
              'odds.spread': reshapedGame.odds?.spread ?? null,
              'odds.favoriteTeamEspnId': reshapedGame.odds?.favoriteTeamEspnId ?? null,
              'odds.overUnder': reshapedGame.odds?.overUnder ?? null,
              'predictedScore.home': predictedScore.home,
              'predictedScore.away': predictedScore.away,
              lastUpdated: new Date(),
            },
          }
        );
        updateCount++;
      }
    }

    return NextResponse.json<CronGamesResponse>({
      updated: updateCount,
      gamesChecked: gamesToUpdate.length,
      activeGames: games.length,
      espnCalls: 1,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-spreads`,
      payload: { conf },
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
