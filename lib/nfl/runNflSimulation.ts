import type { Game } from '../types';
import type { NflSimulateResponse } from './types';
import { calculatePlayoffPicture } from './tiebreaker-rules/core/calculatePlayoffPicture';

export interface NflOverride {
  homeScore: number;
  awayScore: number;
}

export const applyNflOverrides = (games: Game[], overrides: Record<string, NflOverride>): Game[] =>
  games.map((game) => {
    const override = overrides[game.id];
    if (override) {
      return {
        ...game,
        home: { ...game.home, score: override.homeScore },
        away: { ...game.away, score: override.awayScore },
        completed: true,
        state: 'post' as const,
      };
    }

    if (game.home.score !== null && game.away.score !== null) {
      return game;
    }

    if (game.predictedScore) {
      return {
        ...game,
        home: { ...game.home, score: game.predictedScore.home },
        away: { ...game.away, score: game.predictedScore.away },
        completed: true,
        state: 'post' as const,
      };
    }

    throw new Error(`Game ${game.id} has no scores, no overrides, and no predictedScore`);
  });

export const runNflSimulation = (
  games: Game[],
  season: number,
  overrides: Record<string, NflOverride> = {}
): NflSimulateResponse => {
  const resolvedGames = applyNflOverrides(games, overrides);
  const { bracket, divisionStandings, tieLogs } = calculatePlayoffPicture(resolvedGames, season);
  return { bracket, divisionStandings, tieLogs };
};
