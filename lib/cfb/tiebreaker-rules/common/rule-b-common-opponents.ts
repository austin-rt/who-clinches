import { GameLean } from '../../../types';
import { getTeamRecord, EPSILON_CONSTANT } from './core-helpers';

export const applyRuleBCommonOpponents = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    return new Set(
      teamGames.map((g) => (g.home.teamId === teamId ? g.away.teamId : g.home.teamId))
    );
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common opponents' };
  }

  const records = tiedTeams.map((teamId) => {
    const vsCommonGames = games.filter(
      (g) =>
        (g.home.teamId === teamId && commonOpponents.includes(g.away.teamId)) ||
        (g.away.teamId === teamId && commonOpponents.includes(g.home.teamId))
    );
    return {
      teamId,
      ...getTeamRecord(teamId, vsCommonGames),
    };
  });

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const getAbbrev = (teamId: string) => {
    const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
  };

  const detail =
    records
      .sort((a, b) => b.winPct - a.winPct)
      .map((r) => `${getAbbrev(r.teamId)} ${r.wins}-${r.losses}`)
      .join(', ') + ` vs ${commonOpponents.length} common opponents`;

  return { winners, detail };
};
