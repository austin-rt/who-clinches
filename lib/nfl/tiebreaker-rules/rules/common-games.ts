import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import {
  getCommonOpponents,
  getTeamRecord,
  getTeamAbbrev,
  formatRecord,
  bestWinPctTeams,
  teamGamesAgainst,
} from '../helpers';
import { nflWinPct } from '../../types';

const applyCommonGames = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[],
  minCommonOpponents: number
): NflRuleResult => {
  const commonOpps = getCommonOpponents(tiedTeams, allGames);

  if (commonOpps.length < minCommonOpponents) {
    return {
      winners: [...tiedTeams],
      detail: `Only ${commonOpps.length} common opponent${commonOpps.length === 1 ? '' : 's'} (need ${minCommonOpponents})`,
    };
  }

  if (commonOpps.length === 0) {
    return {
      winners: [...tiedTeams],
      detail: 'No common opponents',
    };
  }

  const teamRecords = tiedTeams.map((teamId) => {
    const gamesVsCommon = teamGamesAgainst(teamId, commonOpps, allGames);
    return { teamId, record: getTeamRecord(teamId, gamesVsCommon) };
  });

  const winners = bestWinPctTeams(teamRecords);

  const detailParts = teamRecords
    .sort((a, b) => nflWinPct(b.record) - nflWinPct(a.record))
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} ${formatRecord(t.record)}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} vs ${commonOpps.length} common opponent${commonOpps.length === 1 ? '' : 's'}`,
  };
};

export const applyCommonGamesDivision = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => applyCommonGames(tiedTeams, games, allGames, 0);

export const applyCommonGamesWildCard = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => applyCommonGames(tiedTeams, games, allGames, 4);
