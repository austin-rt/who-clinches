import { NextRequest, NextResponse } from 'next/server';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { applyOverrides } from '@/lib/cfb/tiebreaker-rules/common/core-helpers';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
import { SimulateResponse } from '@/app/store/api';
import { GameLean, TeamLean } from '@/lib/types';
import {
  getConferenceMetadata,
  isValidSport,
  CFB_CONFERENCE_CONFIGS,
  isValidConference,
  CFBD_SEASON_TYPE,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  try {
    const body = await request.json();
    const { season, overrides = {} } = body;

    if (!season) {
      return NextResponse.json(
        {
          error: 'Season is required',
        },
        { status: 400 }
      );
    }

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json(
        {
          error: `Unsupported sport: ${sportParam}`,
        },
        { status: 400 }
      );
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json(
        {
          error: `Unsupported conference: ${confParam}`,
        },
        { status: 400 }
      );
    }

    const sport = sportParam as SportSlug;
    const conf = confParam as CFBConferenceAbbreviation;
    const conferenceMeta = getConferenceMetadata(conf);

    if (!conferenceMeta) {
      return NextResponse.json(
        { error: `Unsupported conference: ${conf} for sport: ${sport}` },
        { status: 400 }
      );
    }

    const config = CFB_CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
    if (!config) {
      return NextResponse.json(
        { error: `Conference config not found for ${conf}` },
        { status: 400 }
      );
    }

    const cfbdGames = await cfbdClient.getGames({
      year: season,
      conference: conferenceMeta.cfbdId,
      seasonType: CFBD_SEASON_TYPE.REGULAR,
    });

    const conferenceGamesOnly = cfbdGames.filter(
      (game) =>
        game.conferenceGame === true &&
        !game.notes?.toLowerCase().includes('championship') &&
        game.homePoints !== null &&
        game.homePoints !== undefined &&
        game.awayPoints !== null &&
        game.awayPoints !== undefined
    );

    if (conferenceGamesOnly.length === 0) {
      return NextResponse.json(
        { error: `No ${conferenceMeta.name} conference games found for season ${season}` },
        { status: 404 }
      );
    }

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

    const reshaped = reshapeCfbdGames(conferenceGamesOnly, teamMap);
    const allGames: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const { filterRegularSeasonGames } = await import(
      '@/lib/cfb/tiebreaker-rules/common/core-helpers'
    );
    const filteredGames = filterRegularSeasonGames(allGames);
    const finalGames = applyOverrides(filteredGames, overrides);

    const conferenceTeamIds = new Set(teams.map((team) => team._id));
    const teamSet = new Set<string>();
    for (const game of finalGames) {
      if (conferenceTeamIds.has(game.home.teamId)) {
        teamSet.add(game.home.teamId);
      }
      if (conferenceTeamIds.has(game.away.teamId)) {
        teamSet.add(game.away.teamId);
      }
    }
    const allTeams = Array.from(teamSet);

    const filteredConferenceGames = finalGames.filter(
      (game) => conferenceTeamIds.has(game.home.teamId) && conferenceTeamIds.has(game.away.teamId)
    );

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

    // Fetch rankings, advanced stats, team stats, SP+ ratings, and FPI (for SOR) for the season
    const [
      rankingsResponse,
      advancedStatsResponse,
      teamStatsResponse,
      spRatingsResponse,
      fpiRatingsResponse,
    ] = await Promise.all([
      cfbdClient.getRankings({ year: season }),
      cfbdClient.getAdvancedSeasonStats({ year: season }),
      cfbdClient.getTeamStats({ year: season, conference: conferenceMeta.cfbdId }),
      cfbdClient.getSp({ year: season }),
      cfbdClient.getFpi({ year: season }),
    ]);

    // Attach rankings and stats to teams
    const { attachCfpRankingsToTeams } = await import('@/lib/cfb/helpers/attach-rankings');
    const { attachAdvancedStatsToTeams } = await import('@/lib/cfb/helpers/attach-advanced-stats');
    const { attachTurnoverMarginToTeams } = await import(
      '@/lib/cfb/helpers/attach-turnover-margin'
    );
    const { attachSpPlusToTeams } = await import('@/lib/cfb/helpers/attach-sp-plus');
    const { attachSorToTeams } = await import('@/lib/cfb/helpers/attach-sor');

    let teamsWithData = attachCfpRankingsToTeams(teamLeanArray, rankingsResponse);
    teamsWithData = attachAdvancedStatsToTeams(teamsWithData, advancedStatsResponse);
    teamsWithData = attachTurnoverMarginToTeams(teamsWithData, teamStatsResponse);
    teamsWithData = attachSpPlusToTeams(teamsWithData, spRatingsResponse);
    teamsWithData = attachSorToTeams(teamsWithData, fpiRatingsResponse);

    const { standings, tieLogs } = hasDivisions
      ? await calculateDivisionalStandings(filteredConferenceGames, teamsWithData, config)
      : await calculateStandings(filteredConferenceGames, allTeams, config, teamsWithData);

    let championship: [string, string];
    if (hasDivisions) {
      const divisionChampions = new Map<string, string>();
      for (const standing of standings) {
        const game = filteredConferenceGames.find(
          (g) => g.home.teamId === standing.teamId || g.away.teamId === standing.teamId
        );
        const division =
          game?.home.teamId === standing.teamId ? game.home.division : game?.away.division;
        if (division && standing.rank === 1 && !divisionChampions.has(division)) {
          divisionChampions.set(division, standing.teamId);
        }
      }
      const champions = Array.from(divisionChampions.values());
      if (champions.length === 2) {
        championship = [champions[0], champions[1]];
      } else {
        championship = [standings[0]?.teamId || '', standings[1]?.teamId || ''];
      }
    } else {
      championship = [standings[0].teamId, standings[1].teamId];
    }

    return NextResponse.json<SimulateResponse>(
      {
        standings,
        championship,
        tieLogs,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/simulate/[sport]/[conf]',
      action: 'simulate-standings',
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
