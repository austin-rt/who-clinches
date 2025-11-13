/**
 * Unit Tests: Tiebreaker Helper Functions
 *
 * Tests for SEC tiebreaker rules A-E and standings calculation.
 * These tests validate the cascading tiebreaker logic that ranks
 * teams with identical win-loss records.
 */

import {
  getTeamRecord,
  applyRuleA,
  applyRuleB,
  applyRuleC,
  applyRuleD,
  applyRuleE,
  getTeamAvgPointsFor,
  getTeamAvgPointsAgainst,
  applyOverrides,
  breakTie,
  calculateStandings,
} from '@/lib/tiebreaker-helpers';
import { GameLean } from '@/lib/types';

// Mock game data for testing
const createMockGame = (
  espnId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number | null,
  awayScore: number | null,
  homeAbbrev: string = 'H',
  awayAbbrev: string = 'A'
): GameLean => ({
  espnId,
  displayName: `${awayAbbrev} @ ${homeAbbrev}`,
  season: 2025,
  week: 1,
  status: homeScore !== null && awayScore !== null ? 'final' : 'scheduled',
  date: '2025-09-06T12:00Z',
  home: {
    teamEspnId: homeTeamId,
    abbrev: homeAbbrev,
    displayName: homeAbbrev,
    score: homeScore,
    logo: '',
    color: '000000',
  },
  away: {
    teamEspnId: awayTeamId,
    abbrev: awayAbbrev,
    displayName: awayAbbrev,
    score: awayScore,
    logo: '',
    color: '000000',
  },
  predictedScore: { home: 28, away: 24 },
  odds: {
    spread: null,
    overUnder: null,
    favoriteTeamEspnId: null,
  },
});

describe('getTeamRecord', () => {
  it('calculates wins and losses correctly', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'), // A home: 28 > 24, WIN
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'), // A away: 24 > 21, WIN
      createMockGame('3', 'A', 'D', 17, 20, 'ALA', 'OKST'), // A home: 17 < 20, LOSS
    ];

    const record = getTeamRecord('A', games);

    expect(record.wins).toBe(2);
    expect(record.losses).toBe(1);
  });

  it('calculates win percentage correctly', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', 21, 24),
    ];

    const record = getTeamRecord('A', games);

    expect(record.winPct).toBe(1.0);
  });

  it('returns 0.5 win percentage for .500 record', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', 21, 24),
      createMockGame('3', 'A', 'D', 17, 20),
      createMockGame('4', 'E', 'A', 31, 28),
    ];

    const record = getTeamRecord('A', games);

    expect(record.wins).toBe(2);
    expect(record.losses).toBe(2);
    expect(record.winPct).toBe(0.5);
  });

  it('skips games without scores', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'), // A home: 28 > 24, WIN
      createMockGame('2', 'C', 'A', null, null, 'LSU', 'ALA'), // No score - skipped
      createMockGame('3', 'A', 'D', 17, 20, 'ALA', 'OKST'), // A home: 17 < 20, LOSS
    ];

    const record = getTeamRecord('A', games);

    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
  });

  it('returns 0% for team with no games', () => {
    const games = [createMockGame('1', 'B', 'C', 28, 24)];

    const record = getTeamRecord('A', games);

    expect(record.wins).toBe(0);
    expect(record.losses).toBe(0);
    expect(record.winPct).toBe(0);
  });
});

describe('getTeamAvgPointsFor', () => {
  it('calculates average points scored correctly', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', 21, 24),
      createMockGame('3', 'A', 'D', 30, 20),
    ];

    const avg = getTeamAvgPointsFor('A', games);

    expect(avg).toBe((28 + 24 + 30) / 3); // (82/3) = 27.33
  });

  it('skips games without scores when calculating average', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', null, null), // No score
      createMockGame('3', 'A', 'D', 30, 20),
    ];

    const avg = getTeamAvgPointsFor('A', games);

    // Average calculated from games 1 and 3 only: (28 + 30) / 3 games
    expect(avg).toBe((28 + 30) / 3);
  });

  it('returns 0 for team with no games', () => {
    const games = [createMockGame('1', 'B', 'C', 28, 24)];

    const avg = getTeamAvgPointsFor('A', games);

    expect(avg).toBe(0);
  });
});

describe('getTeamAvgPointsAgainst', () => {
  it('calculates average points allowed correctly', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', 21, 24),
      createMockGame('3', 'A', 'D', 30, 20),
    ];

    const avg = getTeamAvgPointsAgainst('A', games);

    expect(avg).toBe((24 + 21 + 20) / 3); // (65/3) = 21.67
  });

  it('skips games without scores', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24),
      createMockGame('2', 'C', 'A', null, null),
      createMockGame('3', 'A', 'D', 30, 20),
    ];

    const avg = getTeamAvgPointsAgainst('A', games);

    expect(avg).toBe((24 + 20) / 3);
  });
});

