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
  getTeamAvgPointsFor,
  getTeamAvgPointsAgainst,
  applyOverrides,
  calculateStandings,
} from '@/lib/tiebreaker-helpers';
import { GameLean } from '@/lib/types';

// Helper to create mock game data for testing
const createMockGame = (
  espnId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number | null,
  awayScore: number | null,
  homeAbbrev: string = 'H',
  awayAbbrev: string = 'A'
): GameLean => ({
  _id: espnId,
  espnId,
  displayName: `${awayAbbrev} @ ${homeAbbrev}`,
  season: 2025,
  week: 1,
  sport: 'football',
  league: 'college-football',
  state: homeScore !== null && awayScore !== null ? 'post' : 'pre',
  completed: homeScore !== null && awayScore !== null,
  conferenceGame: true,
  neutralSite: false,
  venue: {
    fullName: 'Test Stadium',
    city: 'Atlanta',
    state: 'GA',
    timezone: 'America/New_York',
  },
  date: '2025-09-06T12:00Z',
  home: {
    teamEspnId: homeTeamId,
    abbrev: homeAbbrev,
    displayName: homeAbbrev,
    score: homeScore,
    rank: null,
    logo: '',
    color: '000000',
  },
  away: {
    teamEspnId: awayTeamId,
    abbrev: awayAbbrev,
    displayName: awayAbbrev,
    score: awayScore,
    rank: null,
    logo: '',
    color: '000000',
  },
  predictedScore: { home: 28, away: 24 },
  odds: {
    spread: null,
    overUnder: null,
    favoriteTeamEspnId: null,
  },
  lastUpdated: new Date('2025-09-06T12:00Z'),
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
});
