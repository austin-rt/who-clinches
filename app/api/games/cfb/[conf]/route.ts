import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import { MongoQuery, GameLean, TeamLean, GameState } from '@/lib/types';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { CONFERENCE_METADATA, type ConferenceSlug } from '@/lib/cfb/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest, { params }: { params: { conf: string } }) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const query: MongoQuery = {};

    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const state = searchParams.get('state');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (season) {
      query.season = parseInt(season, 10);
    }

    if (week) {
      query.week = parseInt(week, 10);
    }

    if (state && ['pre', 'in', 'post'].includes(state)) {
      query.state = state;
    }

    query.sport = 'football';
    query.league = 'college-football';

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const conf = (await params).conf as ConferenceSlug;

    if (!CONFERENCE_METADATA[conf]) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${conf}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    query.conferenceGame = true;

    const conferenceTeams = await Team.find({
      conferenceId: CONFERENCE_METADATA[conf].espnId.toString(),
    })
      .lean()
      .exec();

    if (conferenceTeams.length === 0) {
      return NextResponse.json<GamesResponse>(
        {
          events: [],
          teams: [],
          lastUpdated: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60',
          },
        }
      );
    }

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

    const allConferenceGames = await Game.find(query).lean().sort({ date: 1, week: 1 }).exec();

    const gamesRaw = allConferenceGames.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
    );

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

    const teamIds = new Set<string>();
    for (const game of games) {
      teamIds.add(game.home.teamEspnId);
      teamIds.add(game.away.teamEspnId);
    }

    const teamsRaw = await Team.find({ _id: { $in: Array.from(teamIds) } })
      .lean()
      .select('_id abbreviation displayName logo color alternateColor')
      .exec();

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

    const lastUpdated = new Date().toISOString();

    const hasLiveGames = games.some((game) => game.state === 'in');
    const cacheMaxAge = hasLiveGames ? 10 : 60;

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
