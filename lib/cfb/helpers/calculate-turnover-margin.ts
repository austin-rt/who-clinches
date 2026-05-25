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
    const parseStatValue = (val: unknown): number | null => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val);
      return null;
    };
    const statValue = parseStatValue(stat.statValue);

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
