/**
 * Unit Tests: Reshape Games Functions
 *
 * Tests for ESPN scoreboard data transformation into our internal format.
 * Validates game state parsing, score extraction, ranking handling, and odds parsing.
 */

import { reshapeScoreboardData } from '@/lib/reshape-games';
import { ESPNScoreboardResponse, ESPNEvent } from '@/lib/espn-client';

// Helper to create mock ESPN game events
const createMockEvent = (
  id: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: string,
  awayScore: string,
  state: 'pre' | 'in' | 'post' = 'pre',
  homeRank: number | null = null,
  awayRank: number | null = null,
  spread: number | null = null,
  overUnder: number | null = null,
  favoriteTeamId: string | null = null,
  week: number = 1
): ESPNEvent => ({
  id,
  competitions: [
    {
      id: `comp-${id}`,
      date: '2025-09-06T12:00Z',
      conferenceCompetition: true,
      neutralSite: false,
      competitors: [
        {
          homeAway: 'home',
          team: {
            id: homeTeamId,
            abbreviation: homeTeamId === '25' ? 'ALA' : 'TEAM',
            displayName: homeTeamId === '25' ? 'Alabama' : 'Team',
            logo: 'https://example.com/logo.png',
            color: 'ba0c2f',
            conferenceId: '8',
          },
          score: homeScore,
          curatedRank: homeRank ? { current: homeRank } : undefined,
          records: [{ type: 'total', summary: '2-0' }],
        },
        {
          homeAway: 'away',
          team: {
            id: awayTeamId,
            abbreviation: awayTeamId === '2335' ? 'LSU' : 'AWAY',
            displayName: awayTeamId === '2335' ? 'LSU' : 'Away Team',
            logo: 'https://example.com/away-logo.png',
            color: '4d1d4d',
            conferenceId: '8',
          },
          score: awayScore,
          curatedRank: awayRank ? { current: awayRank } : undefined,
          records: [{ type: 'total', summary: '1-1' }],
        },
      ],
      status: {
        type: {
          state,
          completed: state === 'post',
        },
        clock: state === 'in' ? 1800 : undefined,
        period: state === 'in' ? 2 : undefined,
      },
      week: { number: week },
      season: { year: 2025 },
      odds:
        spread !== null || overUnder !== null || favoriteTeamId
          ? [
              {
                details: 'Spread',
                spread: spread ?? 0,
                overUnder: overUnder ?? 0,
                awayTeamOdds: { favorite: favoriteTeamId === awayTeamId },
                homeTeamOdds: { favorite: favoriteTeamId === homeTeamId },
              },
            ]
          : undefined,
      groups: { id: '8' },
    },
  ],
});

const createMockScoreboard = (events: ESPNEvent[]): ESPNScoreboardResponse => ({
  events,
  season: { year: 2025 },
  week: { number: 1 },
  leagues: [],
});

