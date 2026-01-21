import type { TeamStat } from 'cfbd';

export const calculateTurnoverMarginFromStats = (
  teamStats: TeamStat[]
): Map<string, number | null> => {
  const result = new Map<string, number | null>();

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

  for (const [team, statMap] of statsByTeam.entries()) {
    const turnovers = statMap.get('turnovers');
    const turnoversOpponent = statMap.get('turnoversOpponent');

    if (turnovers !== undefined && turnoversOpponent !== undefined) {
      const turnoverMargin = turnoversOpponent - turnovers;
      result.set(team, turnoverMargin);
    } else {
      result.set(team, null);
    }
  }

  return result;
};



