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
});
