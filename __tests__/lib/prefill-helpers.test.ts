/**
 * Unit Tests: Prefill Calculation Helpers
 *
 * Tests for predicted score calculation logic.
 * These tests ensure scores are calculated correctly from spreads,
 * team averages, and game state.
 */

import { calculatePredictedScore } from '@/lib/prefill-helpers';
import { GameState, ReshapedGame } from '@/lib/types';

// Mock team data for testing
interface TeamForPrediction {
  record?: {
    stats?: {
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
}

const createMockGame = (
  state: GameState = 'pre',
  homeScore: number | null = null,
  awayScore: number | null = null,
  spread: number | null = null,
  favoriteTeamEspnId: string | null = null,
  predictedScore: { home: number; away: number } = { home: 28, away: 24 }
): ReshapedGame => ({
  espnId: '123',
  displayName: 'Test Game',
  season: 2025,
  week: 1,
  sport: 'football',
  league: 'college-football',
  state: state,
  completed: state === 'post',
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
    teamEspnId: '25',
    abbrev: 'ALA',
    displayName: 'Alabama',
    score: homeScore,
    rank: null,
    logo: '',
    color: 'ba0c2f',
  },
  away: {
    teamEspnId: '2335',
    abbrev: 'LSU',
    displayName: 'LSU',
    score: awayScore,
    rank: null,
    logo: '',
    color: '4d1d4d',
  },
  predictedScore,
  odds: {
    spread,
    overUnder: null,
    favoriteTeamEspnId,
  },
});

const createMockTeam = (
  avgPointsFor: number = 28,
  avgPointsAgainst: number = 21
): TeamForPrediction => ({
  record: {
    stats: {
      avgPointsFor,
      avgPointsAgainst,
    },
  },
});

describe('calculatePredictedScore', () => {
  describe('Completed Games', () => {
    it('uses real scores for completed games', () => {
      const game = createMockGame('post', 31, 24);
      const homeTeam = createMockTeam();
      const awayTeam = createMockTeam();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(31);
      expect(result.away).toBe(24);
    });
  });

  describe('In-Progress Games', () => {
    it('uses real scores if game is in progress with scoring', () => {
      const game = createMockGame('in', 14, 10);
      const homeTeam = createMockTeam();
      const awayTeam = createMockTeam();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(14);
      expect(result.away).toBe(10);
    });

    it('uses prediction for in-progress game at 0-0', () => {
      const game = createMockGame('in', 0, 0);
      const homeTeam = createMockTeam();
      const awayTeam = createMockTeam();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      // At 0-0, falls through to calculation (not prediction)
      // Home = round(28) = 28, Away = round(28 - 3) = 25
      expect(result.home).toBe(28);
      expect(result.away).toBe(25);
    });
  });

  describe('Pre-Game Calculations - With Spread', () => {
    it('calculates score from spread when favorite is home', () => {
      const game = createMockGame(
        'pre',
        null,
        null,
        -7, // Home favorite by 7
        '25' // Alabama (home) is favorite
      );
      const homeTeam = createMockTeam(28); // Alabama avg 28
      const awayTeam = createMockTeam(24); // LSU avg 24

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      // Home favorite score = 28 (rounded avg)
      // Away underdog score = 28 - 7 = 21
      expect(result.home).toBe(28);
      expect(result.away).toBe(21);
    });

    it('calculates score from spread when favorite is away', () => {
      const game = createMockGame(
        'pre',
        null,
        null,
        7, // Away favorite by 7
        '2335' // LSU (away) is favorite
      );
      const homeTeam = createMockTeam(28); // Alabama
      const awayTeam = createMockTeam(28); // LSU

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      // Away favorite score = 28
      // Home underdog score = 28 - 7 = 21
      expect(result.home).toBe(21);
      expect(result.away).toBe(28);
    });
  });

  describe('Pre-Game Calculations - Without Spread', () => {
    it('uses team averages + home field bonus when no spread', () => {
      const game = createMockGame('pre', null, null, null);
      const homeTeam = createMockTeam(28);
      const awayTeam = createMockTeam(24);

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      // Home = round(28) = 28
      // Away = round(28 - 3) = 25
      expect(result.home).toBe(28);
      expect(result.away).toBe(25);
    });
  });

  describe('Edge Cases', () => {
    it('never produces a tie score', () => {
      const testCases = [
        { homeAvg: 28, awayAvg: 25, spread: null },
        { homeAvg: 27.4, awayAvg: 27.1, spread: null },
        { homeAvg: 25.5, awayAvg: 28.2, spread: null },
      ];

      testCases.forEach(({ homeAvg, awayAvg, spread }) => {
        const game = createMockGame('pre', null, null, spread);
        const homeTeam = createMockTeam(homeAvg);
        const awayTeam = createMockTeam(awayAvg);

        const result = calculatePredictedScore(game, homeTeam, awayTeam);

        expect(result.home).not.toBe(result.away);
      });
    });
  });
});
