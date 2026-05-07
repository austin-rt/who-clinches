import { organizeGames } from '@/lib/utils/organizeGames';
import { GameLean } from '@/lib/types';

const makeGame = (overrides: Partial<GameLean> = {}): GameLean =>
  ({
    _id: '1',
    week: 1,
    date: '2025-09-06T17:00:00Z',
    completed: false,
    state: 'pre' as const,
    gameType: { name: 'Regular Season', abbreviation: 'reg' },
    home: {} as GameLean['home'],
    away: {} as GameLean['away'],
    venue: null,
    notes: null,
    odds: null,
    predictedScore: null,
    ...overrides,
  }) as GameLean;

describe('organizeGames', () => {
  it('returns empty arrays for null/undefined input', () => {
    expect(organizeGames(undefined)).toEqual({ finalWeeks: [], remainingWeeks: [] });
    expect(organizeGames(null as unknown as undefined)).toEqual({
      finalWeeks: [],
      remainingWeeks: [],
    });
  });

  it('sorts completed weeks into finalWeeks and mixed into remainingWeeks', () => {
    const games = [
      makeGame({ week: 1, completed: true, date: '2025-09-06T17:00:00Z' }),
      makeGame({ week: 1, completed: true, date: '2025-09-06T20:00:00Z' }),
      makeGame({ week: 2, completed: true, date: '2025-09-13T17:00:00Z' }),
      makeGame({ week: 2, completed: false, date: '2025-09-13T20:00:00Z' }),
    ];
    const result = organizeGames(games);
    expect(result.finalWeeks).toHaveLength(1);
    expect(result.remainingWeeks).toHaveLength(1);
  });

  it('sorts by week number then by date within week', () => {
    const late = makeGame({ week: 2, completed: true, date: '2025-09-13T20:00:00Z' });
    const early = makeGame({ week: 1, completed: true, date: '2025-09-06T17:00:00Z' });
    const result = organizeGames([late, early]);
    expect(result.finalWeeks[0][0].week).toBe(1);
    expect(result.finalWeeks[1][0].week).toBe(2);
  });

  it('treats null week as 0', () => {
    const game = makeGame({ week: null as unknown as number, completed: true });
    const result = organizeGames([game]);
    expect(result.finalWeeks).toHaveLength(1);
  });
});
