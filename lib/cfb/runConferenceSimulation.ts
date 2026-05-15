import {
  applyOverrides,
  filterRegularSeasonGames,
} from '@/lib/cfb/tiebreaker-rules/common/core-helpers';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
import { CFB_CONFERENCE_CONFIGS, type CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import type { SimulateResponse } from '@/lib/api-types';
import type { GameLean, TeamLean } from '@/lib/types';
import { getConferenceMetadata } from '@/lib/constants';

interface RunConferenceSimulationParams {
  games: GameLean[];
  teams: TeamLean[];
  overrides: Record<string, { homeScore: number; awayScore: number }>;
  conf: CFBConferenceAbbreviation;
}

export const runConferenceSimulation = async ({
  games,
  teams,
  overrides,
  conf,
}: RunConferenceSimulationParams): Promise<SimulateResponse> => {
  const conferenceMeta = getConferenceMetadata(conf);
  if (!conferenceMeta) {
    throw new Error(`Unsupported conference: ${conf}`);
  }

  const config = CFB_CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
  if (!config) {
    throw new Error(`Conference config not found for ${conf}`);
  }

  const normalizedOverrides =
    conf === 'sec'
      ? overrides
      : Object.fromEntries(
          Object.entries(overrides).map(([gameId, pick]) => {
            const { homeScore, awayScore } = pick;
            return [
              gameId,
              homeScore > awayScore
                ? { homeScore: 1, awayScore: 0 }
                : { homeScore: 0, awayScore: 1 },
            ];
          })
        );

  const filteredGames = filterRegularSeasonGames(games);
  const finalGames = applyOverrides(filteredGames, normalizedOverrides);

  const conferenceTeamIds = new Set(teams.map((t) => t._id));

  const teamSet = new Set<string>();
  for (const game of finalGames) {
    if (conferenceTeamIds.has(game.home.teamId)) teamSet.add(game.home.teamId);
    if (conferenceTeamIds.has(game.away.teamId)) teamSet.add(game.away.teamId);
  }
  const allTeams = Array.from(teamSet);

  const filteredConferenceGames = finalGames.filter(
    (game) => conferenceTeamIds.has(game.home.teamId) && conferenceTeamIds.has(game.away.teamId)
  );

  const hasDivisions = teams.some((team) => team.division !== null && team.division !== undefined);

  const { standings, tieLogs, tieFlowGraphs } = hasDivisions
    ? await calculateDivisionalStandings(filteredConferenceGames, teams, config)
    : await calculateStandings(filteredConferenceGames, allTeams, config, teams);

  let championship: string[];
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

  return { standings, championship, tieLogs, tieFlowGraphs };
};
