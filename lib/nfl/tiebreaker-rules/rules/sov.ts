import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import { getTeamRecord, getTeamAbbrev, EPSILON } from '../helpers';

export const applySOV = (tiedTeams: string[], games: Game[], allGames: Game[]): NflRuleResult => {
  const teamSovs = tiedTeams.map((teamId) => {
    const beatenOpponents: string[] = [];

    for (const g of allGames) {
      if (g.home.score === null || g.away.score === null) continue;
      if (g.home.teamId === teamId && g.home.score > g.away.score) {
        beatenOpponents.push(g.away.teamId);
      } else if (g.away.teamId === teamId && g.away.score > g.home.score) {
        beatenOpponents.push(g.home.teamId);
      }
    }

    if (beatenOpponents.length === 0) {
      return { teamId, sov: 0 };
    }

    const uniqueBeaten = [...new Set(beatenOpponents)];
    let combinedWins = 0;
    let combinedTotal = 0;

    for (const oppId of uniqueBeaten) {
      const record = getTeamRecord(oppId, allGames);
      const total = record.wins + record.losses + record.ties;
      combinedWins += record.wins + 0.5 * record.ties;
      combinedTotal += total;
    }

    const sov = combinedTotal === 0 ? 0 : combinedWins / combinedTotal;
    return { teamId, sov };
  });

  const maxSov = Math.max(...teamSovs.map((t) => t.sov));
  const winners = teamSovs.filter((t) => Math.abs(t.sov - maxSov) < EPSILON).map((t) => t.teamId);

  const detailParts = teamSovs
    .sort((a, b) => b.sov - a.sov)
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} .${t.sov.toFixed(3).slice(2)}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} SOV`,
  };
};
