import { GameLean } from '@/lib/types';
import { GamePick } from '@/app/store/gamePicksSlice';

export const getDefaultSelectedTeam = (game: GameLean): string => {
  if (game.completed) {
    const homeScore = game.home.score ?? 0;
    const awayScore = game.away.score ?? 0;
    if (homeScore > awayScore) return game.home.teamId;
    if (awayScore > homeScore) return game.away.teamId;
  }
  if (game.predictedScore) {
    if (game.predictedScore.home > game.predictedScore.away) return game.home.teamId;
    if (game.predictedScore.away > game.predictedScore.home) return game.away.teamId;
  }
  if (game.odds.favoriteTeamId) return game.odds.favoriteTeamId;
  return game.home.teamId;
};

export const calculateDefaultScores = (game: GameLean, pickedTeamId: string): GamePick => {
  const isPickingHome = pickedTeamId === game.home.teamId;

  if (game.completed) {
    const actualHomeScore = game.home.score ?? 0;
    const actualAwayScore = game.away.score ?? 0;
    if (isPickingHome) {
      return {
        homeScore: actualAwayScore >= actualHomeScore ? actualAwayScore + 1 : actualHomeScore,
        awayScore: actualAwayScore,
      };
    }
    return {
      homeScore: actualHomeScore,
      awayScore: actualHomeScore >= actualAwayScore ? actualHomeScore + 1 : actualAwayScore,
    };
  }

  if (!game.predictedScore) {
    return { homeScore: 28, awayScore: 21 };
  }

  const baseHomeScore = game.predictedScore.home;
  const baseAwayScore = game.predictedScore.away;

  if (isPickingHome) {
    return {
      homeScore: baseAwayScore >= baseHomeScore ? baseAwayScore + 1 : baseHomeScore,
      awayScore: baseAwayScore,
    };
  }
  return {
    homeScore: baseHomeScore,
    awayScore: baseHomeScore >= baseAwayScore ? baseHomeScore + 1 : baseAwayScore,
  };
};

export const getDefaultPick = (game: GameLean): GamePick => {
  const defaultTeam = getDefaultSelectedTeam(game);
  return calculateDefaultScores(game, defaultTeam);
};

export const isPickAtDefault = (game: GameLean, pick: GamePick | undefined): boolean => {
  if (!pick) return true;
  const defaultPick = getDefaultPick(game);
  return pick.homeScore === defaultPick.homeScore && pick.awayScore === defaultPick.awayScore;
};
