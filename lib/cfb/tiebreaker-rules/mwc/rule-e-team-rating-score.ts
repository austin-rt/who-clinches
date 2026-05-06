import { GameLean, TeamLean } from '../../../types';
import { calculateTeamRatingScore } from '../common/team-rating-score';
import { EPSILON_CONSTANT } from '../common/core-helpers';

export const applyRuleETeamRatingScore = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams?: string[],
  teams?: TeamLean[],
  useCfpFirst?: boolean
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  if (!teams) {
    return { winners: tiedTeams, detail: 'Teams data required for Team Rating Score' };
  }

  const ratings = tiedTeams.map((teamId) => ({
    teamId,
    rating: calculateTeamRatingScore(teamId, teams, tiedTeams, useCfpFirst ?? false),
  }));

  ratings.sort((a, b) => b.rating - a.rating);

  if (tiedTeams.length >= 3) {
    const topTwo = ratings.slice(0, 2);
    const topTwoRating = topTwo[0].rating;
    const secondRating = topTwo[1].rating;

    if (Math.abs(topTwoRating - secondRating) < EPSILON_CONSTANT) {
      const winners = ratings
        .filter((r) => Math.abs(r.rating - topTwoRating) < EPSILON_CONSTANT)
        .map((r) => r.teamId);
      return {
        winners,
        detail: `Top teams by Team Rating Score: ${topTwoRating.toFixed(4)}`,
      };
    }

    return {
      winners: topTwo.map((r) => r.teamId),
      detail: `Top 2 by Team Rating Score: ${topTwoRating.toFixed(4)}, ${secondRating.toFixed(4)}`,
    };
  }

  const maxRating = Math.max(...ratings.map((r) => r.rating));
  const winners = ratings
    .filter((r) => Math.abs(r.rating - maxRating) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const detail = `Best Team Rating Score: ${maxRating.toFixed(4)}`;

  return { winners, detail };
};
