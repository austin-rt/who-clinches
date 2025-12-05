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
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );
    return new Set(
      teamGames.map((g) => (g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId))
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
        (g.home.teamEspnId === teamId && commonOpponents.includes(g.away.teamEspnId)) ||
        (g.away.teamEspnId === teamId && commonOpponents.includes(g.home.teamEspnId))
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

  const detail = `${commonOpponents.length} common opponents`;

  return { winners, detail };
};