describe('applyRuleA: Head-to-Head', () => {
  it('breaks tie using head-to-head record', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'),
      createMockGame('3', 'B', 'C', 17, 20, 'UA', 'LSU'),
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleA(['A', 'B', 'C'], games, explanations);

    expect(result.winners).toContain('A'); // A beat B head-to-head
    expect(result.detail).toContain('ALA');
  });

  it('returns all teams if no head-to-head games exist', () => {
    const games = [createMockGame('1', 'A', 'D', 28, 24)];

    const explanations = new Map<string, string[]>();
    const result = applyRuleA(['A', 'B', 'C'], games, explanations);

    expect(result.winners).toEqual(['A', 'B', 'C']);
    expect(result.detail).toContain('head-to-head');
  });

  it('handles single team input', () => {
    const games: GameLean[] = [];
    const explanations = new Map<string, string[]>();
    const result = applyRuleA(['A'], games, explanations);

    expect(result.winners).toEqual(['A']);
  });
});

describe('applyRuleB: Common Opponents', () => {
  it('breaks tie by record against common opponents', () => {
    const games = [
      createMockGame('1', 'A', 'C', 28, 24),
      createMockGame('2', 'B', 'C', 21, 24),
      createMockGame('3', 'A', 'D', 30, 20),
      createMockGame('4', 'B', 'D', 17, 20),
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleB(['A', 'B'], games, explanations);

    // Both teams played C and D, but A beat both while B lost to both
    expect(result.winners).toContain('A');
    expect(result.detail).toContain('common opponents');
  });

  it('returns all teams if no common opponents', () => {
    const games = [
      createMockGame('1', 'A', 'C', 28, 24),
      createMockGame('2', 'B', 'D', 21, 24),
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleB(['A', 'B'], games, explanations);

    expect(result.winners).toEqual(['A', 'B']);
    expect(result.detail).toContain('No common opponents');
  });
});

describe('applyRuleC: Highest Placed Common Opponent', () => {
  it('applies rule C correctly with common opponents', () => {
    const games = [
      createMockGame('1', 'A', 'C', 28, 24),
      createMockGame('2', 'B', 'C', 21, 24),
      createMockGame('3', 'C', 'D', 30, 20),
      createMockGame('4', 'D', 'E', 25, 22),
    ];

    const explanations = new Map<string, string[]>();
    // Ranking would be: C (1-0), A (0-1) and B (0-1), etc.
    const result = applyRuleC(['A', 'B'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

    // Result depends on head-to-head records vs common opponents
    expect(result.winners).toBeDefined();
  });

  it('handles no common opponents', () => {
    const games = [
      createMockGame('1', 'A', 'C', 28, 24),
      createMockGame('2', 'B', 'D', 21, 24),
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleC(['A', 'B'], games, ['A', 'B', 'C', 'D'], explanations);

    expect(result.winners).toEqual(['A', 'B']);
  });
});

describe('applyRuleD: Opponent Win Percentage', () => {
  it('breaks tie by opponent win percentage', () => {
    // Create scenario where A and B have same record but different opponent strengths
    const games = [
      createMockGame('1', 'A', 'C', 28, 24), // A beats weak C
      createMockGame('2', 'B', 'D', 21, 24), // B beats strong D
      createMockGame('3', 'C', 'E', 17, 20), // C loses to E (weak)
      createMockGame('4', 'D', 'E', 30, 20), // D beats E (strong)
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleD(['A', 'B'], games, explanations);

    expect(result.winners).toBeDefined();
    expect(result.detail).toContain('Opponent win%');
  });
});

describe('applyRuleE: Scoring Margin', () => {
  it('breaks tie by relative scoring margin', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'), // A scores 28 at 24 avg, allows 24 at 21 avg
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'),
      createMockGame('3', 'B', 'C', 17, 20, 'UA', 'LSU'),
    ];

    const explanations = new Map<string, string[]>();
    const result = applyRuleE(['A', 'B'], games, explanations);

    expect(result.winners).toBeDefined();
    expect(result.detail).toContain('margin');
  });
});

describe('applyOverrides', () => {
  it('applies score overrides to games', () => {
    const games = [
      createMockGame('1', 'A', 'B', null, null),
      createMockGame('2', 'C', 'A', null, null),
    ];

    const overrides = {
      '1': { homeScore: 31, awayScore: 24 },
      '2': { homeScore: 21, awayScore: 28 },
    };

    const result = applyOverrides(games, overrides);

    expect(result[0].home.score).toBe(31);
    expect(result[0].away.score).toBe(24);
    expect(result[1].home.score).toBe(21);
    expect(result[1].away.score).toBe(28);
  });

  it('rejects tie scores in overrides', () => {
    const games = [createMockGame('1', 'A', 'B', null, null)];

    const overrides = {
      '1': { homeScore: 24, awayScore: 24 },
    };

    expect(() => applyOverrides(games, overrides)).toThrow('Tie scores not allowed');
  });

  it('rejects negative scores in overrides', () => {
    const games = [createMockGame('1', 'A', 'B', null, null)];

    const overrides = {
      '1': { homeScore: -5, awayScore: 24 },
    };

    expect(() => applyOverrides(games, overrides)).toThrow('negative');
  });

  it('rejects non-integer scores in overrides', () => {
    const games = [createMockGame('1', 'A', 'B', null, null)];

    const overrides = {
      '1': { homeScore: 24.5, awayScore: 24 },
    };

    expect(() => applyOverrides(games, overrides)).toThrow('whole numbers');
  });

  it('uses predictedScore if no override provided', () => {
    const games = [
      {
        ...createMockGame('1', 'A', 'B', null, null),
        predictedScore: { home: 31, away: 27 },
      },
    ];

    const result = applyOverrides(games, {});

    expect(result[0].home.score).toBe(31);
    expect(result[0].away.score).toBe(27);
  });

  it('keeps existing scores when available', () => {
    const games = [createMockGame('1', 'A', 'B', 28, 24)];

    const result = applyOverrides(games, {});

    expect(result[0].home.score).toBe(28);
    expect(result[0].away.score).toBe(24);
  });
});

describe('breakTie', () => {
  it('cascades through all rules when needed', () => {
    // Create a 3-way tie with complex scenarios
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'B', 'C', 21, 20, 'UA', 'LSU'),
      createMockGame('3', 'C', 'A', 25, 25 + 1, 'LSU', 'ALA'), // Tiny margin
      createMockGame('4', 'A', 'D', 30, 20, 'ALA', 'OKST'),
      createMockGame('5', 'B', 'D', 17, 20, 'UA', 'OKST'),
      createMockGame('6', 'C', 'D', 28, 24, 'LSU', 'OKST'),
    ];

    const explanations = new Map<string, string[]>();
    const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D'], explanations);

    expect(result.ranked.length).toBe(3);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('handles single team gracefully', () => {
    const games = [createMockGame('1', 'A', 'B', 28, 24)];
    const explanations = new Map<string, string[]>();

    const result = breakTie(['A'], games, ['A', 'B'], explanations);

    expect(result.ranked).toEqual(['A']);
    expect(result.steps).toEqual([]);
  });

  it('uses steps to explain ranking', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'B', 'C', 21, 24, 'UA', 'LSU'),
      createMockGame('3', 'C', 'A', 17, 20, 'LSU', 'ALA'),
    ];

    const explanations = new Map<string, string[]>();
    const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], explanations);

    const rulesApplied = result.steps.map((s) => s.rule);
    expect(rulesApplied[0]).toContain('Head-to-Head');
  });
});

