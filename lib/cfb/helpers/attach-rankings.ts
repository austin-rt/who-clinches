import { TeamLean } from '@/lib/types';
import type { PollWeek as CFBDPollWeek } from 'cfbd';

/**
 * Attaches CFP rankings to teams based on team name matching.
 * Finds the latest CFP poll from the PollWeek array and matches teams by name.
 *
 * @param teams - Array of teams to attach rankings to
 * @param pollWeeks - Array of PollWeek objects from CFBD API (will filter for CFP polls internally)
 * @returns Teams with cfpRank attached (null if not ranked, undefined if no rankings available)
 */
export const attachCfpRankingsToTeams = (
  teams: TeamLean[],
  pollWeeks: CFBDPollWeek[] | null
): TeamLean[] => {
  if (!pollWeeks || pollWeeks.length === 0) {
    return teams.map((team) => ({ ...team, cfpRank: undefined }));
  }

  // Find the latest CFP poll (highest week number, or most recent if week is null)
  const sortedPollWeeks = [...pollWeeks].sort((a, b) => {
    const weekA = a.week ?? 0;
    const weekB = b.week ?? 0;
    return weekB - weekA; // Latest first
  });

  const latestPollWeek = sortedPollWeeks[0];
  if (!latestPollWeek?.polls || latestPollWeek.polls.length === 0) {
    return teams.map((team) => ({ ...team, cfpRank: undefined }));
  }

  // Find the CFP poll (should already be filtered, but double-check)
  const cfpPoll = latestPollWeek.polls.find(
    (poll) =>
      poll.poll?.toLowerCase().includes('playoff') ||
      poll.poll?.toLowerCase().includes('cfp') ||
      poll.poll?.toLowerCase().includes('college football playoff')
  );

  if (!cfpPoll?.ranks || cfpPoll.ranks.length === 0) {
    return teams.map((team) => ({ ...team, cfpRank: undefined }));
  }

  // Create a map of team name -> rank
  // Use teamId for matching if available, otherwise fall back to school name
  const rankMap = new Map<string | number, number>();
  for (const rankEntry of cfpPoll.ranks) {
    if (rankEntry.rank !== null && rankEntry.rank !== undefined) {
      if (rankEntry.teamId !== undefined && rankEntry.teamId !== null) {
        rankMap.set(String(rankEntry.teamId), rankEntry.rank);
      }
      if (rankEntry.school) {
        rankMap.set(normalizeTeamName(rankEntry.school), rankEntry.rank);
      }
    }
  }

  // Attach rankings to teams
  return teams.map((team) => {
    // Try matching by teamId first (most reliable)
    let rank: number | null | undefined = undefined;
    if (rankMap.has(team._id)) {
      rank = rankMap.get(team._id)!;
    } else {
      // Try matching by name (case-insensitive, normalized)
      const normalizedName = normalizeTeamName(team.name);
      if (rankMap.has(normalizedName)) {
        rank = rankMap.get(normalizedName)!;
      } else {
        // Try matching by displayName or shortDisplayName
        const normalizedDisplayName = normalizeTeamName(team.displayName);
        const normalizedShortName = normalizeTeamName(team.shortDisplayName);
        if (rankMap.has(normalizedDisplayName)) {
          rank = rankMap.get(normalizedDisplayName)!;
        } else if (rankMap.has(normalizedShortName)) {
          rank = rankMap.get(normalizedShortName)!;
        } else {
          rank = null; // Team is not ranked
        }
      }
    }

    return { ...team, cfpRank: rank };
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
