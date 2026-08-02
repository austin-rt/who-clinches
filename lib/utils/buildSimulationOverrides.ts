import type { GameLean } from '@/lib/types';
import type { GamePick } from '@/app/store/gamePicksSlice';
import { getDefaultPick } from './getDefaultPick';

const hasNoWinner = (pick: { homeScore: number; awayScore: number }): boolean =>
  pick.homeScore === pick.awayScore;

export const buildSimulationOverrides = (
  games: GameLean[],
  picks: Record<string, GamePick>
): Record<string, { homeScore: number; awayScore: number }> => {
  const gamesById = new Map(games.map((game) => [game.id, game]));
  const overrides: Record<string, { homeScore: number; awayScore: number }> = {};

  Object.entries(picks).forEach(([gameId, pick]) => {
    if (!hasNoWinner(pick)) {
      overrides[gameId] = { homeScore: pick.homeScore, awayScore: pick.awayScore };
      return;
    }

    const game = gamesById.get(gameId);
    if (!game) return;

    const fallback = getDefaultPick(game);
    if (!hasNoWinner(fallback)) {
      overrides[gameId] = fallback;
    }
  });

  return overrides;
};
