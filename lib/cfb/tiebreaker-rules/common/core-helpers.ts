import { GameLean } from '../../../types';

const EPSILON = 0.0001;

export const EPSILON_CONSTANT = EPSILON;

export const applyOverrides = (
  games: GameLean[],
  overrides: { [gameId: string]: { homeScore: number; awayScore: number } }
): GameLean[] => {
  return games.map((game) => {
    const override = overrides[game.espnId];

    if (override) {
      if (override.homeScore === override.awayScore) {
        throw new Error(`Tie scores not allowed for game ${game.espnId}`);
      }
      if (override.homeScore < 0 || override.awayScore < 0) {
        throw new Error('Scores cannot be negative');
      }
      if (!Number.isInteger(override.homeScore) || !Number.isInteger(override.awayScore)) {
        throw new Error('Scores must be whole numbers');
      }

      return {
        ...game,
        home: { ...game.home, score: override.homeScore },
        away: { ...game.away, score: override.awayScore },
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
      };
    }

    throw new Error(
      `Game ${game.espnId} has no scores and no predictedScore. All games must have scores for tiebreaker calculations.`
    );
  });
};

export const getTeamAbbrev = (teamId: string, games: GameLean[]): string => {
  const game = games.find((g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId);
  return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
};

export const getTeamRecord = (
  teamId: string,
  games: GameLean[]
): { wins: number; losses: number; winPct: number } => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  let wins = 0;
  let losses = 0;

  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const isHome = game.home.teamEspnId === teamId;
    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    if (teamScore > oppScore) wins++;
    else losses++;
  }

  const winPct = wins + losses === 0 ? 0 : wins / (wins + losses);
  return { wins, losses, winPct };
};

