import type { Game } from 'cfbd';

export const LIVE_GAMES_TTL_SECONDS = 30;
export const IMMINENT_GAMES_TTL_SECONDS = 300;
export const PENDING_GAMES_TTL_SECONDS = 6 * 60 * 60;
export const LIVE_WINDOW_MS = 6 * 60 * 60 * 1000;
export const IMMINENT_WINDOW_MS = 3 * 60 * 60 * 1000;

export type GamesCacheVerdict =
  | { kind: 'persist' }
  | { kind: 'expire'; ttlSeconds: number }
  | { kind: 'default' };

const startedAt = (game: Pick<Game, 'startDate'>): number => new Date(game.startDate).getTime();

export const getGamesCacheVerdict = (
  games: Array<Pick<Game, 'completed' | 'startDate'>>,
  now: number = Date.now()
): GamesCacheVerdict => {
  if (games.length === 0) return { kind: 'default' };

  if (games.every((game) => game.completed)) return { kind: 'persist' };

  const pending = games.filter((game) => !game.completed);

  const hasLive = pending.some((game) => {
    const start = startedAt(game);
    return Number.isFinite(start) && start <= now && now - start <= LIVE_WINDOW_MS;
  });
  if (hasLive) return { kind: 'expire', ttlSeconds: LIVE_GAMES_TTL_SECONDS };

  const hasImminent = pending.some((game) => {
    const start = startedAt(game);
    return Number.isFinite(start) && start > now && start - now <= IMMINENT_WINDOW_MS;
  });
  if (hasImminent) return { kind: 'expire', ttlSeconds: IMMINENT_GAMES_TTL_SECONDS };

  return { kind: 'expire', ttlSeconds: PENDING_GAMES_TTL_SECONDS };
};
