import type { Game } from '../../../types';
import type { NflRuleResult } from '../types';
import { getTeamRecord, getTeamAbbrev, getOpponents, EPSILON } from '../helpers';

export const applySOS = (tiedTeams: string[], games: Game[], allGames: Game[]): NflRuleResult => {
  const teamSoss = tiedTeams.map((teamId) => {
    const opponents = [...new Set(getOpponents(teamId, allGames))];

    if (opponents.length === 0) {
      return { teamId, sos: 0 };
    }

    let combinedWins = 0;
    let combinedTotal = 0;

    for (const oppId of opponents) {
      const record = getTeamRecord(oppId, allGames);
      const total = record.wins + record.losses + record.ties;
      combinedWins += record.wins + 0.5 * record.ties;
      combinedTotal += total;
    }

    const sos = combinedTotal === 0 ? 0 : combinedWins / combinedTotal;
    return { teamId, sos };
  });

  const maxSos = Math.max(...teamSoss.map((t) => t.sos));
  const winners = teamSoss.filter((t) => Math.abs(t.sos - maxSos) < EPSILON).map((t) => t.teamId);

  const detailParts = teamSoss
    .sort((a, b) => b.sos - a.sos)
    .map((t) => `${getTeamAbbrev(t.teamId, allGames)} .${t.sos.toFixed(3).slice(2)}`);

  return {
    winners,
    detail: `${detailParts.join(', ')} SOS`,
  };
};