describe('reshapeScoreboardData', () => {
  describe('Basic Game Transformation', () => {
    it('transforms ESPN event to ReshapedGame', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toHaveLength(1);
      expect(result.games![0].espnId).toBe('123');
      expect(result.games![0].displayName).toBe('LSU @ ALA');
    });

    it('includes team information correctly', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.teamEspnId).toBe('25');
      expect(game.home.abbrev).toBe('ALA');
      expect(game.home.displayName).toBe('Alabama');
      expect(game.away.teamEspnId).toBe('2335');
      expect(game.away.abbrev).toBe('LSU');
      expect(game.away.displayName).toBe('LSU');
    });

    it('parses scores correctly', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(28);
      expect(game.away.score).toBe(24);
    });

    it('handles null scores for pre-game', () => {
      const response = createMockScoreboard([createMockEvent('123', '25', '2335', '', '', 'pre')]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBeNull();
      expect(game.away.score).toBeNull();
    });

    it('handles partial scores for in-progress', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '14', '10', 'in'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(14);
      expect(game.away.score).toBe(10);
    });
  });

  describe('Game State Handling', () => {
    it('detects completed games', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(true);
      expect(result.games![0].state).toBe('post');
    });

    it('detects in-progress games', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '14', '10', 'in'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(false);
      expect(result.games![0].state).toBe('in');
    });

    it('detects pre-game', () => {
      const response = createMockScoreboard([createMockEvent('123', '25', '2335', '', '', 'pre')]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(false);
      expect(result.games![0].state).toBe('pre');
    });
  });

  describe('Ranking Handling', () => {
    it('includes valid rankings', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', 5, 12),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBe(5);
      expect(game.away.rank).toBe(12);
    });

    it('treats rank 99 as null (unranked)', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', 99, 99),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBeNull();
      expect(game.away.rank).toBeNull();
    });

    it('handles missing rank', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBeNull();
      expect(game.away.rank).toBeNull();
    });
  });

  describe('Odds Parsing', () => {
    it('extracts spread and over/under', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, -7, 54.5),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(-7);
      expect(game.odds.overUnder).toBe(54.5);
    });

    it('identifies favorite team when away is favorite', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, 7, 54.5, '2335'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.favoriteTeamEspnId).toBe('2335');
    });

    it('identifies favorite team when home is favorite', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, -7, 54.5, '25'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.favoriteTeamEspnId).toBe('25');
    });

    it('handles missing odds', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBeNull();
      expect(game.odds.overUnder).toBeNull();
      expect(game.odds.favoriteTeamEspnId).toBeNull();
    });

    it('handles push spreads (0)', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, 0, 54.5),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(0);
    });

    it('handles fractional spreads', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, -7.5, 54.5),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(-7.5);
    });
  });

  describe('Game Metadata', () => {
    it('includes week number', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post', null, null, null, null, null, 3),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].week).toBe(3);
    });

    it('includes season year', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].season).toBe(2025);
    });

    it('marks conference games', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].conferenceGame).toBe(true);
    });

    it('includes display name format', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].displayName).toBe('LSU @ ALA');
    });

    it('includes team colors', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.color).toBe('ba0c2f');
      expect(game.away.color).toBe('4d1d4d');
    });

    it('includes lastUpdated timestamp', () => {
      const before = new Date();
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);
      const after = new Date();

      const result = reshapeScoreboardData(response);

      expect(result.games![0].lastUpdated).toBeDefined();
      expect(result.games![0].lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.games![0].lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Multiple Games', () => {
    it('reshapes multiple games', () => {
      const response = createMockScoreboard([
        createMockEvent('1', '25', '2335', '28', '24', 'post'),
        createMockEvent('2', '2664', '2693', '21', '17', 'post'),
        createMockEvent('3', '48', '2747', '', '', 'pre'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toHaveLength(3);
      expect(result.games![0].espnId).toBe('1');
      expect(result.games![1].espnId).toBe('2');
      expect(result.games![2].espnId).toBe('3');
    });

    it('handles empty scoreboard', () => {
      const response = createMockScoreboard([]);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('filters out events with missing competition', () => {
      const events = [
        createMockEvent('1', '25', '2335', '28', '24', 'post'),
        {
          id: '999',
          competitions: [], // Missing competition
        } as ESPNEvent,
      ];
      const response = createMockScoreboard(events);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toHaveLength(1);
      expect(result.games![0].espnId).toBe('1');
    });

    it('filters out games with missing competitors', () => {
      const events = [
        createMockEvent('1', '25', '2335', '28', '24', 'post'),
        {
          id: '999',
          competitions: [
            {
              id: 'comp-999',
              competitors: [], // Missing competitors
              conferenceCompetition: false,
              status: { type: { state: 'post', completed: true } },
              date: '2025-09-06T12:00Z',
            },
          ],
        } as ESPNEvent,
      ];
      const response = createMockScoreboard(events);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toHaveLength(1);
    });

    it('filters out games with wrong number of competitors', () => {
      const events = [
        createMockEvent('1', '25', '2335', '28', '24', 'post'),
        {
          id: '999',
          competitions: [
            {
              id: 'comp-999',
              conferenceCompetition: false,
              competitors: [
                {
                  homeAway: 'home',
                  team: {
                    id: '25',
                    abbreviation: 'ALA',
                    displayName: 'Alabama',
                    logo: '',
                    color: '',
                    conferenceId: '8',
                  },
                  score: '28',
                  records: [],
                },
                // Only one competitor instead of two
              ],
              status: { type: { state: 'post', completed: true } },
              date: '2025-09-06T12:00Z',
            },
          ],
        } as ESPNEvent,
      ];
      const response = createMockScoreboard(events);

      const result = reshapeScoreboardData(response);

      expect(result.games!).toHaveLength(1);
    });
  });

  describe('Score Parsing Edge Cases', () => {
    it('parses string scores to integers', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '100', '99', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(100);
      expect(game.away.score).toBe(99);
      expect(typeof game.home.score).toBe('number');
      expect(typeof game.away.score).toBe('number');
    });

    it('handles zero scores', () => {
      const response = createMockScoreboard([createMockEvent('123', '25', '2335', '0', '0', 'in')]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(0);
      expect(game.away.score).toBe(0);
    });

    it('handles very high scores', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '150', '140', 'post'),
      ]);

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(150);
      expect(game.away.score).toBe(140);
    });
  });

  describe('Default Values', () => {
    it('uses default week if not provided', () => {
      const events = [createMockEvent('1', '25', '2335', '28', '24', 'post')];
      // Change event to not include week
      events[0].competitions[0].week = undefined;
      const response: ESPNScoreboardResponse = {
        ...createMockScoreboard(events),
        week: { number: 5 }, // Scoreboard has default week
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].week).toBe(5);
    });

    it('uses default season if not provided', () => {
      const events = [createMockEvent('1', '25', '2335', '28', '24', 'post')];
      events[0].competitions[0].season = undefined;
      const response: ESPNScoreboardResponse = {
        ...createMockScoreboard(events),
        season: { year: 2024 },
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].season).toBe(2024);
    });

    it('uses current year if season not provided', () => {
      const events = [createMockEvent('1', '25', '2335', '28', '24', 'post')];
      events[0].competitions[0].season = undefined;
      const response: ESPNScoreboardResponse = {
        events,
        season: { year: 0 }, // Fallback to current year
        week: { number: 1 },
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].season).toBe(new Date().getFullYear());
    });
  });

  describe('Sport and League Parameters', () => {
    it('uses provided sport parameter', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response, 'football', 'college-football');

      expect(result.games![0].sport).toBe('football');
    });

    it('uses provided league parameter', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response, 'football', 'nfl');

      expect(result.games![0].league).toBe('nfl');
    });

    it('uses default parameters when not provided', () => {
      const response = createMockScoreboard([
        createMockEvent('123', '25', '2335', '28', '24', 'post'),
      ]);

      const result = reshapeScoreboardData(response);

      expect(result.games![0].sport).toBe('football');
      expect(result.games![0].league).toBe('college-football');
    });
  });
});
