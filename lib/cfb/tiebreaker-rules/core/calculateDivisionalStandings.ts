import { GameLean, TeamLean } from '../../../types';
import { StandingEntry, TieLog } from '../../../api-types';
import { CFBConferenceTiebreakerConfig } from './types';
import { calculateStandings } from './calculateStandings';

export const calculateDivisionalStandings = async (
  games: GameLean[],
  teams: TeamLean[],
  config: CFBConferenceTiebreakerConfig
): Promise<{ standings: StandingEntry[]; tieLogs: TieLog[] }> => {
  const teamsByDivision = new Map<string, TeamLean[]>();
  const teamsWithoutDivision: TeamLean[] = [];

  for (const team of teams) {
    const division = team.division || null;

    if (division) {
      if (!teamsByDivision.has(division)) {
        teamsByDivision.set(division, []);
      }
      teamsByDivision.get(division)!.push(team);
    } else {
      teamsWithoutDivision.push(team);
    }
  }

  const allStandings: StandingEntry[] = [];
  const allTieLogs: TieLog[] = [];

  for (const [division, divisionTeams] of teamsByDivision.entries()) {
    const divisionTeamIds = divisionTeams.map((t) => t._id);

    const { standings: divisionStandings, tieLogs: divisionTieLogs } = await calculateStandings(
      games,
      divisionTeamIds,
      config,
      teams
    );

    const standingsWithDivision = divisionStandings.map((standing) => ({
      ...standing,
      division,
    }));

    allStandings.push(...standingsWithDivision);
    allTieLogs.push(...divisionTieLogs);
  }

  if (teamsWithoutDivision.length > 0) {
    const noDivisionTeamIds = teamsWithoutDivision.map((t) => t._id);
    const { standings: noDivisionStandings, tieLogs: noDivisionTieLogs } = await calculateStandings(
      games,
      noDivisionTeamIds,
      config,
      teams
    );

    allStandings.push(...noDivisionStandings);
    allTieLogs.push(...noDivisionTieLogs);
  }

  return { standings: allStandings, tieLogs: allTieLogs };
};
