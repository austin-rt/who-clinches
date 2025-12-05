import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import { GameLean, GameState } from '@/lib/types';
import { TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { ConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';

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

const getConferenceConfig = async (
  conf: ConferenceSlug
): Promise<{ config: ConferenceTiebreakerConfig | null; error?: string }> => {
  try {
    if (conf === 'sec') {
      const { SEC_TIEBREAKER_CONFIG } = await import(
        '@/lib/cfb/tiebreaker-rules/sec/config'
      );
      return { config: SEC_TIEBREAKER_CONFIG };
    }

    return { config: null, error: `Unsupported conference: ${conf}` };
  } catch (error) {
    return {
      config: null,
      error: `Failed to load conference config for ${conf}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
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

    const configResult = await getConferenceConfig(conf);
    if (configResult.error || !configResult.config) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: configResult.error || `Conference config not found for ${conf}`,
          code: 'CONFIG_ERROR',
        },
        { status: 400 }
      );
    }

    const config: ConferenceTiebreakerConfig = configResult.config;

    const [espnSport, espnLeague] = espnRoute.split('/');
    const seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();

    const conferenceTeams = await Team.find({
      conferenceId: conferenceMeta.espnId,
    })
      .lean()
      .select(
        '_id name abbreviation displayName shortDisplayName logo color alternateColor conferenceStanding record'
      )
      .exec();

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
        espnId: game.espnId,
        displayName: game.displayName,
        date: game.date,
        week: game.week ?? null,
        season: game.season,
        sport: game.sport,
        league: game.league,
        state: game.state as GameState,
        completed: game.completed,
        conferenceGame: game.conferenceGame,
        neutralSite: game.neutralSite,
        venue: {
          fullName: game.venue.fullName,
          city: game.venue.city,
          state: game.venue.state,
          timezone: game.venue.timezone,
        },
        home: {
          teamEspnId: game.home.teamEspnId,
          abbrev: game.home.abbrev,
          displayName: game.home.displayName,
          shortDisplayName: game.home.shortDisplayName,
          logo: game.home.logo,
          color: game.home.color,
          alternateColor: game.home.alternateColor,
          score: game.home.score ?? null,
          rank: game.home.rank ?? null,
        },
        away: {
          teamEspnId: game.away.teamEspnId,
          abbrev: game.away.abbrev,
          displayName: game.away.displayName,
          shortDisplayName: game.away.shortDisplayName,
          logo: game.away.logo,
          color: game.away.color,
          alternateColor: game.away.alternateColor,
          score: game.away.score ?? null,
          rank: game.away.rank ?? null,
        },
        odds: {
          favoriteTeamEspnId: game.odds.favoriteTeamEspnId ?? null,
          spread: game.odds.spread ?? null,
          overUnder: game.odds.overUnder ?? null,
        },
        predictedScore: {
          home: game.predictedScore.home,
          away: game.predictedScore.away,
        },
        gameType: game.gameType && {
          name: game.gameType.name,
          abbreviation: game.gameType.abbreviation,
        },
      })
    );

    const allTeamIds = conferenceTeams.map((team) => String(team._id));
    const { standings } = calculateStandings(gamesForCalculation, allTeamIds, config);

    const teamMap: Record<string, TeamMetadata> = {};
    for (const team of conferenceTeams) {
      const teamId = String(team._id);
      const standing = standings.find((s) => s.teamId === teamId);

      teamMap[teamId] = {
        id: teamId,
        abbrev: team.abbreviation,
        name: team.name,
        displayName: team.displayName,
        shortDisplayName: team.shortDisplayName,
        logo: team.logo,
        color: team.color,
        alternateColor: team.alternateColor,
        conferenceStanding: standing
          ? `${standing.rank}${getOrdinalSuffix(standing.rank)}`
          : (team.conferenceStanding ?? 'Tied for 1st'),
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
