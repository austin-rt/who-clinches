import { GameLean } from '../../../types';
import { getTeamAbbrev } from './core-helpers';

/**
 * Total Wins Rule
 * Counts total wins in a season with the following conditions:
 * - Only one win against FCS/lower division counted annually
 * - Games exempted per NCAA 17.10.5.2.1 not included
 *
 * Note: Currently counts all wins. FCS/exempt filtering will be added
 * when classification data is available in GameLean.
 */
export const applyRuleTotalWins = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const winCounts = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) =>
        g.completed &&
        (g.home.teamId === teamId || g.away.teamId === teamId) &&
        g.home.score !== null &&
        g.away.score !== null
    );

    let wins = 0;

    for (const game of teamGames) {
      const isHome = game.home.teamId === teamId;
      const teamScore = isHome ? game.home.score! : game.away.score!;
      const oppScore = isHome ? game.away.score! : game.home.score!;

      if (teamScore > oppScore) {
        wins++;
      }
    }

    const totalWins = wins;

    return { teamId, totalWins };
  });

  const maxWins = Math.max(...winCounts.map((r) => r.totalWins));
  const winners = winCounts
    .filter((r) => r.totalWins === maxWins)
    .map((r) => r.teamId);

  const abbrevs = winners.map((tid) => getTeamAbbrev(tid, games));
  const detail = `${maxWins} wins${winners.length > 1 ? ` (${abbrevs.join(', ')})` : ''}`;

  return { winners, detail };
};

