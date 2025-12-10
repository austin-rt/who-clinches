import { applyRuleCommonNonDivisionalOpponents } from '@/lib/cfb/tiebreaker-rules/common/rule-common-non-divisional-opponents';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Common Non-Divisional Opponents', () => {
  it('Team A has better record (2-0) vs common non-divisional opponents than Team B (1-1), Team A advances', () => {
    // East Division teams: A, B (tied)
    // West Division teams: W, X (common non-divisional opponents)
    const games = [
      // Non-divisional games (East vs West)
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'APP', division: 'East' },
        away: { teamId: 'W', score: 24, abbrev: 'TROY', division: 'West' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'APP', division: 'East' },
        away: { teamId: 'X', score: 21, abbrev: 'UL', division: 'West' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 28, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'W', score: 24, abbrev: 'TROY', division: 'West' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'X', score: 24, abbrev: 'UL', division: 'West' },
        away: { teamId: 'B', score: 17, abbrev: 'CCU', division: 'East' },
      }),
      // Divisional games (should be ignored for this rule)
      createGameLean({
        gameId: '5',
        home: { teamId: 'A', score: 42, abbrev: 'APP', division: 'East' },
        away: { teamId: 'C', score: 14, abbrev: 'GSU', division: 'East' },
      }),
      createGameLean({
        gameId: '6',
        home: { teamId: 'B', score: 35, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'C', score: 10, abbrev: 'GSU', division: 'East' },
      }),
    ];

    const result = applyRuleCommonNonDivisionalOpponents(['A', 'B'], games);

    expect(result.winners).toEqual(['A']);
    expect(result.winners).not.toContain('B');
  });

  it('Team A and Team B have same record (1-1) vs common non-divisional opponents, both remain tied', () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'APP', division: 'East' },
        away: { teamId: 'W', score: 24, abbrev: 'TROY', division: 'West' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'X', score: 24, abbrev: 'UL', division: 'West' },
        away: { teamId: 'A', score: 17, abbrev: 'APP', division: 'East' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 28, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'W', score: 24, abbrev: 'TROY', division: 'West' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'X', score: 24, abbrev: 'UL', division: 'West' },
        away: { teamId: 'B', score: 17, abbrev: 'CCU', division: 'East' },
      }),
    ];

    const result = applyRuleCommonNonDivisionalOpponents(['A', 'B'], games);

    expect(result.winners).toContain('A');
    expect(result.winners).toContain('B');
    expect(result.winners.length).toBe(2);
  });
});

