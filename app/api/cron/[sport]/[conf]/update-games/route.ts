import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { CronGamesResponse } from '@/lib/api-types';
import { GameLean, GameState } from '@/lib/types';
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
    const mode = searchParams.get('mode') || 'active';

    const season = 2025;

    const bypassSeasonCheck =
      searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';

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

    if (mode === 'season') {
      return await handleSeasonMode(season, sport, espnRoute, conf);
    } else if (mode === 'week') {
      return await handleWeekMode(season, sport, espnRoute, conf, conferenceMeta);
    } else {
      return await handleActiveMode(season, sport, espnRoute, conf, conferenceMeta);
    }
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-games`,
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

const handleSeasonMode = async (
  season: number,
  sport: SportSlug,
  espnRoute: string,
  conf: ConferenceSlug
): Promise<NextResponse<CronGamesResponse>> => {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/pull-games/${sport}/${conf}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ season }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`pull-games endpoint failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json<CronGamesResponse>({
      updated: result.upserted || 0,
      gamesChecked: result.upserted || 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: result.lastUpdated || new Date().toISOString(),
      errors: result.errors,
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-games`,
      payload: { mode: 'season', season, sport, espnRoute, conf },
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
};

const handleWeekMode = async (
  season: number,
  sport: SportSlug,
  espnRoute: string,
  conf: ConferenceSlug,
  conferenceMeta: { espnId: string }
): Promise<NextResponse<CronGamesResponse>> => {
  const client = createESPNClient(espnRoute);

  let currentWeek: number | null = null;
  try {
    const calendarResponse = await client.getScoreboard({
      groups: conferenceMeta.espnId,
    });

    const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
      (cal) => cal.label === 'Regular Season'
    );

    if (regularSeason?.entries && regularSeason.entries.length > 0) {
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
        if (currentWeek === null && regularSeason.entries.length > 0) {
          currentWeek = parseInt(regularSeason.entries[regularSeason.entries.length - 1].value, 10);
        }
      }
    }
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-games`,
      payload: { mode: 'week', season, conf },
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

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/pull-games/${sport}/${conf}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ season, week: currentWeek }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`pull-games endpoint failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json<CronGamesResponse>({
      updated: result.upserted || 0,
      gamesChecked: result.upserted || 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: result.lastUpdated || new Date().toISOString(),
      errors: result.errors,
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-games`,
      payload: { mode: 'week', season, week: currentWeek, conf },
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<CronGamesResponse>({
      updated: 0,
      gamesChecked: 0,
      activeGames: 0,
      espnCalls: 0,
      lastUpdated: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
};

const handleActiveMode = async (
  season: number,
  sport: SportSlug,
  espnRoute: string,
  conf: ConferenceSlug,
  conferenceMeta: { espnId: string }
): Promise<NextResponse<CronGamesResponse>> => {
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

  for (const [week, weekGames] of gamesByWeek.entries()) {
    if (week === 0) {
      continue;
    }

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

    let espnResponse;
    try {
      espnCalls++;
      const client = createESPNClient(espnRoute);
      espnResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
        season: season,
        week: week,
      });
    } catch (error) {
      errors.push(
        `Failed to fetch week ${week}: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }

    const result = reshapeScoreboardData(espnResponse, espnRoute);
    const reshapedGames = result.games || [];

    const gameIds = new Set(games.map((g) => g.espnId));
    const gamesToUpdate = reshapedGames.filter((game) => gameIds.has(game.espnId));
    totalChecked += gamesToUpdate.length;

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
      endpoint: `/api/cron/${sport}/${conf}/update-games`,
      payload: { mode: 'active', season, conf },
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
};
