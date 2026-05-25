import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import { getTeamPointsFor, getTeamPointsAgainst, getTeamAbbrev, EPSILON } from '../helpers';
import { NFL_TEAM_BY_ESPN_ID, getTeamsInConference } from '../../constants';

const computeRanks = (
  entries: { teamId: string; value: number }[],
  descending: boolean
): Map<string, number> => {
  const sorted = [...entries].sort((a, b) => (descending ? b.value - a.value : a.value - b.value));
  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && Math.abs(sorted[i].value - sorted[i - 1].value) >= EPSILON) {
      rank = i + 1;
    }
    rankMap.set(sorted[i].teamId, rank);
  }
  return rankMap;
};

const applyCombinedRanking = (
  tiedTeams: string[],
  allGames: Game[],
  scopeTeamIds: string[],
  scopeLabel: string
): NflRuleResult => {
  const pfEntries = scopeTeamIds.map((teamId) => ({
    teamId,
    value: getTeamPointsFor(teamId, allGames),
  }));

  const paEntries = scopeTeamIds.map((teamId) => ({
    teamId,
    value: getTeamPointsAgainst(teamId, allGames),
  }));

  const pfRanks = computeRanks(pfEntries, true);
  const paRanks = computeRanks(paEntries, false);

  const tiedResults = tiedTeams.map((teamId) => {
    const pfRank = pfRanks.get(teamId) ?? scopeTeamIds.length;
    const paRank = paRanks.get(teamId) ?? scopeTeamIds.length;
    return { teamId, pfRank, paRank, combined: pfRank + paRank };
  });

  const minCombined = Math.min(...tiedResults.map((t) => t.combined));
  const winners = tiedResults.filter((t) => t.combined === minCombined).map((t) => t.teamId);

  const detailParts = tiedResults
    .sort((a, b) => a.combined - b.combined)
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} ${t.pfRank}+${t.paRank}=${t.combined}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} combined ranking (${scopeLabel})`,
  };
};

export const applyCombinedRankingConference = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => {
  const firstMeta = NFL_TEAM_BY_ESPN_ID.get(tiedTeams[0]);
  if (!firstMeta) {
    return { winners: [...tiedTeams], detail: 'Unknown conference for combined ranking' };
  }

  const conferenceTeamIds = getTeamsInConference(firstMeta.conference).map((t) => t.espnId);

  return applyCombinedRanking(tiedTeams, allGames, conferenceTeamIds, 'conference');
};

export const applyCombinedRankingAll = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => {
  const allTeamIds = new Set<string>();
  for (const g of allGames) {
    allTeamIds.add(g.home.teamId);
    allTeamIds.add(g.away.teamId);
  }

  return applyCombinedRanking(tiedTeams, allGames, [...allTeamIds], 'all teams');
};
