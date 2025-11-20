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

/**
 * Calculate predicted score from odds (overUnder + spread) - Priority 1
 */
export const calculatePredictedScoreFromOdds = (
  overUnder: number | null,
  spread: number | null,
  favoriteTeamEspnId: string | null,
  homeTeamEspnId: string
): { home: number; away: number } | undefined => {
  if (overUnder === null || spread === null || favoriteTeamEspnId === null) {
    return undefined;
  }

  const isFavoriteHome = favoriteTeamEspnId === homeTeamEspnId;

  // Use absolute value of spread for calculation (sign only indicates favorite)
  const spreadAbs = Math.abs(spread);

  // Favored team score = overUnder / 2 + spread (rounded)
  const favoredScore = Math.round(overUnder / 2 + spreadAbs);
  // Non-favored team score = overUnder / 2 - spread (rounded)
  const underdogScore = Math.round(overUnder / 2 - spreadAbs);

  // Ensure no ties (add 1 to winner if needed)
  if (favoredScore === underdogScore) {
    if (isFavoriteHome) {
      return { home: favoredScore + 1, away: underdogScore };
    } else {
      return { home: underdogScore, away: favoredScore + 1 };
    }
  }

  if (isFavoriteHome) {
    return { home: favoredScore, away: underdogScore };
  } else {
    return { home: underdogScore, away: favoredScore };
  }
};

/**
 * Calculate predicted score from team averages + spread - Priority 2
 */
export const calculatePredictedScoreFromTeamAverages = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): { home: number; away: number } | undefined => {
  // Get ESPN season averages (updated weekly by rankings cron)
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  // Use spread if available
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

  return undefined;
};

/**
 * Calculate predicted score from team rankings - Priority 3
 * Used when no odds/favorite/spread available
 */
export const calculatePredictedScoreFromRanking = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): { home: number; away: number } | undefined => {
  // Only use this if no favorite/spread/overUnder
  if (
    game.odds.favoriteTeamEspnId !== null ||
    game.odds.spread !== null ||
    game.odds.overUnder !== null
  ) {
    return undefined;
  }

  const homeRank = game.home.rank;
  const awayRank = game.away.rank;

  // Need at least one ranked team
  if (homeRank === null && awayRank === null) {
    return undefined;
  }

  // Determine higher ranked team (lower number = better rank)
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  // If one team is ranked and the other isn't
  if (homeRank === null && awayRank !== null) {
    // Away team is ranked, home is unranked
    const awayScore = Math.round(awayAvg);
    const homeScore = Math.round(awayScore - 17);
    // Ensure no ties
    if (homeScore === awayScore) {
      return { home: homeScore, away: awayScore + 1 };
    }
    return { home: homeScore, away: awayScore };
  }

  if (awayRank === null && homeRank !== null) {
    // Home team is ranked, away is unranked
    const homeScore = Math.round(homeAvg);
    const awayScore = Math.round(homeScore - 17);
    // Ensure no ties
    if (homeScore === awayScore) {
      return { home: homeScore + 1, away: awayScore };
    }
    return { home: homeScore, away: awayScore };
  }

  // Both teams are ranked - compare ranks
  if (homeRank !== null && awayRank !== null) {
    // Lower rank number = better (rank 1 is best)
    if (homeRank < awayRank) {
      // Home team is higher ranked (better)
      const homeScore = Math.round(homeAvg);
      const rankDiff = awayRank - homeRank;
      const awayScore = Math.round(homeScore - rankDiff);
      // Ensure no ties
      if (homeScore === awayScore) {
        return { home: homeScore + 1, away: awayScore };
      }
      return { home: homeScore, away: awayScore };
    } else {
      // Away team is higher ranked (better)
      const awayScore = Math.round(awayAvg);
      const rankDiff = homeRank - awayRank;
      const homeScore = Math.round(awayScore - rankDiff);
      // Ensure no ties
      if (homeScore === awayScore) {
        return { home: homeScore, away: awayScore + 1 };
      }
      return { home: homeScore, away: awayScore };
    }
  }

  return undefined;
};

/**
 * Calculate predicted score from home field advantage - Priority 4
 */
export const calculatePredictedScoreFromHomeFieldAdvantage = (
  homeTeam: TeamForPrediction
): { home: number; away: number } => {
  // Get ESPN season averages
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  // Home = homeAvg, away = homeAvg - 3 (home field advantage)
  const homeScore = Math.round(homeAvg);
  const awayScore = Math.round(homeAvg - 3);

  // Ensure no ties (add 1 to home if tied)
  if (homeScore === awayScore) {
    return { home: homeScore + 1, away: awayScore };
  }

  return { home: homeScore, away: awayScore };
};

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

  // Otherwise (pre-game or in-progress 0-0), calculate from helpers in priority order

  // Priority 1: Try odds-based calculation
  const oddsScore = calculatePredictedScoreFromOdds(
    game.odds.overUnder,
    game.odds.spread,
    game.odds.favoriteTeamEspnId,
    game.home.teamEspnId
  );
  if (oddsScore) {
    return oddsScore;
  }

  // Priority 2: Try team averages + spread
  const averagesScore = calculatePredictedScoreFromTeamAverages(game, homeTeam, awayTeam);
  if (averagesScore) {
    return averagesScore;
  }

  // Priority 3: Try ranking-based calculation (when no odds available)
  const rankingScore = calculatePredictedScoreFromRanking(game, homeTeam, awayTeam);
  if (rankingScore) {
    return rankingScore;
  }

  // Priority 4: Use home field advantage
  return calculatePredictedScoreFromHomeFieldAdvantage(homeTeam);
};
