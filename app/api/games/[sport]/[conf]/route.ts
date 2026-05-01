import { NextRequest, NextResponse } from 'next/server';
import { getGames, getTeams } from '@/lib/cfb/cfbd-cached';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { GameLean, TeamLean } from '@/lib/types';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/app/store/api';
import type { Conference } from 'cfbd';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  CFBD_SEASON_TYPE,
  CFB_CONFERENCE_CONFIGS,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fetchGamesFromCfbd = async (
  sport: SportSlug,
  conf: NonNullable<Conference['abbreviation']>,
  season: number,
  week?: number
): Promise<NextResponse<GamesResponse | ApiErrorResponse>> => {
  const conferenceMeta = getConferenceMetadata(conf);

  if (!conferenceMeta) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Unsupported conference: ${conf} for sport: ${sport}`,
        code: 'INVALID_CONFERENCE',
      },
      { status: 400 }
    );
  }

  try {
    const cfbdGames = await getGames({
      year: season,
      conference: conferenceMeta.cfbdId,
      seasonType: CFBD_SEASON_TYPE.REGULAR,
      week,
    });

    const conferenceGamesOnly = cfbdGames.filter(
      (game) => game.conferenceGame === true && !game.notes?.toLowerCase().includes('championship')
    );

    const teamsByConference = await getTeams(season);
    const cfbdTeams = teamsByConference[conferenceMeta.cfbdId] ?? [];

    const teams = extractTeamsFromCfbd(cfbdTeams, conferenceMeta.cfbdId);
    const teamMap = new Map<string, TeamLean>(
      teams.map((team) => [
        team._id,
        {
          ...team,
          conferenceId: team.conference,
        } as TeamLean,
      ])
    );

    const reshaped = reshapeCfbdGames(conferenceGamesOnly, teamMap);
    const allGames: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const { filterRegularSeasonGames } = await import(
      '@/lib/cfb/tiebreaker-rules/common/core-helpers'
    );
    const filteredGames = filterRegularSeasonGames(allGames);

    const completedConferenceGames = filteredGames.filter(
      (game) =>
        game.completed &&
        game.conferenceGame &&
        game.home.score !== null &&
        game.away.score !== null
    );

    const standingsMap = new Map<
      string,
      { rank: number; confRecord: { wins: number; losses: number }; division?: string | null }
    >();

    if (completedConferenceGames.length > 0) {
      const config = CFB_CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
      if (config) {
        const teamLeanArray: TeamLean[] = teams.map((team) => ({
          _id: team._id,
          name: team.name,
          displayName: team.displayName,
          shortDisplayName: team.shortDisplayName,
          abbreviation: team.abbreviation,
          logo: team.logo,
          color: team.color,
          alternateColor: team.alternateColor,
          conferenceId: team.conference,
          division: team.division,
          record: team.record,
          conferenceStanding: team.conferenceStanding,
        }));

        const hasDivisions = teamLeanArray.some(
          (team) => team.division !== null && team.division !== undefined
        );

        const { standings } = hasDivisions
          ? await calculateDivisionalStandings(completedConferenceGames, teamLeanArray, config)
          : await calculateStandings(
              completedConferenceGames,
              teams.map((team) => team._id),
              config,
              teamLeanArray
            );

        for (const standing of standings) {
          standingsMap.set(standing.teamId, {
            rank: standing.rank,
            confRecord: standing.confRecord,
            division: standing.division ?? null,
          });
        }
      }
    }

    const teamMetadata: Record<string, TeamMetadata> = {};
    for (const team of teams) {
      const standing = standingsMap.get(team._id);
      const conferenceStanding = team.conferenceStanding || 'Tied for 1st';
      teamMetadata[team._id] = {
        id: team._id,
        abbrev: team.abbreviation,
        name: team.name,
        displayName: team.displayName,
        shortDisplayName: team.shortDisplayName,
        logo: team.logo,
        color: team.color,
        alternateColor:
          team.alternateColor && team.alternateColor !== 'undefined'
            ? team.alternateColor
            : '000000',
        conferenceStanding,
        conferenceRecord: standing
          ? `${standing.confRecord.wins}-${standing.confRecord.losses}`
          : team.record?.conference || '0-0',
        rank: standing ? standing.rank : null,
        division: standing?.division ?? team.division ?? null,
      };
    }

    const hasLiveGames = filteredGames.some((game) => game.state === 'in');
    const cacheMaxAge = hasLiveGames ? 10 : 60;

    return NextResponse.json<GamesResponse>(
      {
        events: filteredGames,
        teams: Object.values(teamMetadata),
        season,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${cacheMaxAge}`,
        },
      }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/games/[sport]/[conf]',
      action: 'fetch-games',
    });
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
) => {
  try {
    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported sport: ${sportParam}`,
          code: 'INVALID_SPORT',
        },
        { status: 400 }
      );
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${confParam}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    const sport = sportParam as SportSlug;
    const conf = confParam as CFBConferenceAbbreviation;
    const { searchParams } = new URL(request.url);

    const season = searchParams.get('season');
    const week = searchParams.get('week');

    const seasonYear = season ? parseInt(season, 10) : await getDefaultSeasonFromCfbd();

    if (week && !season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Season is required when week is provided',
          code: 'MISSING_SEASON',
        },
        { status: 400 }
      );
    }

    return await fetchGamesFromCfbd(sport, conf, seasonYear, week ? parseInt(week, 10) : undefined);
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/games/[sport]/[conf]',
      action: 'get-games',
    });
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};
