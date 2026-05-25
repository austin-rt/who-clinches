import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import {
  getTeamRecord,
  getTeamAbbrev,
  formatRecord,
  bestWinPctTeams,
  isDivisionGame,
} from '../helpers';
import { nflWinPct } from '../../types';

export const applyDivisionRecord = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => {
  const teamRecords = tiedTeams.map((teamId) => {
    const divGames = allGames.filter(
      (g) => (g.home.teamId === teamId || g.away.teamId === teamId) && isDivisionGame(g)
    );
    return { teamId, record: getTeamRecord(teamId, divGames) };
  });

  const winners = bestWinPctTeams(teamRecords);

  const detailParts = teamRecords
    .sort((a, b) => nflWinPct(b.record) - nflWinPct(a.record))
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} ${formatRecord(t.record)}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} in division`,
  };
};
