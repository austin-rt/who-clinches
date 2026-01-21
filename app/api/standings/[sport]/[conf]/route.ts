import { NextRequest, NextResponse } from 'next/server';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { GameLean, TeamLean } from '@/lib/types';
import { TeamMetadata, ApiErrorResponse } from '@/app/store/api';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  CFB_CONFERENCE_CONFIGS,
  CFBD_SEASON_TYPE,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
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

    const config = CFB_CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
    if (!config) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Conference config not found for ${conf}`,
          code: 'CONFIG_ERROR',
        },
        { status: 400 }
      );
    }

    const seasonYear = season ? parseInt(season, 10) : await getDefaultSeasonFromCfbd();

    const cfbdGames = await cfbdClient.getGames({
      year: seasonYear,
      conference: conferenceMeta.cfbdId,
      seasonType: CFBD_SEASON_TYPE.REGULAR,
    });

    const completedConferenceGames = cfbdGames.filter(
      (game) =>
        game.conferenceGame === true &&
        !game.notes?.toLowerCase().includes('championship') &&
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
    const allGames: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const { filterRegularSeasonGames } = await import(
      '@/lib/cfb/tiebreaker-rules/common/core-helpers'
    );
    const gamesForCalculation = filterRegularSeasonGames(allGames);

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

    // Fetch rankings, advanced stats, SP+ ratings, and FPI (for SOR) for the season
    const [rankingsResponse, advancedStatsResponse, spRatingsResponse, fpiRatingsResponse] =
      await Promise.all([
        cfbdClient.getRankings({ year: seasonYear }),
        cfbdClient.getAdvancedSeasonStats({ year: seasonYear }),
        cfbdClient.getSp({ year: seasonYear }),
        cfbdClient.getFpi({ year: seasonYear }),
      ]);

    // Attach rankings and stats to teams
    const { attachCfpRankingsToTeams } = await import('@/lib/cfb/helpers/attach-rankings');
    const { attachAdvancedStatsToTeams } = await import('@/lib/cfb/helpers/attach-advanced-stats');
    const { attachSpPlusToTeams } = await import('@/lib/cfb/helpers/attach-sp-plus');
    const { attachSorToTeams } = await import('@/lib/cfb/helpers/attach-sor');

    let teamsWithData = attachCfpRankingsToTeams(teamLeanArray, rankingsResponse);
    teamsWithData = attachAdvancedStatsToTeams(teamsWithData, advancedStatsResponse);
    teamsWithData = attachSpPlusToTeams(teamsWithData, spRatingsResponse);
    teamsWithData = attachSorToTeams(teamsWithData, fpiRatingsResponse);

    const { standings } = hasDivisions
      ? await calculateDivisionalStandings(gamesForCalculation, teamsWithData, config)
      : await calculateStandings(
          gamesForCalculation,
          teamsWithData.map((team) => team._id),
          config,
          teamsWithData
        );

    const teamMetadata: Record<string, TeamMetadata> = {};
    for (const team of teamsWithData) {
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
        division: standing?.division ?? team.division ?? null,
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
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/standings/[sport]/[conf]',
      action: 'get-standings',
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
