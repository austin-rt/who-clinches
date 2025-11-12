/**
 * Prefill calculation helpers for predicted game scores
 */

import { ReshapedGame } from './types';

// Minimal team interface for predictedScore calculation
interface TeamForPrediction {
  record?: {
    stats?: {
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
}

const DEFAULT_AVG = 28; // Fallback average if no team data
const HOME_FIELD_BONUS = 3; // Points added for home team advantage

/**
 * Calculate predicted score for a game
 * Uses real scores if available, otherwise calculates from spread + team averages
 */
export const calculatePredictedScore = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): { home: number; away: number } => {
  // If game is completed, always use real scores
  if (game.completed) {
    return {
      home: game.home.score ?? 0,
      away: game.away.score ?? 0,
    };
  }

  // If game is in progress AND someone has scored, use real scores
  if (game.state === 'in' && ((game.home.score ?? 0) > 0 || (game.away.score ?? 0) > 0)) {
    return {
      home: game.home.score ?? 0,
      away: game.away.score ?? 0,
    };
  }

  // Otherwise (pre-game or in-progress 0-0), calculate from spread + averages

  // Get ESPN season averages (updated weekly by rankings cron)
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  // Priority 1: Use spread if available
  if (game.odds.spread !== null && game.odds.favoriteTeamEspnId) {
    const isFavoriteHome = game.odds.favoriteTeamEspnId === game.home.teamEspnId;
    const favoriteAvg = isFavoriteHome ? homeAvg : awayAvg;

    // Favorite score = their average (rounded)
    const favoriteScore = Math.round(favoriteAvg);

    // Underdog score = favorite - spread (rounded up to avoid ties)
    const underdogScore = Math.ceil(favoriteScore - Math.abs(game.odds.spread));

    if (isFavoriteHome) {
      return { home: favoriteScore, away: underdogScore };
    } else {
      return { home: underdogScore, away: favoriteScore };
    }
  }

  // Priority 2: Use team averages + home field advantage
  const homeScore = Math.round(homeAvg + HOME_FIELD_BONUS);
  const awayScore = Math.round(awayAvg);

  // Ensure no ties (add 1 to home if tied)
  if (homeScore === awayScore) {
    return { home: homeScore + 1, away: awayScore };
  }

  return { home: homeScore, away: awayScore };
};
