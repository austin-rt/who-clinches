import { GameLean } from '../../../types';
import { getTeamRecord, getTeamAbbrev, EPSILON_CONSTANT } from './core-helpers';

export const applyRuleAHeadToHead = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const h2hGames = games.filter(
    (g) => tiedTeams.includes(g.home.teamEspnId) && tiedTeams.includes(g.away.teamEspnId)
  );

  if (h2hGames.length === 0) {
    return { winners: tiedTeams, detail: 'No head-to-head games played' };
  }

  const records = tiedTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, h2hGames),
  }));

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const winnersSet = new Set(winners);
  const beatMap = new Map<string, string[]>();

  for (const game of h2hGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const homeId = game.home.teamEspnId;
    const awayId = game.away.teamEspnId;
    const homeAbbrev = getTeamAbbrev(homeId, games);
    const awayAbbrev = getTeamAbbrev(awayId, games);

    if (game.home.score > game.away.score) {
      if (winnersSet.has(homeId)) {
        if (!beatMap.has(homeId)) {
          beatMap.set(homeId, []);
        }
        beatMap.get(homeId)!.push(awayAbbrev);
      }
    } else {
      if (winnersSet.has(awayId)) {
        if (!beatMap.has(awayId)) {
          beatMap.set(awayId, []);
        }
        beatMap.get(awayId)!.push(homeAbbrev);
      }
    }
  }

  const detailParts: string[] = [];
  for (const [winnerId, beatenTeams] of beatMap.entries()) {
    if (beatenTeams.length > 0) {
      const winnerAbbrev = getTeamAbbrev(winnerId, games);
      const beatenStr =
        beatenTeams.length === 1
          ? beatenTeams[0]
          : beatenTeams.slice(0, -1).join(', ') + ' and ' + beatenTeams[beatenTeams.length - 1];
      detailParts.push(`${winnerAbbrev} Beat ${beatenStr}`);
    }
  }

  const detail = detailParts.length > 0 ? detailParts.join(', ') : 'No head-to-head games played';

  return { winners, detail };
};
