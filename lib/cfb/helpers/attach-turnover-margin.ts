import { TeamLean } from '@/lib/types';
import type { TeamStat } from 'cfbd';
import { calculateTurnoverMarginFromStats } from './calculate-turnover-margin';

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '');
};

export const attachTurnoverMarginToTeams = (
  teams: TeamLean[],
  teamStats: TeamStat[]
): TeamLean[] => {
  if (!teamStats || teamStats.length === 0) {
    return teams.map((team) => ({ ...team, turnoverMargin: null }));
  }

  const turnoverMarginMap = calculateTurnoverMarginFromStats(teamStats);

  return teams.map((team) => {
    const normalizedName = normalizeTeamName(team.name);
    const turnoverMargin = turnoverMarginMap.get(normalizedName) ?? null;

    return {
      ...team,
      turnoverMargin,
    };
  });
};



