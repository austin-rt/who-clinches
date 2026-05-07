import { groupGamesByDay } from '@/lib/utils/gameGrouping';
import { GameLean } from '@/lib/types';

const makeGame = (overrides: Partial<GameLean> = {}): GameLean =>
  ({
    _id: '1',
    week: 1,
    date: '2025-09-06T17:00:00Z', // Saturday
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

describe('groupGamesByDay', () => {
  it('groups games by day-of-week within a week', () => {
    const games = [
      makeGame({ date: '2025-09-06T17:00:00Z' }), // Saturday
      makeGame({ date: '2025-09-04T19:00:00Z' }), // Thursday
      makeGame({ date: '2025-09-06T20:00:00Z' }), // Saturday
    ];
    const result = groupGamesByDay([games]);
    expect(result).toHaveLength(2);
    expect(result[0].dayLabel).toBe('Thursday');
    expect(result[0].games).toHaveLength(1);
    expect(result[1].dayLabel).toBe('Saturday');
    expect(result[1].games).toHaveLength(2);
  });

  it('sorts by week number first, then day-of-week', () => {
    const week2 = [makeGame({ week: 2, date: '2025-09-13T17:00:00Z' })]; // Sat
    const week1 = [makeGame({ week: 1, date: '2025-09-04T19:00:00Z' })]; // Thu
    const result = groupGamesByDay([week2, week1]);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(2);
  });

  it('skips empty week arrays', () => {
    const result = groupGamesByDay([[]]);
    expect(result).toHaveLength(0);
  });
});
