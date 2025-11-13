/**
 * Unit Tests: Reshape Games Functions
 *
 * Tests for ESPN scoreboard data transformation into our internal format.
 * Validates game state parsing, score extraction, ranking handling, and odds parsing.
 * Uses real ESPN API response snapshots from test database.
 */

import { reshapeScoreboardData } from '@/lib/reshape-games';
import { ESPNScoreboardResponse, ESPNEvent } from '@/lib/espn-client';
import { loadScoreboardTestData, checkTestDataAvailable } from '../helpers/test-data-loader';

// Helper to create modified events for edge case testing
const createTestEvent = (
  baseEvent: ESPNEvent,
  overrides: Partial<ESPNEvent['competitions'][0]>
): ESPNEvent => {
  const competition = baseEvent.competitions[0];
  return {
    ...baseEvent,
    competitions: [
      {
        ...competition,
        ...overrides,
      },
    ],
  };
};

describe('reshapeScoreboardData', () => {
  let scoreboardResponse: ESPNScoreboardResponse;

  beforeAll(async () => {
    try {
      const available = await checkTestDataAvailable();
      if (!available.available) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_data | MISSING_TYPES:${available.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
        );
      }

      scoreboardResponse = await loadScoreboardTestData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:load_failed | EXPECTED:test_data_loaded | ACTUAL:${errorMessage} | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Ensure test database is populated by running /api/cron/update-test-data, then update reshape functions if API format changed`
      );
    }
  });

  describe('Basic Game Transformation', () => {
    it('transforms ESPN event to ReshapedGame', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates | NOTE:Scoreboard test data must contain at least one event, update reshape functions if API format changed'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);

      expect(result.games).toBeDefined();
      expect(result.games!.length).toBeGreaterThan(0);
      expect(result.games![0].espnId).toBeDefined();
      expect(result.games![0].displayName).toBeDefined();
    });

    it('includes team information correctly', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);
      const game = result.games![0];

      expect(game.home.teamEspnId).toBeDefined();
      expect(game.home.abbrev).toBeDefined();
      expect(game.home.displayName).toBeDefined();
      expect(game.away.teamEspnId).toBeDefined();
      expect(game.away.abbrev).toBeDefined();
      expect(game.away.displayName).toBeDefined();
    });

    it('parses scores correctly', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);
      const game = result.games![0];

      // Scores may be null for pre-game, or numbers for completed/in-progress
      expect(typeof game.home.score === 'number' || game.home.score === null).toBe(true);
      expect(typeof game.away.score === 'number' || game.away.score === null).toBe(true);
    });

    it('handles null scores for pre-game', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      // Create a pre-game event from the first event
      const firstEvent = scoreboardResponse.events[0];
      const preGameEvent = createTestEvent(firstEvent, {
        status: {
          type: { state: 'pre', completed: false },
          clock: undefined,
          period: undefined,
        },
        competitors: firstEvent.competitions[0].competitors.map((comp) => ({
          ...comp,
          score: '',
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [preGameEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBeNull();
      expect(game.away.score).toBeNull();
    });

    it('handles partial scores for in-progress', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      // Create an in-progress event
      const firstEvent = scoreboardResponse.events[0];
      const inProgressEvent = createTestEvent(firstEvent, {
        status: {
          type: { state: 'in', completed: false },
          clock: 1800,
          period: 2,
        },
        competitors: firstEvent.competitions[0].competitors.map((comp, idx) => ({
          ...comp,
          score: idx === 0 ? '14' : '10',
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [inProgressEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(14);
      expect(game.away.score).toBe(10);
    });
  });

  describe('Game State Handling', () => {
    it('detects completed games', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      // Find or create a completed game
      const completedEvent =
        scoreboardResponse.events.find((e) => e.competitions[0]?.status?.type?.state === 'post') ||
        createTestEvent(scoreboardResponse.events[0], {
          status: {
            type: { state: 'post', completed: true },
          },
        });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [completedEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(true);
      expect(result.games![0].state).toBe('post');
    });

    it('detects in-progress games', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const inProgressEvent = createTestEvent(firstEvent, {
        status: {
          type: { state: 'in', completed: false },
          clock: 1800,
          period: 2,
        },
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [inProgressEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(false);
      expect(result.games![0].state).toBe('in');
    });

    it('detects pre-game', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const preGameEvent = createTestEvent(firstEvent, {
        status: {
          type: { state: 'pre', completed: false },
        },
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [preGameEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].completed).toBe(false);
      expect(result.games![0].state).toBe('pre');
    });
  });

  describe('Ranking Handling', () => {
    it('includes valid rankings when present', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const rankedEvent = createTestEvent(firstEvent, {
        competitors: firstEvent.competitions[0].competitors.map((comp, idx) => ({
          ...comp,
          curatedRank: idx === 0 ? { current: 5 } : { current: 12 },
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [rankedEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBe(5);
      expect(game.away.rank).toBe(12);
    });

    it('treats rank 99 as null (unranked)', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const unrankedEvent = createTestEvent(firstEvent, {
        competitors: firstEvent.competitions[0].competitors.map((comp) => ({
          ...comp,
          curatedRank: { current: 99 },
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [unrankedEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBeNull();
      expect(game.away.rank).toBeNull();
    });

    it('handles missing rank', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const noRankEvent = createTestEvent(firstEvent, {
        competitors: firstEvent.competitions[0].competitors.map((comp) => ({
          ...comp,
          curatedRank: undefined,
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [noRankEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.rank).toBeNull();
      expect(game.away.rank).toBeNull();
    });
  });

  describe('Odds Parsing', () => {
    it('extracts spread and over/under when present', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const oddsEvent = createTestEvent(firstEvent, {
        odds: [
          {
            details: 'Spread',
            spread: -7,
            overUnder: 54.5,
            awayTeamOdds: { favorite: false },
            homeTeamOdds: { favorite: true },
          },
        ],
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [oddsEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(-7);
      expect(game.odds.overUnder).toBe(54.5);
    });

    it('identifies favorite team when away is favorite', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const awayTeamId = firstEvent.competitions[0].competitors.find((c) => c.homeAway === 'away')
        ?.team.id;
      const oddsEvent = createTestEvent(firstEvent, {
        odds: [
          {
            details: 'Spread',
            spread: 7,
            overUnder: 54.5,
            awayTeamOdds: { favorite: true },
            homeTeamOdds: { favorite: false },
          },
        ],
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [oddsEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      if (awayTeamId) {
        expect(game.odds.favoriteTeamEspnId).toBe(awayTeamId);
      }
    });

    it('identifies favorite team when home is favorite', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const homeTeamId = firstEvent.competitions[0].competitors.find((c) => c.homeAway === 'home')
        ?.team.id;
      const oddsEvent = createTestEvent(firstEvent, {
        odds: [
          {
            details: 'Spread',
            spread: -7,
            overUnder: 54.5,
            awayTeamOdds: { favorite: false },
            homeTeamOdds: { favorite: true },
          },
        ],
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [oddsEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      if (homeTeamId) {
        expect(game.odds.favoriteTeamEspnId).toBe(homeTeamId);
      }
    });

    it('handles missing odds', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const noOddsEvent = createTestEvent(firstEvent, {
        odds: undefined,
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [noOddsEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBeNull();
      expect(game.odds.overUnder).toBeNull();
      expect(game.odds.favoriteTeamEspnId).toBeNull();
    });

    it('handles push spreads (0)', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const pushEvent = createTestEvent(firstEvent, {
        odds: [
          {
            details: 'Spread',
            spread: 0,
            overUnder: 54.5,
            awayTeamOdds: { favorite: false },
            homeTeamOdds: { favorite: false },
          },
        ],
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [pushEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(0);
    });

    it('handles fractional spreads', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const fractionalEvent = createTestEvent(firstEvent, {
        odds: [
          {
            details: 'Spread',
            spread: -7.5,
            overUnder: 54.5,
            awayTeamOdds: { favorite: false },
            homeTeamOdds: { favorite: true },
          },
        ],
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [fractionalEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.odds.spread).toBe(-7.5);
    });
  });

  describe('Game Metadata', () => {
    it('includes week number', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const week3Event = createTestEvent(firstEvent, {
        week: { number: 3 },
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [week3Event],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].week).toBe(3);
    });

    it('includes season year', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);

      expect(result.games![0].season).toBe(scoreboardResponse.season.year);
    });

    it('marks conference games', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const confGameEvent = createTestEvent(firstEvent, {
        conferenceCompetition: true,
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [confGameEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].conferenceGame).toBe(true);
    });

    it('includes display name format', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);

      expect(result.games![0].displayName).toBeDefined();
      expect(typeof result.games![0].displayName).toBe('string');
    });

    it('includes team colors', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);
      const game = result.games![0];

      expect(game.home.color).toBeDefined();
      expect(game.away.color).toBeDefined();
    });

    it('includes lastUpdated timestamp', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const before = new Date();
      const result = reshapeScoreboardData(scoreboardResponse);
      const after = new Date();

      expect(result.games![0].lastUpdated).toBeDefined();
      expect(result.games![0].lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.games![0].lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Multiple Games', () => {
    it('reshapes multiple games', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);

      expect(result.games).toBeDefined();
      expect(result.games!.length).toBeGreaterThanOrEqual(1);
      result.games!.forEach((game) => {
        expect(game.espnId).toBeDefined();
      });
    });

    it('handles empty scoreboard', () => {
      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games!).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('filters out events with missing competition', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const validEvent = scoreboardResponse.events[0];
      const invalidEvent: ESPNEvent = {
        id: '999',
        competitions: [], // Missing competition
      };

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [validEvent, invalidEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games!.length).toBe(1);
      expect(result.games![0].espnId).toBe(validEvent.id);
    });

    it('filters out games with missing competitors', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const validEvent = scoreboardResponse.events[0];
      const invalidEvent: ESPNEvent = {
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
      };

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [validEvent, invalidEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games!.length).toBe(1);
    });

    it('filters out games with wrong number of competitors', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const validEvent = scoreboardResponse.events[0];
      const firstComp = validEvent.competitions[0];
      const invalidEvent: ESPNEvent = {
        id: '999',
        competitions: [
          {
            ...firstComp,
            id: 'comp-999',
            competitors: [
              firstComp.competitors[0], // Only one competitor instead of two
            ],
          },
        ],
      };

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [validEvent, invalidEvent],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games!.length).toBe(1);
    });
  });

  describe('Score Parsing Edge Cases', () => {
    it('parses string scores to integers', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const highScoreEvent = createTestEvent(firstEvent, {
        competitors: firstEvent.competitions[0].competitors.map((comp, idx) => ({
          ...comp,
          score: idx === 0 ? '100' : '99',
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [highScoreEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(100);
      expect(game.away.score).toBe(99);
      expect(typeof game.home.score).toBe('number');
      expect(typeof game.away.score).toBe('number');
    });

    it('handles zero scores', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const zeroScoreEvent = createTestEvent(firstEvent, {
        status: {
          type: { state: 'in', completed: false },
          clock: 1800,
          period: 2,
        },
        competitors: firstEvent.competitions[0].competitors.map((comp) => ({
          ...comp,
          score: '0',
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [zeroScoreEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(0);
      expect(game.away.score).toBe(0);
    });

    it('handles very high scores', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const highScoreEvent = createTestEvent(firstEvent, {
        competitors: firstEvent.competitions[0].competitors.map((comp, idx) => ({
          ...comp,
          score: idx === 0 ? '150' : '140',
        })),
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [highScoreEvent],
      };

      const result = reshapeScoreboardData(response);
      const game = result.games![0];

      expect(game.home.score).toBe(150);
      expect(game.away.score).toBe(140);
    });
  });

  describe('Default Values', () => {
    it('uses default week if not provided', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const noWeekEvent = createTestEvent(firstEvent, {
        week: undefined,
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [noWeekEvent],
        week: { number: 5 }, // Scoreboard has default week
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].week).toBe(5);
    });

    it('uses default season if not provided', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const noSeasonEvent = createTestEvent(firstEvent, {
        season: undefined,
      });

      const response: ESPNScoreboardResponse = {
        ...scoreboardResponse,
        events: [noSeasonEvent],
        season: { year: 2024 },
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].season).toBe(2024);
    });

    it('uses current year if season not provided', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const firstEvent = scoreboardResponse.events[0];
      const noSeasonEvent = createTestEvent(firstEvent, {
        season: undefined,
      });

      const response: ESPNScoreboardResponse = {
        events: [noSeasonEvent],
        season: { year: 0 }, // Fallback to current year
        week: { number: 1 },
        leagues: [],
      };

      const result = reshapeScoreboardData(response);

      expect(result.games![0].season).toBe(new Date().getFullYear());
    });
  });

  describe('Sport and League Parameters', () => {
    it('uses provided sport parameter', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse, 'football', 'college-football');

      expect(result.games![0].sport).toBe('football');
    });

    it('uses provided league parameter', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse, 'football', 'nfl');

      expect(result.games![0].league).toBe('nfl');
    });

    it('uses default parameters when not provided', () => {
      if (!scoreboardResponse.events || scoreboardResponse.events.length === 0) {
        throw new Error(
          'TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:invalid_structure | FIELD:events | EXPECTED:at_least_one_event | ACTUAL:empty_events_array | IMPLICATION:ESPN_API_format_may_have_changed_requiring_reshape_function_updates'
        );
      }

      const result = reshapeScoreboardData(scoreboardResponse);

      expect(result.games![0].sport).toBe('football');
      expect(result.games![0].league).toBe('college-football');
    });
  });
});
