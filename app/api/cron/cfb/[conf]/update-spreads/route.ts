import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { espnClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/cfb/helpers/reshape-games';
import { CONFERENCE_METADATA, type ConferenceSlug } from '@/lib/cfb/constants';
import { CronGamesResponse } from '@/lib/api-types';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pro Mode Only: Hourly spread updates for upcoming games
 * Updates betting odds and recalculates predictedScore
 */
export const GET = async (request: NextRequest, { params }: { params: { conf: string } }) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conf = (await params).conf as ConferenceSlug;

  if (!CONFERENCE_METADATA[conf]) {
    return NextResponse.json({ error: `Unsupported conference: ${conf}` }, { status: 400 });
  }

  try {
    // 2. Connect to database
    await dbConnect();

    // 3. Check if in season using ESPN calendar (with manual override for testing)
    const { searchParams } = new URL(request.url);
    // Tests automatically bypass the check since they're testing functionality, not season logic
    const bypassSeasonCheck =
      searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';
    const season = 2025; // Hardcoded for now
    const sport = 'football';
    const league = 'college-football';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, league, conf, season))) {
      return NextResponse.json(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    // 4. Query DB for upcoming games (pre-state only, spreads change before kickoff)
    const games = await Game.find({
      season: season,
      conferenceGame: true,
      state: 'pre', // Only pre-game spreads matter
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

    // 4. Get week from first game
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

    // 5. Fetch scoreboard from ESPN
    const scoreboard = await espnClient.getScoreboard({
      groups: CONFERENCE_METADATA[conf].espnId,
      week: parseInt(String(currentWeek), 10),
      season: 2025,
    });

    // 6. Reshape ESPN data
    const result = reshapeScoreboardData(scoreboard, 'football', 'college-football');
    const reshapedGames = result.games || [];

    // 7. Filter to only games we have in DB
    const gameIds = new Set(games.map((g) => String(g.espnId)));
    const gamesToUpdate = reshapedGames.filter((game) => gameIds.has(game.espnId));

    // 8. Fetch teams for predictedScore calculation
    const teamIds = [
      ...new Set([
        ...gamesToUpdate.map((g) => g.home.teamEspnId),
        ...gamesToUpdate.map((g) => g.away.teamEspnId),
      ]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    // 9. Update spreads and predictedScore
    let updateCount = 0;
    for (const reshapedGame of gamesToUpdate) {
      const currentGame = games.find((g) => String(g.espnId) === reshapedGame.espnId);
      if (!currentGame) continue;

      const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
      const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

      if (!homeTeam || !awayTeam) continue;

      // Always recalculate predictedScore
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

      // Check if odds or predictedScore changed
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
      endpoint: `/api/cron/cfb/${conf}/update-spreads`,
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
