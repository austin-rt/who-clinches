import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import { GameLean, GameState } from '@/lib/types';
import { TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { calculateStandingsFromCompletedGames } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { getDefaultPredictedScore } from '@/lib/cfb/helpers/prefill-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  try {
    await dbConnect();

    const { sport, conf } = await params;

    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

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

    const [espnSport, espnLeague] = espnRoute.split('/');
    const seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();

    // Fetch all conference teams
    const conferenceTeams = await Team.find({
      conferenceId: conferenceMeta.espnId,
    })
      .lean()
      .select(
        '_id name abbreviation displayName shortDisplayName logo color alternateColor conferenceStanding record'
      )
      .exec();

    // Fetch all completed conference games for the season
    const completedConferenceGames = await Game.find({
      sport: espnSport,
      league: espnLeague,
      season: seasonYear,
      conferenceGame: true,
      completed: true,
      'home.score': { $ne: null },
      'away.score': { $ne: null },
    })
      .lean()
      .exec();

    const gamesForCalculation: GameLean[] = completedConferenceGames.map(
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
          displayName: game.home?.displayName || game.home?.abbrev || '',
          shortDisplayName: game.home?.shortDisplayName || game.home?.displayName || game.home?.abbrev || '',
          logo: game.home?.logo || '',
          color: game.home?.color || '',
          alternateColor: game.home?.alternateColor || '000000',
          score: typeof game.home?.score === 'number' ? game.home.score : null,
          rank: typeof game.home?.rank === 'number' ? game.home.rank : null,
        },
        away: {
          teamEspnId: String(game.away?.teamEspnId || ''),
          abbrev: String(game.away?.abbrev || ''),
          displayName: game.away?.displayName || game.away?.abbrev || '',
          shortDisplayName: game.away?.shortDisplayName || game.away?.displayName || game.away?.abbrev || '',
          logo: game.away?.logo || '',
          color: game.away?.color || '',
          alternateColor: game.away?.alternateColor || '000000',
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
              home: Number(game.predictedScore.home || 0),
              away: Number(game.predictedScore.away || 0),
            }
          : getDefaultPredictedScore(),
        gameType: game.gameType
          ? {
              name: String(game.gameType.name),
              abbreviation: String(game.gameType.abbreviation),
            }
          : { name: 'Regular Season', abbreviation: 'reg' },
      })
    );

    const allTeamIds = conferenceTeams.map((team) => String(team._id));
    const { standings } = calculateStandingsFromCompletedGames(gamesForCalculation, allTeamIds);

    const teamMap: Record<string, TeamMetadata> = {};
    for (const team of conferenceTeams) {
      const teamId = String(team._id);
      const standing = standings.find((s) => s.teamId === teamId);

      teamMap[teamId] = {
        id: teamId,
        abbrev: String(team.abbreviation),
        name: String(team.name),
        displayName: String(team.displayName),
        shortDisplayName: String(team.shortDisplayName || team.displayName || team.abbreviation),
        logo: String(team.logo),
        color: String(team.color || '000000'),
        alternateColor:
          team.alternateColor && team.alternateColor !== 'undefined' ? String(team.alternateColor) : '000000',
        conferenceStanding: standing
          ? `${standing.rank}${getOrdinalSuffix(standing.rank)}`
          : team.conferenceStanding || 'Tied for 1st',
        conferenceRecord: standing
          ? `${standing.confRecord.wins}-${standing.confRecord.losses}`
          : '0-0',
        rank: standing ? standing.rank : null,
      };
    }

    const lastUpdated = new Date().toISOString();

    return NextResponse.json(
      {
        teams: Object.values(teamMap),
        lastUpdated,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};

