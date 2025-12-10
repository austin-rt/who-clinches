import { applyRuleDivisionalWinPercentage } from '@/lib/cfb/tiebreaker-rules/common/rule-divisional-win-percentage';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Divisional Win Percentage', () => {
  it('Team A has better divisional record (2-0) than Team B (1-1), Team A advances', () => {
    // East Division teams: A, B (tied), C, D
    // Team A: 2-0 in divisional games
    // Team B: 1-1 in divisional games
    const games = [
      // Divisional games (East vs East)
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'APP', division: 'East' },
        away: { teamId: 'C', score: 24, abbrev: 'GSU', division: 'East' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'APP', division: 'East' },
        away: { teamId: 'D', score: 21, abbrev: 'JMU', division: 'East' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 28, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'C', score: 24, abbrev: 'GSU', division: 'East' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'D', score: 24, abbrev: 'JMU', division: 'East' },
        away: { teamId: 'B', score: 17, abbrev: 'CCU', division: 'East' },
      }),
      // Non-divisional games (should be ignored)
      createGameLean({
        gameId: '5',
        home: { teamId: 'A', score: 42, abbrev: 'APP', division: 'East' },
        away: { teamId: 'W', score: 14, abbrev: 'TROY', division: 'West' },
      }),
      createGameLean({
        gameId: '6',
        home: { teamId: 'B', score: 35, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'W', score: 10, abbrev: 'TROY', division: 'West' },
      }),
    ];

    const result = applyRuleDivisionalWinPercentage(['A', 'B'], games);

    expect(result.winners).toEqual(['A']);
    expect(result.winners).not.toContain('B');
  });

  it('Team A and Team B have same divisional record (1-1), both remain tied', () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'APP', division: 'East' },
        away: { teamId: 'C', score: 24, abbrev: 'GSU', division: 'East' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'D', score: 24, abbrev: 'JMU', division: 'East' },
        away: { teamId: 'A', score: 17, abbrev: 'APP', division: 'East' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 28, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'C', score: 24, abbrev: 'GSU', division: 'East' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'D', score: 24, abbrev: 'JMU', division: 'East' },
        away: { teamId: 'B', score: 17, abbrev: 'CCU', division: 'East' },
      }),
    ];

    const result = applyRuleDivisionalWinPercentage(['A', 'B'], games);

    expect(result.winners).toContain('A');
    expect(result.winners).toContain('B');
    expect(result.winners.length).toBe(2);
  });
});
