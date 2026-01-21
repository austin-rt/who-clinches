import { TeamLean } from '@/lib/types';
import type { AdvancedSeasonStat as CFBDAdvancedSeasonStat } from 'cfbd';

/**
 * Attaches advanced season statistics to teams based on team name matching.
 *
 * @param teams - Array of teams to attach stats to
 * @param advancedStats - Array of AdvancedSeasonStat objects from CFBD API
 * @returns Teams with advancedStats attached (undefined if not found)
 */
export const attachAdvancedStatsToTeams = (
  teams: TeamLean[],
  advancedStats: CFBDAdvancedSeasonStat[]
): TeamLean[] => {
  if (!advancedStats || advancedStats.length === 0) {
    return teams.map((team) => ({ ...team, advancedStats: undefined }));
  }

  // Create a map of team name -> stats
  const statsMap = new Map<string, CFBDAdvancedSeasonStat>();
  for (const stat of advancedStats) {
    if (stat.team) {
      const normalizedName = normalizeTeamName(stat.team);
      statsMap.set(normalizedName, stat);
    }
  }

  // Attach stats to teams
  return teams.map((team) => {
    const normalizedName = normalizeTeamName(team.name);
    const stat = statsMap.get(normalizedName);

    if (!stat || !stat.offense || !stat.defense) {
      return { ...team, advancedStats: undefined };
    }

    // Extract fields needed for improved composite approximation
    // SP+ uses: PPA, success rate, explosiveness, finishing drives (points per opportunity)
    const offense = stat.offense as {
      ppa?: number;
      successRate?: number;
      explosiveness?: number;
      pointsPerOpportunity?: number;
    };
    const defense = stat.defense as {
      ppa?: number;
      successRate?: number;
      explosiveness?: number;
      pointsPerOpportunity?: number;
    };

    if (
      !offense ||
      !defense ||
      typeof offense.ppa !== 'number' ||
      typeof offense.successRate !== 'number' ||
      typeof defense.ppa !== 'number' ||
      typeof defense.successRate !== 'number'
    ) {
      return { ...team, advancedStats: undefined };
    }

    return {
      ...team,
      advancedStats: {
        offense: {
          ppa: offense.ppa,
          successRate: offense.successRate,
          explosiveness:
            typeof offense.explosiveness === 'number' ? offense.explosiveness : undefined,
          pointsPerOpportunity:
            typeof offense.pointsPerOpportunity === 'number'
              ? offense.pointsPerOpportunity
              : undefined,
        },
        defense: {
          ppa: defense.ppa,
          successRate: defense.successRate,
          explosiveness:
            typeof defense.explosiveness === 'number' ? defense.explosiveness : undefined,
          pointsPerOpportunity:
            typeof defense.pointsPerOpportunity === 'number'
              ? defense.pointsPerOpportunity
              : undefined,
        },
      },
    };
  });
};

/**
 * Normalizes team name for matching (lowercase, trim, remove common variations)
 */
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^the\s+/i, ''); // Remove leading "The"
};
