import { NextRequest, NextResponse } from 'next/server';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { GameLean, TeamLean } from '@/lib/types';
import { TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import type { Conference } from 'cfbd';
import { getConferenceMetadata, isValidSport, isValidConference, type SportSlug, type ConferenceAbbreviation } from '@/lib/constants';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { ConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';

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
  conf: NonNullable<Conference['abbreviation']>
): Promise<{ config: ConferenceTiebreakerConfig | null; error?: string }> => {
  try {
    if (conf === 'SEC') {
      const { SEC_TIEBREAKER_CONFIG } = await import('@/lib/cfb/tiebreaker-rules/sec/config');
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
    const conf = confParam as ConferenceAbbreviation;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

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

    const seasonYear = season ? parseInt(season, 10) : await getDefaultSeasonFromCfbd();

    const cfbdGames = await cfbdClient.getGames({
      year: seasonYear,
      conference: conferenceMeta.cfbdId,
    });

    const completedConferenceGames = cfbdGames.filter(
      (game) =>
        game.conferenceGame &&
        game.completed &&
        game.homePoints !== null &&
        game.homePoints !== undefined &&
        game.awayPoints !== null &&
        game.awayPoints !== undefined
    );

    const cfbdTeams = await cfbdClient.getTeams({
      conference: conferenceMeta.cfbdId,
    });

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

    const reshaped = reshapeCfbdGames(completedConferenceGames, teamMap);
    const gamesForCalculation: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const allTeamIds = teams.map((team) => team._id);
    const { standings } = calculateStandings(gamesForCalculation, allTeamIds, config);

    const teamMetadata: Record<string, TeamMetadata> = {};
    for (const team of teams) {
      const standing = standings.find((s) => s.teamId === team._id);

      teamMetadata[team._id] = {
        id: team._id,
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

    return NextResponse.json(
      {
        teams: Object.values(teamMetadata),
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
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};
