import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import { getTeamAbbrev, teamGamesAgainst, getTeamRecord } from '../helpers';

export const applyH2HSweep = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => {
  const sweepWinners: string[] = [];

  for (const teamId of tiedTeams) {
    const otherTeams = tiedTeams.filter((t) => t !== teamId);
    let sweptAll = true;

    for (const oppId of otherTeams) {
      const matchups = teamGamesAgainst(teamId, [oppId], games);
      if (matchups.length === 0) {
        sweptAll = false;
        break;
      }

      const record = getTeamRecord(teamId, matchups);
      if (record.losses > 0 || record.ties > 0) {
        sweptAll = false;
        break;
      }
    }

    if (sweptAll) {
      sweepWinners.push(teamId);
    }
  }

  if (sweepWinners.length === 1) {
    const winnerId = sweepWinners[0];
    const otherTeams = tiedTeams.filter((t) => t !== winnerId);
    const otherAbbrevs = otherTeams.map((t) => getTeamAbbrev(t, allGames));
    return {
      winners: sweepWinners,
      detail: `${getTeamAbbrev(winnerId, allGames)} swept H2H vs ${otherAbbrevs.join(', ')}`,
    };
  }

  return {
    winners: [...tiedTeams],
    detail: 'No team swept all head-to-head matchups',
  };
};
