import { ReshapedGame, PredictedScore } from '../../types';

interface TeamForPrediction {
  record?: {
    stats?: {
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
}

export const DEFAULT_AVG = 28;

export const calculatePredictedScoreFromOdds = (
  overUnder: number | null,
  spread: number | null,
  favoriteTeamId: string | null,
  homeTeamId: string
): PredictedScore | undefined => {
  if (overUnder === null || spread === null || favoriteTeamId === null) {
    return undefined;
  }

  const isFavoriteHome = favoriteTeamId === homeTeamId;

  const spreadAbs = Math.abs(spread);

  let favoredScore = Math.round((overUnder + spreadAbs) / 2);
  let underdogScore = Math.round((overUnder - spreadAbs) / 2);

  const total = favoredScore + underdogScore;
  const expectedTotal = Math.round(overUnder);
  const diff = expectedTotal - total;

  if (diff !== 0) {
    if (diff > 0) {
      const baseAdd = Math.floor(diff / 2);
      const remainder = diff % 2;
      favoredScore += baseAdd + remainder;
      underdogScore += baseAdd;
    } else {
      const baseSub = Math.floor(Math.abs(diff) / 2);
      const remainder = Math.abs(diff) % 2;
      favoredScore -= baseSub;
      underdogScore -= baseSub + remainder;
    }
  }

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

export const calculatePredictedScoreFromTeamAverages = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): PredictedScore | undefined => {
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  if (game.odds.spread !== null && game.odds.favoriteTeamId) {
    const isFavoriteHome = game.odds.favoriteTeamId === game.home.teamId;
    const favoriteAvg = isFavoriteHome ? homeAvg : awayAvg;

    const favoriteScore = Math.round(favoriteAvg);

    const underdogScore = Math.ceil(favoriteScore - Math.abs(game.odds.spread));

    if (isFavoriteHome) {
      return { home: favoriteScore, away: underdogScore };
    } else {
      return { home: underdogScore, away: favoriteScore };
    }
  }

  return undefined;
};

export const calculatePredictedScoreFromRanking = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): PredictedScore | undefined => {
  if (
    game.odds.favoriteTeamId !== null ||
    game.odds.spread !== null ||
    game.odds.overUnder !== null
  ) {
    return undefined;
  }

  const homeRank = game.home.rank;
  const awayRank = game.away.rank;

  if (homeRank === null && awayRank === null) {
    return undefined;
  }

  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  if (homeRank === null && awayRank !== null) {
    const awayScore = Math.round(awayAvg);
    const homeScore = Math.round(awayScore - 17);
    if (homeScore === awayScore) {
      return { home: homeScore, away: awayScore + 1 };
    }
    return { home: homeScore, away: awayScore };
  }

  if (awayRank === null && homeRank !== null) {
    const homeScore = Math.round(homeAvg);
    const awayScore = Math.round(homeScore - 17);
    if (homeScore === awayScore) {
      return { home: homeScore + 1, away: awayScore };
    }
    return { home: homeScore, away: awayScore };
  }

  if (homeRank !== null && awayRank !== null) {
    if (homeRank < awayRank) {
      const homeScore = Math.round(homeAvg);
      const rankDiff = awayRank - homeRank;
      const awayScore = Math.round(homeScore - rankDiff);
      if (homeScore === awayScore) {
        return { home: homeScore + 1, away: awayScore };
      }
      return { home: homeScore, away: awayScore };
    } else {
      const awayScore = Math.round(awayAvg);
      const rankDiff = homeRank - awayRank;
      const homeScore = Math.round(awayScore - rankDiff);
      if (homeScore === awayScore) {
        return { home: homeScore, away: awayScore + 1 };
      }
      return { home: homeScore, away: awayScore };
    }
  }

  return undefined;
};

export const getDefaultPredictedScore = (): PredictedScore => {
  const homeScore = Math.round(DEFAULT_AVG);
  const awayScore = Math.round(DEFAULT_AVG - 3);

  if (homeScore === awayScore) {
    return { home: homeScore + 1, away: awayScore };
  }

  return { home: homeScore, away: awayScore };
};

export const calculatePredictedScoreFromHomeFieldAdvantage = (
  homeTeam: TeamForPrediction
): PredictedScore => {
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? DEFAULT_AVG;

  const homeScore = Math.round(homeAvg);
  const awayScore = Math.round(homeAvg - 3);

  if (homeScore === awayScore) {
    return { home: homeScore + 1, away: awayScore };
  }

  return { home: homeScore, away: awayScore };
};

export const calculatePredictedScore = (
  game: ReshapedGame,
  homeTeam: TeamForPrediction,
  awayTeam: TeamForPrediction
): PredictedScore => {
  if (game.completed) {
    return {
      home: game.home.score ?? 0,
      away: game.away.score ?? 0,
    };
  }

  if (game.state === 'in' && ((game.home.score ?? 0) > 0 || (game.away.score ?? 0) > 0)) {
    return {
      home: game.home.score ?? 0,
      away: game.away.score ?? 0,
    };
  }

  const oddsScore = calculatePredictedScoreFromOdds(
    game.odds.overUnder,
    game.odds.spread,
    game.odds.favoriteTeamId,
    game.home.teamId
  );
  if (oddsScore) {
    return oddsScore;
  }

  const averagesScore = calculatePredictedScoreFromTeamAverages(game, homeTeam, awayTeam);
  if (averagesScore) {
    return averagesScore;
  }

  const rankingScore = calculatePredictedScoreFromRanking(game, homeTeam, awayTeam);
  if (rankingScore) {
    return rankingScore;
  }

  return calculatePredictedScoreFromHomeFieldAdvantage(homeTeam);
};
