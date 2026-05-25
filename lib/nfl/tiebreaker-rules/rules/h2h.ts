import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import { getTeamRecord, getTeamAbbrev, formatRecord, bestWinPctTeams } from '../helpers';
import { nflWinPct } from '../../types';

export const applyH2H = (tiedTeams: string[], games: Game[], allGames: Game[]): NflRuleResult => {
  const tiedSet = new Set(tiedTeams);

  const h2hGames = games.filter((g) => tiedSet.has(g.home.teamId) && tiedSet.has(g.away.teamId));

  if (h2hGames.length === 0) {
    return { winners: [...tiedTeams], detail: 'No head-to-head games played' };
  }

  const teamRecords = tiedTeams.map((teamId) => ({
    teamId,
    record: getTeamRecord(teamId, h2hGames),
  }));

  const winners = bestWinPctTeams(teamRecords);

  const detailParts = teamRecords
    .sort((a, b) => nflWinPct(b.record) - nflWinPct(a.record))
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} ${formatRecord(t.record)}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} in H2H`,
  };
};
