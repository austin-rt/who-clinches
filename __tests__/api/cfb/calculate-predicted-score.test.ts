import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { GameState, ReshapedGame } from '@/lib/types';

interface TeamForPrediction {
  record?: {
    stats?: {
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
}

const createReshapedGame = (
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
    shortDisplayName: 'Alabama',
    alternateColor: '000000',
  },
  away: {
    teamEspnId: '2335',
    abbrev: 'LSU',
    displayName: 'LSU',
    score: awayScore,
    rank: null,
    logo: '',
    color: '4d1d4d',
    shortDisplayName: 'LSU',
    alternateColor: '000000',
  },
  predictedScore,
  odds: {
    spread,
    overUnder: null,
    favoriteTeamEspnId,
  },
});

const createTeamForPrediction = (
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
      const game = createReshapedGame('post', 31, 24);
      const homeTeam = createTeamForPrediction();
      const awayTeam = createTeamForPrediction();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(31);
      expect(result.away).toBe(24);
    });
  });

  describe('In-Progress Games', () => {
    it('uses real scores if game is in progress with scoring', () => {
      const game = createReshapedGame('in', 14, 10);
      const homeTeam = createTeamForPrediction();
      const awayTeam = createTeamForPrediction();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(14);
      expect(result.away).toBe(10);
    });

    it('uses prediction for in-progress game at 0-0', () => {
      const game = createReshapedGame('in', 0, 0);
      const homeTeam = createTeamForPrediction();
      const awayTeam = createTeamForPrediction();

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(28);
      expect(result.away).toBe(25);
    });
  });

  describe('Pre-Game Calculations - With Spread', () => {
    it('calculates score from spread when favorite is home', () => {
      const game = createReshapedGame('pre', null, null, -7, '25');
      const homeTeam = createTeamForPrediction(28);
      const awayTeam = createTeamForPrediction(24);

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(28);
      expect(result.away).toBe(21);
    });

    it('calculates score from spread when favorite is away', () => {
      const game = createReshapedGame('pre', null, null, 7, '2335');
      const homeTeam = createTeamForPrediction(28);
      const awayTeam = createTeamForPrediction(28);

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

      expect(result.home).toBe(21);
      expect(result.away).toBe(28);
    });
  });

  describe('Pre-Game Calculations - Without Spread', () => {
    it('uses team averages + home field bonus when no spread', () => {
      const game = createReshapedGame('pre', null, null, null);
      const homeTeam = createTeamForPrediction(28);
      const awayTeam = createTeamForPrediction(24);

      const result = calculatePredictedScore(game, homeTeam, awayTeam);

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
        const game = createReshapedGame('pre', null, null, spread);
        const homeTeam = createTeamForPrediction(homeAvg);
        const awayTeam = createTeamForPrediction(awayAvg);

        const result = calculatePredictedScore(game, homeTeam, awayTeam);

        expect(result.home).not.toBe(result.away);
      });
    });
  });
});
