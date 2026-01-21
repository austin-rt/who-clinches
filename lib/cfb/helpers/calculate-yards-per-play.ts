import type { TeamStat } from 'cfbd';

/**
 * Extracts yards per play for teams from CFBD TeamStat data.
 * Uses a single API call per conference to get all teams' stats.
 *
 * @param teamStats - Array of TeamStat objects from getTeamStats API call
 * @returns Map of team name to yards per play (or null if not available)
 */
export const calculateYardsPerPlayFromStats = (
  teamStats: TeamStat[]
): Map<string, number | null> => {
  const result = new Map<string, number | null>();

  // Group stats by team
  const statsByTeam = new Map<string, Map<string, number>>();

  for (const stat of teamStats) {
    if (!statsByTeam.has(stat.team)) {
      statsByTeam.set(stat.team, new Map());
    }

    const teamStatMap = statsByTeam.get(stat.team)!;
    const statValue =
      typeof stat.statValue === 'number'
        ? stat.statValue
        : typeof stat.statValue === 'string'
          ? parseFloat(stat.statValue)
          : null;

    if (statValue !== null && !isNaN(statValue)) {
      teamStatMap.set(stat.statName, statValue);
    }
  }

  // Calculate yards per play for each team
  for (const [team, statMap] of statsByTeam.entries()) {
    // Try direct yardsPerPlay stat first
    const yardsPerPlay = statMap.get('yardsPerPlay');
    if (yardsPerPlay !== undefined) {
      result.set(team, yardsPerPlay);
      continue;
    }

    // Otherwise calculate from totalYards / totalPlays
    const totalYards = statMap.get('totalYards') ?? statMap.get('yards');
    const totalPlays = statMap.get('totalPlays') ?? statMap.get('plays');

    if (totalYards !== undefined && totalPlays !== undefined && totalPlays > 0) {
      result.set(team, totalYards / totalPlays);
    } else {
      result.set(team, null);
    }
  }

  return result;
};
