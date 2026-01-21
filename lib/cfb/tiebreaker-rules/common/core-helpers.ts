import { GameLean } from '../../../types';
import { logError } from '../../../errorLogger';

const EPSILON = 0.0001;

export const EPSILON_CONSTANT = EPSILON;

export const filterRegularSeasonGames = (games: GameLean[]): GameLean[] => {
  return games.filter((g) => {
    if (!g.gameType) return false;
    // Filter by abbreviation - 'reg' and 'spring_reg' are regular season
    const abbrev = g.gameType.abbreviation;
    if (abbrev === 'post' || abbrev === 'spring_post') return false;
    if (abbrev !== 'reg' && abbrev !== 'spring_reg') return false;
    if (g.notes?.toLowerCase().includes('championship')) return false;
    return true;
  });
};

export const applyOverrides = (
  games: GameLean[],
  overrides: { [gameId: string]: { homeScore: number; awayScore: number } }
): GameLean[] => {
  return games.map((game) => {
    const override = overrides[game.id];

    if (override) {
      if (override.homeScore === override.awayScore) {
        const error = new Error(`Tie scores not allowed for game ${game.id}`);
        void logError(
          error,
          {
            action: 'apply-overrides',
            gameId: game.id,
            homeScore: override.homeScore,
            awayScore: override.awayScore,
          },
          false
        );
        throw error;
      }
      if (override.homeScore < 0 || override.awayScore < 0) {
        const error = new Error('Scores cannot be negative');
        void logError(
          error,
          {
            action: 'apply-overrides',
            gameId: game.id,
            homeScore: override.homeScore,
            awayScore: override.awayScore,
          },
          false
        );
        throw error;
      }
      if (!Number.isInteger(override.homeScore) || !Number.isInteger(override.awayScore)) {
        const error = new Error('Scores must be whole numbers');
        void logError(
          error,
          {
            action: 'apply-overrides',
            gameId: game.id,
            homeScore: override.homeScore,
            awayScore: override.awayScore,
          },
          false
        );
        throw error;
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

    const error = new Error(
      `Game ${game.id} has no scores and no predictedScore. All games must have scores for tiebreaker calculations.`
    );
    void logError(
      error,
      {
        action: 'apply-overrides',
        gameId: game.id,
      },
      false
    );
    throw error;
  });
};

export const getTeamAbbrev = (teamId: string, games: GameLean[]): string => {
  const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
  return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
};

export const getTeamRecord = (
  teamId: string,
  games: GameLean[]
): { wins: number; losses: number; winPct: number } => {
  const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);

  let wins = 0;
  let losses = 0;

  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const isHome = game.home.teamId === teamId;
    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    if (teamScore > oppScore) wins++;
    else losses++;
  }

  const winPct = wins + losses === 0 ? 0 : wins / (wins + losses);
  return { wins, losses, winPct };
};
