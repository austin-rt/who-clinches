import { NextRequest, NextResponse } from 'next/server';
import {
  applyOverrides,
  filterRegularSeasonGames,
} from '@/lib/cfb/tiebreaker-rules/common/core-helpers';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
import { SimulateResponse, TeamMetadata } from '@/app/store/api';
import { GameLean, TeamLean } from '@/lib/types';
import {
  getConferenceMetadata,
  isValidSport,
  CFB_CONFERENCE_CONFIGS,
  isValidConference,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { checkSameOrigin } from '@/lib/api/same-origin-gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toTeamLean = (tm: TeamMetadata): TeamLean => ({
  _id: tm.id,
  name: tm.name,
  displayName: tm.displayName,
  shortDisplayName: tm.shortDisplayName,
  abbreviation: tm.abbrev,
  logo: tm.logo,
  color: tm.color,
  alternateColor: tm.alternateColor,
  conferenceId: tm.conferenceId,
  division: tm.division ?? null,
  record: tm.record,
  conferenceStanding: tm.conferenceStanding,
  nationalRank: tm.nationalRank ?? null,
  spPlusRating: tm.spPlusRating ?? null,
  sor: tm.sor ?? null,
});

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  const originCheck = checkSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const body = await request.json();
    const { season, games, teams, overrides = {} } = body;

    if (!season || !Array.isArray(games) || !Array.isArray(teams)) {
      return NextResponse.json({ error: 'season, games, and teams are required' }, { status: 400 });
    }

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json({ error: `Unsupported sport: ${sportParam}` }, { status: 400 });
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json({ error: `Unsupported conference: ${confParam}` }, { status: 400 });
    }

    const conf = confParam as CFBConferenceAbbreviation;
    const conferenceMeta = getConferenceMetadata(conf);

    if (!conferenceMeta) {
      return NextResponse.json(
        { error: `Unsupported conference: ${conf} for sport: ${sportParam as SportSlug}` },
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

    const normalizedOverrides =
      conf === 'sec'
        ? overrides
        : Object.fromEntries(
            Object.entries(overrides).map(([gameId, pick]) => {
              const { homeScore, awayScore } = pick as { homeScore: number; awayScore: number };
              return [
                gameId,
                homeScore > awayScore
                  ? { homeScore: 1, awayScore: 0 }
                  : { homeScore: 0, awayScore: 1 },
              ];
            })
          );

    const clientGames: GameLean[] = games;
    const filteredGames = filterRegularSeasonGames(clientGames);
    const finalGames = applyOverrides(filteredGames, normalizedOverrides);

    const teamLeanArray: TeamLean[] = (teams as TeamMetadata[]).map(toTeamLean);
    const conferenceTeamIds = new Set(teamLeanArray.map((t) => t._id));

    const teamSet = new Set<string>();
    for (const game of finalGames) {
      if (conferenceTeamIds.has(game.home.teamId)) teamSet.add(game.home.teamId);
      if (conferenceTeamIds.has(game.away.teamId)) teamSet.add(game.away.teamId);
    }
    const allTeams = Array.from(teamSet);

    const filteredConferenceGames = finalGames.filter(
      (game) => conferenceTeamIds.has(game.home.teamId) && conferenceTeamIds.has(game.away.teamId)
    );

    const hasDivisions = teamLeanArray.some(
      (team) => team.division !== null && team.division !== undefined
    );

    const { standings, tieLogs, tieFlowGraphs } = hasDivisions
      ? await calculateDivisionalStandings(filteredConferenceGames, teamLeanArray, config)
      : await calculateStandings(filteredConferenceGames, allTeams, config, teamLeanArray);

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
      { standings, championship, tieLogs, tieFlowGraphs },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/simulate/[sport]/[conf]',
      action: 'simulate-standings',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