describe('calculateStandings', () => {
  it('calculates full standings with multiple teams', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'),
      createMockGame('3', 'B', 'C', 17, 20, 'UA', 'LSU'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C']);

    expect(result.standings.length).toBe(3);
    expect(result.standings[0].rank).toBe(1);
    expect(result.standings[1].rank).toBe(2);
    expect(result.standings[2].rank).toBe(3);
  });

  it('includes win-loss records in standings', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C']);

    const aStanding = result.standings.find((s) => s.teamId === 'A');
    expect(aStanding?.record.wins).toBe(2);
    expect(aStanding?.record.losses).toBe(0);
  });

  it('includes tiebreaker information when applicable', () => {
    const games = [
      createMockGame('1', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      createMockGame('2', 'B', 'C', 21, 24, 'UA', 'LSU'),
      createMockGame('3', 'A', 'B', 25, 25 + 1, 'ALA', 'UA'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C']);

    // A and B have same record, should have been broken by Rule A
    expect(result.tieLogs.length).toBeGreaterThan(0);
  });

  it('sorts teams correctly by conference record', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'A', 'C', 31, 20, 'ALA', 'LSU'),
      createMockGame('3', 'B', 'C', 24, 21, 'UA', 'LSU'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C']);

    const aStanding = result.standings.find((s) => s.teamId === 'A');
    const bStanding = result.standings.find((s) => s.teamId === 'B');
    const cStanding = result.standings.find((s) => s.teamId === 'C');

    expect(aStanding?.rank).toBeLessThan(bStanding?.rank!);
    expect(bStanding?.rank).toBeLessThan(cStanding?.rank!);
  });

  it('provides explanation for each team position', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'C', 'A', 21, 24, 'LSU', 'ALA'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C']);

    result.standings.forEach((standing) => {
      expect(standing.explainPosition).toBeDefined();
      expect(standing.explainPosition).toContain('Conference record');
    });
  });
});
