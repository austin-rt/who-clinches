import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import {
  getTeamPointsFor,
  getTeamPointsAgainst,
  getTeamAbbrev,
  getCommonOpponents,
  isConferenceGame,
  EPSILON,
} from '../helpers';

const computeNetPoints = (
  tiedTeams: string[],
  allGames: Game[],
  scopeGames: (teamId: string) => Game[],
  scopeLabel: string
): NflRuleResult => {
  const teamNets = tiedTeams.map((teamId) => {
    const relevantGames = scopeGames(teamId);
    const pf = getTeamPointsFor(teamId, relevantGames);
    const pa = getTeamPointsAgainst(teamId, relevantGames);
    return { teamId, net: pf - pa };
  });

  const maxNet = Math.max(...teamNets.map((t) => t.net));
  const winners = teamNets.filter((t) => Math.abs(t.net - maxNet) < EPSILON).map((t) => t.teamId);

  const detailParts = teamNets
    .sort((a, b) => b.net - a.net)
    .map((t) => {
      const sign = t.net >= 0 ? '+' : '';
      return `${getTeamAbbrev(t.teamId, allGames)} ${sign}${t.net}`;
    });

  return {
    winners,
    detail: `${detailParts.join(', ')} net pts (${scopeLabel})`,
  };
};

export const applyNetPointsAll = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult =>
  computeNetPoints(
    tiedTeams,
    allGames,
    (teamId) => allGames.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId),
    'all games'
  );

export const applyNetPointsConference = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult =>
  computeNetPoints(
    tiedTeams,
    allGames,
    (teamId) =>
      allGames.filter(
        (g) => (g.home.teamId === teamId || g.away.teamId === teamId) && isConferenceGame(g)
      ),
    'conference games'
  );

export const applyNetPointsCommon = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
): NflRuleResult => {
  const commonOpps = getCommonOpponents(tiedTeams, allGames);

  if (commonOpps.length === 0) {
    return {
      winners: [...tiedTeams],
      detail: 'No common opponents for net points',
    };
  }

  const commonSet = new Set(commonOpps);

  return computeNetPoints(
    tiedTeams,
    allGames,
    (teamId) =>
      allGames.filter(
        (g) =>
          (g.home.teamId === teamId && commonSet.has(g.away.teamId)) ||
          (g.away.teamId === teamId && commonSet.has(g.home.teamId))
      ),
    'common games'
  );
};
