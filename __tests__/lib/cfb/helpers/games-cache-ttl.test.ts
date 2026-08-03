import {
  getGamesCacheVerdict,
  LIVE_GAMES_TTL_SECONDS,
  IMMINENT_GAMES_TTL_SECONDS,
  LIVE_WINDOW_MS,
  IMMINENT_WINDOW_MS,
} from '@/lib/cfb/helpers/games-cache-ttl';

const NOW = new Date('2025-10-11T20:00:00Z').getTime();
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

describe('getGamesCacheVerdict', () => {
  it('caches a fully completed slate permanently', () => {
    const games = [
      { completed: true, startDate: at(-7 * 24 * 60 * 60 * 1000) },
      { completed: true, startDate: at(-3 * 60 * 60 * 1000) },
    ];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({ kind: 'persist' });
  });

  it('caches for seconds while a game is in progress', () => {
    const games = [
      { completed: true, startDate: at(-7 * 24 * 60 * 60 * 1000) },
      { completed: false, startDate: at(-60 * 60 * 1000) },
    ];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({
      kind: 'expire',
      ttlSeconds: LIVE_GAMES_TTL_SECONDS,
    });
  });

  it('caches briefly when kickoff is imminent', () => {
    const games = [{ completed: false, startDate: at(60 * 60 * 1000) }];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({
      kind: 'expire',
      ttlSeconds: IMMINENT_GAMES_TTL_SECONDS,
    });
  });

  it('does not treat a long-past unfinished game as live', () => {
    const games = [{ completed: false, startDate: at(-(LIVE_WINDOW_MS + 60 * 60 * 1000)) }];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({ kind: 'default' });
  });

  it('does not treat a distant kickoff as imminent', () => {
    const games = [{ completed: false, startDate: at(IMMINENT_WINDOW_MS + 60 * 60 * 1000) }];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({ kind: 'default' });
  });

  it('prefers the live window over the imminent window', () => {
    const games = [
      { completed: false, startDate: at(-30 * 60 * 1000) },
      { completed: false, startDate: at(60 * 60 * 1000) },
    ];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({
      kind: 'expire',
      ttlSeconds: LIVE_GAMES_TTL_SECONDS,
    });
  });

  it('leaves an empty slate on the default season ttl', () => {
    expect(getGamesCacheVerdict([], NOW)).toEqual({ kind: 'default' });
  });

  it('ignores an unparseable start date rather than treating it as live', () => {
    const games = [{ completed: false, startDate: 'not-a-date' }];

    expect(getGamesCacheVerdict(games, NOW)).toEqual({ kind: 'default' });
  });
});
