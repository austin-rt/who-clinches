import { GameLean } from '../../../types';
import { EPSILON_CONSTANT } from '../common/core-helpers';

const OFFENSIVE_PCT_CAP = 200;
const DEFENSIVE_PCT_MIN = 0;

export const getTeamAvgPointsFor = (teamId: string, games: GameLean[]): number => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  if (teamGames.length === 0) return 0;

  let totalPoints = 0;
  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;
    const isHome = game.home.teamEspnId === teamId;
    totalPoints += isHome ? game.home.score : game.away.score;
  }

  return totalPoints / teamGames.length;
};

export const getTeamAvgPointsAgainst = (teamId: string, games: GameLean[]): number => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  if (teamGames.length === 0) return 0;

  let totalPoints = 0;
  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;
    const isHome = game.home.teamEspnId === teamId;
    totalPoints += isHome ? game.away.score : game.home.score;
  }

  return totalPoints / teamGames.length;
};

export const applyRuleESecScoringMargin = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const margins = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );

    let totalMargin = 0;

    for (const game of teamGames) {
      if (game.home.score === null || game.away.score === null) continue;

      const isHome = game.home.teamEspnId === teamId;
      const oppId = isHome ? game.away.teamEspnId : game.home.teamEspnId;

      const teamScore = isHome ? game.home.score : game.away.score;
      const oppScore = isHome ? game.away.score : game.home.score;

      const oppAvgFor = getTeamAvgPointsFor(oppId, games);
      const oppAvgAgainst = getTeamAvgPointsAgainst(oppId, games);

      const offensivePct =
        oppAvgAgainst > 0
          ? Math.min((teamScore / oppAvgAgainst) * 100, OFFENSIVE_PCT_CAP)
          : OFFENSIVE_PCT_CAP;

      const defensivePct =
        oppAvgFor > 0 ? Math.max((oppScore / oppAvgFor) * 100, DEFENSIVE_PCT_MIN) : 0;

      const gameMargin = offensivePct - defensivePct;

      totalMargin += gameMargin;
    }

    const avgMargin = teamGames.length === 0 ? 0 : totalMargin / teamGames.length;

    return { teamId, avgMargin };
  });

  const maxMargin = Math.max(...margins.map((m) => m.avgMargin));
  const winners = margins
    .filter((m) => Math.abs(m.avgMargin - maxMargin) < EPSILON_CONSTANT)
    .map((m) => m.teamId);

  const detail = `Best relative scoring margin: ${maxMargin.toFixed(2)}`;

  return { winners, detail };
};

