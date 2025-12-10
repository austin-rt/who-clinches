import { GameLean } from '../../../types';
import { getTeamAbbrev } from './core-helpers';

/**
 * Overall Win Percentage Rule
 * Calculates overall winning percentage with the following conditions:
 * - Maximum one win against FCS included
 * - Exempt games excluded (when exempt game data is available)
 *
 * Note: Currently calculates from all games. FCS/exempt filtering will be added
 * when classification and exempt game data is available in GameLean.
 */
export const applyRuleOverallWinPercentage = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const winPercentages = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) =>
        g.completed &&
        (g.home.teamId === teamId || g.away.teamId === teamId) &&
        g.home.score !== null &&
        g.away.score !== null
    );

    let wins = 0;
    let losses = 0;

    for (const game of teamGames) {
      const isHome = game.home.teamId === teamId;
      const teamScore = isHome ? game.home.score! : game.away.score!;
      const oppScore = isHome ? game.away.score! : game.home.score!;

      if (teamScore > oppScore) {
        wins++;
      } else if (teamScore < oppScore) {
        losses++;
      }
    }

    const adjustedWins = wins;
    const totalGames = adjustedWins + losses;
    const winPct = totalGames === 0 ? 0 : adjustedWins / totalGames;

    return { teamId, winPct };
  });

  const maxWinPct = Math.max(...winPercentages.map((r) => r.winPct));
  const winners = winPercentages
    .filter((r) => Math.abs(r.winPct - maxWinPct) < 0.0001)
    .map((r) => r.teamId);

  const abbrevs = winners.map((tid) => getTeamAbbrev(tid, games));
  const detail = `${(maxWinPct * 100).toFixed(1)}%${winners.length > 1 ? ` (${abbrevs.join(', ')})` : ''}`;

  return { winners, detail };
};
