import { GameLean, TeamLean } from '../../../types';
import { StandingEntry, TieLog } from '../../../api-types';
import { CFBConferenceTiebreakerConfig } from './types';
import { calculateStandings } from './calculateStandings';

export const calculateDivisionalStandings = (
  games: GameLean[],
  teams: TeamLean[],
  config: CFBConferenceTiebreakerConfig
): { standings: StandingEntry[]; tieLogs: TieLog[] } => {
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

    const { standings: divisionStandings, tieLogs: divisionTieLogs } = calculateStandings(
      games,
      divisionTeamIds,
      config
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
    const { standings: noDivisionStandings, tieLogs: noDivisionTieLogs } = calculateStandings(
      games,
      noDivisionTeamIds,
      config
    );

    allStandings.push(...noDivisionStandings);
    allTieLogs.push(...noDivisionTieLogs);
  }

  return { standings: allStandings, tieLogs: allTieLogs };
};
