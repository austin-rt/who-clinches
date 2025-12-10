import { GameLean } from '../../../types';
import { getTeamAbbrev, getTeamRecord, EPSILON_CONSTANT } from './core-helpers';

export const applyRuleDivisionalWinPercentage = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const divisionalGames = games.filter((g) => {
    if (!g.conferenceGame) return false;
    const homeDiv = g.home.division;
    const awayDiv = g.away.division;
    return homeDiv && awayDiv && homeDiv === awayDiv;
  });

  const winPercentages = tiedTeams.map((teamId) => {
    const teamDivisionalGames = divisionalGames.filter(
      (g) =>
        g.completed &&
        (g.home.teamId === teamId || g.away.teamId === teamId) &&
        g.home.score !== null &&
        g.away.score !== null
    );

    const record = getTeamRecord(teamId, teamDivisionalGames);
    return { teamId, winPct: record.winPct };
  });

  const maxWinPct = Math.max(...winPercentages.map((r) => r.winPct));
  const winners = winPercentages
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const abbrevs = winners.map((tid) => getTeamAbbrev(tid, games));
  const detail = `Divisional: ${(maxWinPct * 100).toFixed(1)}%${winners.length > 1 ? ` (${abbrevs.join(', ')})` : ''}`;

  return { winners, detail };
};
