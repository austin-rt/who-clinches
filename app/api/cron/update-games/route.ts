import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { espnClient, createESPNClient } from '@/lib/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { CronGamesResponse } from '@/lib/api-types';
import { GameLean, GameState } from '@/lib/types';
import { calculatePredictedScore } from '@/lib/prefill-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Update games cron endpoint
 *
 * Modes:
 * - active (default): Only update incomplete games
 * - week: Pull/update current week only (no past, no future)
 * - season: Pull/update entire season (all weeks, creates new games)
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

    // 3. Get mode parameter
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'active'; // active, week, or season

    const season = 2025; // Hardcoded for now
    const sport = 'football';
    const league = 'college-football';
    const conferenceId = SEC_CONFERENCE_ID;

    // 4. Handle different modes
    if (mode === 'season') {
      // Pull entire season - loop through all weeks and upsert
      return await handleSeasonMode(season, sport, league, conferenceId);
    } else if (mode === 'week') {
      // Pull current week only
      return await handleWeekMode(season, sport, league, conferenceId);
    } else {
      // Default: active mode - only incomplete games
      return await handleActiveMode(season, sport, league, conferenceId);
    }
  } catch (error) {
    // Unexpected error - log and return
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
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

/**
 * Handle season mode: Pull entire season (all weeks, upsert)
 */
async function handleSeasonMode(
  season: number,
  sport: string,
  league: string,
  conferenceId: number
): Promise<NextResponse<CronGamesResponse>> {
  const client = createESPNClient(sport, league);

  // Get all weeks from ESPN calendar
  let weeksToPull: number[] = [];
  try {
    const calendarResponse = await client.getScoreboard({
      groups: conferenceId,
      season: season,
    });

    const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
      (cal) => cal.label === 'Regular Season'
    );

    if (regularSeason?.entries) {
      weeksToPull = regularSeason.entries
        .map((entry) => parseInt(entry.value, 10))
        .filter((val: number) => !isNaN(val));
    }

    if (weeksToPull.length === 0) {
      const maxWeek = 15;
      weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
    }
  } catch {
    const maxWeek = 15;
    weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
  }

  let totalUpserted = 0;
  let totalChecked = 0;
  const errors: string[] = [];
  let espnCalls = 0;

  // Pull games for each week
  for (const weekNumber of weeksToPull) {
    try {
      espnCalls++;
      const espnResponse = await client.getScoreboard({
        groups: conferenceId,
        season: season,
        week: weekNumber,
      });

      if (!espnResponse.events || espnResponse.events.length === 0) {
        continue;
      }

      const reshapeResult = reshapeScoreboardData(espnResponse, sport, league);
      const reshapedGames = reshapeResult.games || [];

      if (reshapedGames.length === 0) {
        continue;
      }

      totalChecked += reshapedGames.length;

      // Fetch teams for predictedScore calculation
      const teamIds = [
        ...new Set([
          ...reshapedGames.map((g) => g.home.teamEspnId),
          ...reshapedGames.map((g) => g.away.teamEspnId),
        ]),
      ];
      const teams = await Team.find({ _id: { $in: teamIds } }).lean();
      const teamMap = new Map(teams.map((t) => [t._id, t]));

      // Upsert each game
      for (const gameData of reshapedGames) {
        try {
          const homeTeam = teamMap.get(gameData.home.teamEspnId) || {};
          const awayTeam = teamMap.get(gameData.away.teamEspnId) || {};

          const predictedScore = calculatePredictedScore(
            gameData,
            homeTeam as {
              record?: {
                stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
              };
            },
            awayTeam as {
              record?: {
                stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
              };
            }
          );

          const updateData: Record<string, unknown> = {
            ...gameData,
            predictedScore,
          };

          // Venue is always required
          updateData.venue = {
            fullName: gameData.venue.fullName || '',
            city: gameData.venue.city || '',
            state: gameData.venue.state || '',
            timezone: gameData.venue.timezone || 'America/New_York',
          };

          const result = await Game.updateOne(
            { espnId: gameData.espnId },
            { $set: updateData },
            { upsert: true }
          );

          if (result.upsertedCount > 0 || result.modifiedCount > 0) {
            totalUpserted++;
          }
        } catch (error) {
          errors.push(
            `Failed to upsert game ${gameData.espnId} (week ${weekNumber}): ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      // Rate limiting between weeks
      if (weeksToPull.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      errors.push(
        `Failed to fetch week ${weekNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (errors.length > 0) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
      payload: { mode: 'season', season, sport, league, conferenceId },
      error: errors.join('; '),
      stackTrace: '',
    });
  }

  return NextResponse.json<CronGamesResponse>({
    updated: totalUpserted,
    gamesChecked: totalChecked,
    activeGames: 0, // Not applicable for season mode
    espnCalls,
    lastUpdated: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * Handle week mode: Pull current week only (determine from ESPN calendar)
 */
async function handleWeekMode(
  season: number,
  sport: string,
  league: string,
  conferenceId: number
): Promise<NextResponse<CronGamesResponse>> {
  const client = createESPNClient(sport, league);

  // Get current week from ESPN calendar
  let currentWeek: number | null = null;
  try {
    const calendarResponse = await client.getScoreboard({
      groups: conferenceId,
      season: season,
    });

    const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
      (cal) => cal.label === 'Regular Season'
    );

    if (regularSeason?.entries && regularSeason.entries.length > 0) {
      // Find the current week based on today's date
      const today = new Date();
      for (const entry of regularSeason.entries) {
        if (entry.startDate && entry.endDate) {
          const startDate = new Date(entry.startDate);
          const endDate = new Date(entry.endDate);
          if (today >= startDate && today <= endDate) {
            currentWeek = parseInt(entry.value, 10);
            break;
          }
        }
      }

      // If no current week found, use the first future week or latest past week
      if (currentWeek === null) {
        for (const entry of regularSeason.entries) {
          if (entry.startDate) {
            const startDate = new Date(entry.startDate);
            if (startDate > today) {
              currentWeek = parseInt(entry.value, 10);
              break;
            }
          }
        }
        // If still no week found, use the last entry
        if (currentWeek === null && regularSeason.entries.length > 0) {
          currentWeek = parseInt(regularSeason.entries[regularSeason.entries.length - 1].value, 10);
        }
      }
    }
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
      payload: { mode: 'week', season },
      error: `Failed to determine current week: ${
        error instanceof Error ? error.message : String(error)
      }`,
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: new Date().toISOString(),
      errors: [
        `Failed to determine current week: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    });
  }

  if (currentWeek === null) {
    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: new Date().toISOString(),
      errors: ['Could not determine current week'],
    });
  }

  // Fetch scoreboard for current week
  let espnResponse;
  try {
    espnResponse = await espnClient.getScoreboard({
      groups: conferenceId,
      season: season,
      week: currentWeek,
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
      payload: { mode: 'week', season, week: currentWeek },
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 1,
      lastUpdated: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  // Reshape and upsert games
  const result = reshapeScoreboardData(espnResponse, sport, league);
  const reshapedGames = result.games || [];

  if (reshapedGames.length === 0) {
    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 1,
      lastUpdated: new Date().toISOString(),
    });
  }

  // Fetch teams for predictedScore calculation
  const teamIds = [
    ...new Set([
      ...reshapedGames.map((g) => g.home.teamEspnId),
      ...reshapedGames.map((g) => g.away.teamEspnId),
    ]),
  ];
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map((t) => [t._id, t]));

  let updateCount = 0;
  const errors: string[] = [];

  for (const gameData of reshapedGames) {
    try {
      const homeTeam = teamMap.get(gameData.home.teamEspnId) || {};
      const awayTeam = teamMap.get(gameData.away.teamEspnId) || {};

      const predictedScore = calculatePredictedScore(
        gameData,
        homeTeam as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        },
        awayTeam as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        }
      );

      const updateData: Record<string, unknown> = {
        ...gameData,
        predictedScore,
        lastUpdated: new Date(),
      };

      // Venue is always required
      updateData.venue = {
        fullName: gameData.venue.fullName || '',
        city: gameData.venue.city || '',
        state: gameData.venue.state || '',
        timezone: gameData.venue.timezone || 'America/New_York',
      };

      const result = await Game.updateOne(
        { espnId: gameData.espnId },
        { $set: updateData },
        { upsert: true }
      );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        updateCount++;
      }
    } catch (error) {
      errors.push(
        `Failed to upsert game ${gameData.espnId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (errors.length > 0) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
      payload: { mode: 'week', season, week: currentWeek },
      error: errors.join('; '),
      stackTrace: '',
    });
  }

  return NextResponse.json<CronGamesResponse>({
    updated: updateCount,
    gamesChecked: reshapedGames.length,
    activeGames: 0, // Not applicable for week mode
    espnCalls: 1,
    lastUpdated: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * Handle active mode: Only update incomplete games (existing behavior)
 */
async function handleActiveMode(
  season: number,
  sport: string,
  league: string,
  conferenceId: number
): Promise<NextResponse<CronGamesResponse>> {
  // Query only incomplete games
  const gamesRaw = await Game.find({
    season: season,
    conferenceGame: true,
    completed: false,
  })
    .lean()
    .sort({ week: 1, date: 1 });

  if (gamesRaw.length === 0) {
    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: new Date().toISOString(),
    });
  }

  // Group games by week
  const gamesByWeek = new Map<number, typeof gamesRaw>();
  for (const game of gamesRaw) {
    const week = typeof game.week === 'number' ? game.week : 0;
    if (!gamesByWeek.has(week)) {
      gamesByWeek.set(week, []);
    }
    gamesByWeek.get(week)!.push(game);
  }

  let totalUpdated = 0;
  let totalChecked = 0;
  let espnCalls = 0;
  const errors: string[] = [];

  // Process each week
  for (const [week, weekGames] of gamesByWeek.entries()) {
    if (week === 0) {
      continue; // Skip games without week numbers
    }

    // Cast to GameLean
    const games: GameLean[] = weekGames.map((g) => ({
      _id: String(g._id),
      espnId: String(g.espnId),
      displayName: String(g.displayName),
      date: String(g.date),
      week: typeof g.week === 'number' ? g.week : null,
      season: Number(g.season),
      sport: String(g.sport),
      league: String(g.league),
      state: g.state as GameState,
      completed: Boolean(g.completed),
      conferenceGame: Boolean(g.conferenceGame),
      neutralSite: Boolean(g.neutralSite),
      venue: g.venue
        ? {
            fullName: String(g.venue.fullName || ''),
            city: String(g.venue.city || ''),
            state: String(g.venue.state || ''),
            timezone: String(g.venue.timezone || 'America/New_York'),
          }
        : {
            fullName: '',
            city: '',
            state: '',
            timezone: 'America/New_York',
          },
      home: {
        teamEspnId: String(g.home.teamEspnId),
        abbrev: String(g.home.abbrev),
        displayName: g.home.displayName ? String(g.home.displayName) : undefined,
        logo: g.home.logo ? String(g.home.logo) : undefined,
        color: g.home.color ? String(g.home.color) : undefined,
        score: typeof g.home.score === 'number' ? g.home.score : null,
        rank: typeof g.home.rank === 'number' ? g.home.rank : null,
      },
      away: {
        teamEspnId: String(g.away.teamEspnId),
        abbrev: String(g.away.abbrev),
        displayName: g.away.displayName ? String(g.away.displayName) : undefined,
        logo: g.away.logo ? String(g.away.logo) : undefined,
        color: g.away.color ? String(g.away.color) : undefined,
        score: typeof g.away.score === 'number' ? g.away.score : null,
        rank: typeof g.away.rank === 'number' ? g.away.rank : null,
      },
      odds: {
        favoriteTeamEspnId: g.odds.favoriteTeamEspnId ? String(g.odds.favoriteTeamEspnId) : null,
        spread: typeof g.odds.spread === 'number' ? g.odds.spread : null,
        overUnder: typeof g.odds.overUnder === 'number' ? g.odds.overUnder : null,
      },
      predictedScore: g.predictedScore
        ? {
            home: Number(g.predictedScore.home),
            away: Number(g.predictedScore.away),
          }
        : undefined,
    }));

    // Fetch scoreboard from ESPN
    let espnResponse;
    try {
      espnCalls++;
      espnResponse = await espnClient.getScoreboard({
        groups: conferenceId,
        season: season,
        week: week,
      });
    } catch (error) {
      errors.push(
        `Failed to fetch week ${week}: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }

    // Reshape ESPN response
    const result = reshapeScoreboardData(espnResponse, sport, league);
    const reshapedGames = result.games || [];

    // Update each game
    const gameIds = new Set(games.map((g) => g.espnId));
    const gamesToUpdate = reshapedGames.filter((game) => gameIds.has(game.espnId));
    totalChecked += gamesToUpdate.length;

    // Fetch teams for predictedScore calculation
    const teamIds = [
      ...new Set([
        ...gamesToUpdate.map((g) => g.home.teamEspnId),
        ...gamesToUpdate.map((g) => g.away.teamEspnId),
      ]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    for (const reshapedGame of gamesToUpdate) {
      const currentGame = games.find((g) => g.espnId === reshapedGame.espnId);
      if (!currentGame) continue;

      const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
      const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

      if (!homeTeam || !awayTeam) {
        continue;
      }

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

      // Check if anything changed
      const venueChanged = JSON.stringify(reshapedGame.venue) !== JSON.stringify(currentGame.venue);

      const hasChanges =
        reshapedGame.state !== currentGame.state ||
        reshapedGame.completed !== currentGame.completed ||
        reshapedGame.home.score !== currentGame.home.score ||
        reshapedGame.away.score !== currentGame.away.score ||
        reshapedGame.home.rank !== currentGame.home.rank ||
        reshapedGame.away.rank !== currentGame.away.rank ||
        reshapedGame.odds?.spread !== currentGame.odds?.spread ||
        reshapedGame.odds?.favoriteTeamEspnId !== currentGame.odds?.favoriteTeamEspnId ||
        predictedScore.home !== currentGame.predictedScore?.home ||
        predictedScore.away !== currentGame.predictedScore?.away ||
        venueChanged;

      if (hasChanges) {
        const updateData: Record<string, unknown> = {
          state: reshapedGame.state,
          completed: reshapedGame.completed,
          'home.score': reshapedGame.home.score,
          'home.rank': reshapedGame.home.rank,
          'away.score': reshapedGame.away.score,
          'away.rank': reshapedGame.away.rank,
          'odds.spread': reshapedGame.odds?.spread ?? null,
          'odds.favoriteTeamEspnId': reshapedGame.odds?.favoriteTeamEspnId ?? null,
          'odds.overUnder': reshapedGame.odds?.overUnder ?? null,
          'predictedScore.home': predictedScore.home,
          'predictedScore.away': predictedScore.away,
          lastUpdated: new Date(),
        };

        // Update venue (always required)
        updateData.venue = {
          fullName: reshapedGame.venue.fullName || '',
          city: reshapedGame.venue.city || '',
          state: reshapedGame.venue.state || '',
          timezone: reshapedGame.venue.timezone || 'America/New_York',
        };

        await Game.updateOne({ espnId: reshapedGame.espnId }, { $set: updateData });
        totalUpdated++;
      }
    }
  }

  if (errors.length > 0) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-games',
      payload: { mode: 'active', season },
      error: errors.join('; '),
      stackTrace: '',
    });
  }

  return NextResponse.json<CronGamesResponse>({
    updated: totalUpdated,
    gamesChecked: totalChecked,
    activeGames: gamesRaw.length,
    espnCalls,
    lastUpdated: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  });
}
