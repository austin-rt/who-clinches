import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import { MongoQuery, GameLean, TeamLean, GameState } from '@/lib/types';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Build query from search parameters
    const query: MongoQuery = {};

    const conferenceId = searchParams.get('conferenceId');
    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const state = searchParams.get('state');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const sport = searchParams.get('sport');
    const league = searchParams.get('league');

    // Filter by conference games only (as specified in tech spec)
    if (conferenceId) {
      query.conferenceGame = true;
    }

    if (season) {
      query.season = parseInt(season, 10);
    }

    if (week) {
      query.week = parseInt(week, 10);
    }

    if (state && ['pre', 'in', 'post'].includes(state)) {
      query.state = state;
    }

    if (sport) {
      query.sport = sport;
    }

    if (league) {
      query.league = league;
    }

    // Date range filtering
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    // Fetch games with lean mode (no hydration)
    const gamesRaw = await Game.find(query).lean().sort({ date: 1, week: 1 }).exec();

    // Type annotation - we know our schema matches GameLean exactly
    const games: GameLean[] = gamesRaw.map(
      (game): GameLean => ({
        _id: String(game._id),
        espnId: String(game.espnId),
        displayName: String(game.displayName),
        date: String(game.date),
        week: typeof game.week === 'number' ? game.week : null,
        season: Number(game.season),
        sport: String(game.sport),
        league: String(game.league),
        state: game.state as GameState,
        completed: Boolean(game.completed),
        conferenceGame: Boolean(game.conferenceGame),
        neutralSite: Boolean(game.neutralSite),
        venue: {
          fullName: String(game.venue?.fullName || ''),
          city: String(game.venue?.city || ''),
          state: String(game.venue?.state || ''),
          timezone: String(game.venue?.timezone || 'America/New_York'),
        },
        home: {
          teamEspnId: String(game.home?.teamEspnId || ''),
          abbrev: String(game.home?.abbrev || ''),
          score: typeof game.home?.score === 'number' ? game.home.score : null,
          rank: typeof game.home?.rank === 'number' ? game.home.rank : null,
        },
        away: {
          teamEspnId: String(game.away?.teamEspnId || ''),
          abbrev: String(game.away?.abbrev || ''),
          score: typeof game.away?.score === 'number' ? game.away.score : null,
          rank: typeof game.away?.rank === 'number' ? game.away.rank : null,
        },
        odds: {
          favoriteTeamEspnId: game.odds?.favoriteTeamEspnId
            ? String(game.odds.favoriteTeamEspnId)
            : null,
          spread: typeof game.odds?.spread === 'number' ? game.odds.spread : null,
          overUnder: typeof game.odds?.overUnder === 'number' ? game.odds.overUnder : null,
        },
        predictedScore: game.predictedScore
          ? {
              home: Number(game.predictedScore?.home || 0),
              away: Number(game.predictedScore?.away || 0),
            }
          : undefined,
      })
    );

    // Extract unique team IDs from games
    const teamIds = new Set<string>();
    for (const game of games) {
      teamIds.add(game.home.teamEspnId);
      teamIds.add(game.away.teamEspnId);
    }

    // Fetch team metadata for all teams in results
    const teamsRaw = await Team.find({ _id: { $in: Array.from(teamIds) } })
      .lean()
      .select('_id abbreviation displayName logo color alternateColor')
      .exec();

    // Type assertion - we know our selected fields match exactly
    const teams: Pick<
      TeamLean,
      '_id' | 'abbreviation' | 'displayName' | 'logo' | 'color' | 'alternateColor'
    >[] = teamsRaw.map(
      (
        team
      ): Pick<
        TeamLean,
        '_id' | 'abbreviation' | 'displayName' | 'logo' | 'color' | 'alternateColor'
      > => ({
        _id: String(team._id),
        abbreviation: String(team.abbreviation),
        displayName: String(team.displayName),
        logo: String(team.logo),
        color: String(team.color),
        alternateColor: String(team.alternateColor),
      })
    );

    const teamMap: Record<string, TeamMetadata> = {};
    for (const team of teams) {
      teamMap[team._id] = {
        id: team._id,
        abbrev: team.abbreviation,
        displayName: team.displayName,
        logo: team.logo,
        color: team.color,
        alternateColor: team.alternateColor,
      };
    }

    // Get lastUpdated timestamp - use current time as fallback
    // This represents when the scoreboard was last pulled from ESPN
    const lastUpdated = new Date().toISOString();

    // Determine cache headers based on game states
    const hasLiveGames = games.some((game) => game.state === 'in');
    const cacheMaxAge = hasLiveGames ? 10 : 60; // 10s for live games, 60s otherwise

    return NextResponse.json<GamesResponse>(
      {
        events: games,
        teams: Object.values(teamMap),
        lastUpdated,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${cacheMaxAge}`,
        },
      }
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};
