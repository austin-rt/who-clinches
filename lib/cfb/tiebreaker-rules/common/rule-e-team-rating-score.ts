import { GameLean } from '../../../types';
import { calculateTeamRatingScore } from './team-rating-score';
import { EPSILON_CONSTANT } from './core-helpers';

export const applyRuleETeamRatingScore = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const ratings = tiedTeams.map((teamId) => ({
    teamId,
    rating: calculateTeamRatingScore(teamId, games, allTeams, tiedTeams),
  }));

  const maxRating = Math.max(...ratings.map((r) => r.rating));
  const winners = ratings
    .filter((r) => Math.abs(r.rating - maxRating) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const detail = `Best Team Rating Score: ${maxRating.toFixed(4)}`;

  return { winners, detail };
};

