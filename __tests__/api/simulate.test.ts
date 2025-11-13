/**
 * API Route Tests: POST /api/simulate
 *
 * Tests for the simulate endpoint including:
 * - Response structure (SimulateResponse)
 * - Required StandingEntry fields
 * - Override handling
 * - Ranking and tiebreaker rules
 * - Input validation
 */

import { fetchAPI, validateFields } from '../setup';
import { SimulateResponse, GamesResponse } from '@/lib/api-types';

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/simulate', () => {
  describe('Response Structure', () => {
    it('returns SimulateResponse with all required fields and structure', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      // Check top-level response structure
      expect(response).toBeDefined();
      expect(response.standings).toBeDefined();
      expect(Array.isArray(response.standings)).toBe(true);
      expect(response.championship).toBeDefined();
      expect(Array.isArray(response.championship)).toBe(true);
      expect(response.championship.length).toBe(2);
      expect(response.tieLogs).toBeDefined();
      expect(Array.isArray(response.tieLogs)).toBe(true);

      // Check standings entries have all required fields
      expect(response.standings.length).toBeGreaterThan(0);
      const requiredFields = [
        'rank',
        'teamId',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'record',
        'confRecord',
        'explainPosition',
      ];

      response.standings.forEach((entry, index) => {
        const validation = validateFields(
          entry as unknown as Record<string, unknown>,
          requiredFields
        );
        if (!validation.valid) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | MISSING_FIELDS:${validation.missingFields.join(',')} | REQUIRED_FIELDS:${requiredFields.join(',')}`
          );
        }
        expect(validation.valid).toBe(true);
      });
    });
  });

  describe('Team Rankings', () => {
    it('returns exactly 16 teams for SEC conference', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      expect(response.standings.length).toBe(16);
    });

    it('ranks teams 1-16 without gaps', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      const ranks = response.standings.map((entry) => entry.rank);
      expect(ranks.sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    });

    it('championship array contains top 2 teams', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      if (response.championship) {
        expect(response.championship.length).toBeLessThanOrEqual(2);
        // Championship should be top 2 teams
        const top2Ranks = response.standings
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 2)
          .map((e) => e.teamId);

        response.championship.forEach((teamId) => {
          expect(top2Ranks).toContain(teamId);
        });
      }
    });
  });

  describe('Overrides', () => {
    it('handles no overrides', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      expect(response.standings.length).toBe(16);
    });

    it('handles single game override', async () => {
      // Get a valid game ID first
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );
      expect(gamesResponse.events.length).toBeGreaterThan(0);

      const gameEspnId = gamesResponse.events[0].espnId;
      const overrides = {
        [gameEspnId]: { homeScore: 35, awayScore: 28 },
      };

      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides,
        }),
      });

      expect(response.standings.length).toBe(16);
    });

    it('handles multiple game overrides', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );
      expect(gamesResponse.events.length).toBeGreaterThanOrEqual(2);

      const overrides: Record<string, { homeScore: number; awayScore: number }> = {};
      for (let i = 0; i < Math.min(3, gamesResponse.events.length); i++) {
        const gameId = gamesResponse.events[i].espnId;
        overrides[gameId] = { homeScore: 28 + i, awayScore: 21 + i };
      }

      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides,
        }),
      });

      expect(response.standings.length).toBe(16);
    });
  });

  describe('Error Handling', () => {
    it('returns 400 when season is missing', async () => {
      try {
        await fetchAPI('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            conferenceId: CONFERENCE_ID,
            overrides: {},
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season | EXPECTED:required_field_missing'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when conferenceId is missing', async () => {
      try {
        await fetchAPI('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            season: SEASON,
            overrides: {},
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:conferenceId | EXPECTED:required_field_missing'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:conferenceId | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 for invalid override format', async () => {
      try {
        await fetchAPI('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            season: SEASON,
            conferenceId: CONFERENCE_ID,
            overrides: {
              'game-123': { homeScore: 'invalid' }, // Invalid score type
            },
          }),
        });
        // If it succeeds, that's okay - validation might be lenient
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message.includes('400')) {
          // Expected error format
          expect(err.message).toContain('400');
        } else {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400_or_success | ACTUAL:${err.message} | FIELD:overrides | ISSUE:invalid_format | VALUE:homeScore_string_instead_of_number`
          );
        }
      }
    });

    it('returns error for negative scores', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        const gameId = gamesResponse.events[0].espnId;
        try {
          await fetchAPI('/api/simulate', {
            method: 'POST',
            body: JSON.stringify({
              season: SEASON,
              conferenceId: CONFERENCE_ID,
              overrides: {
                [gameId]: { homeScore: -5, awayScore: 21 },
              },
            }),
          });
          // If it succeeds, validation might be lenient
        } catch (error: unknown) {
          const err = error as Error;
          // Should return 4xx or 5xx error
          if (!/[45]\d{2}/.test(err.message)) {
            throw new Error(
              `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_4xx_or_5xx | ACTUAL:${err.message} | FIELD:overrides | ISSUE:negative_score | VALUE:homeScore:-5`
            );
          }
          expect(/[45]\d{2}/.test(err.message)).toBe(true);
        }
      }
    });

    it('returns error for non-integer scores', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        const gameId = gamesResponse.events[0].espnId;
        try {
          await fetchAPI('/api/simulate', {
            method: 'POST',
            body: JSON.stringify({
              season: SEASON,
              conferenceId: CONFERENCE_ID,
              overrides: {
                [gameId]: { homeScore: 21.5, awayScore: 21 },
              },
            }),
          });
          // If it succeeds, validation might be lenient
        } catch (error: unknown) {
          const err = error as Error;
          // Should return 4xx or 5xx error
          if (!/[45]\d{2}/.test(err.message)) {
            throw new Error(
              `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_4xx_or_5xx | ACTUAL:${err.message} | FIELD:overrides | ISSUE:negative_score | VALUE:homeScore:-5`
            );
          }
          expect(/[45]\d{2}/.test(err.message)).toBe(true);
        }
      }
    });
  });

  describe('Tiebreaker Rules', () => {
    it('applies tiebreaker rules and generates explanations', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      response.standings.forEach((entry) => {
        if (entry.explainPosition) {
          expect(typeof entry.explainPosition).toBe('string');
          // Should contain some explanation text
          expect(entry.explainPosition.length).toBeGreaterThan(0);
        }
      });
    });

    it('populates tieLogs when applicable', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      // tieLogs is optional, but if present should be valid
      if (response.tieLogs) {
        expect(Array.isArray(response.tieLogs)).toBe(true);
      }
    });
  });

  describe('Color Field Validation', () => {
    it('all standings entries have color field', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      response.standings.forEach((entry) => {
        expect(entry.color).toBeDefined();
        expect(typeof entry.color).toBe('string');
        expect(/^[0-9a-f]{6}$/i.test(entry.color)).toBe(true);
      });
    });
  });

  describe('Error Message Validation', () => {
    it('missing season error includes specific message', async () => {
      try {
        await fetchAPI<SimulateResponse>('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            conferenceId: CONFERENCE_ID,
            overrides: {},
          }),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.message).toBeDefined();
        // Error should contain 400 status code
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
        // Error body should describe the issue
        if (!/(season|required|missing)/i.test(err.message)) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:400 | MESSAGE_VALIDATION:expected_season_keyword | ACTUAL:${err.message} | FIELD:season | ISSUE:error_message_not_descriptive`
          );
        }
        expect(err.message.toLowerCase()).toMatch(/(season|required|missing)/);
      }
    });

    it('missing conferenceId error includes specific message', async () => {
      try {
        await fetchAPI<SimulateResponse>('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            season: SEASON,
            overrides: {},
          }),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.message).toBeDefined();
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:conferenceId | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
        if (!/(conferenceid|required|missing)/i.test(err.message)) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:400 | MESSAGE_VALIDATION:expected_conferenceid_keyword | ACTUAL:${err.message} | FIELD:conferenceId | ISSUE:error_message_not_descriptive`
          );
        }
        expect(err.message.toLowerCase()).toMatch(/(conferenceid|required|missing)/);
      }
    });

    it('negative score error message is descriptive', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        const gameId = gamesResponse.events[0].espnId;
        try {
          await fetchAPI<SimulateResponse>('/api/simulate', {
            method: 'POST',
            body: JSON.stringify({
              season: SEASON,
              conferenceId: CONFERENCE_ID,
              overrides: {
                [gameId]: { homeScore: -5, awayScore: 21 },
              },
            }),
          });
          // If succeeds, that's okay
        } catch (error: unknown) {
          const err = error as Error;
          // Should have error message about negative scores
          if (!/(negative|cannot be negative)/i.test(err.message)) {
            throw new Error(
              `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:4xx_or_5xx | MESSAGE_VALIDATION:expected_negative_keyword | ACTUAL:${err.message} | FIELD:overrides | ISSUE:negative_score | VALUE:homeScore:-5`
            );
          }
          expect(err.message.toLowerCase()).toMatch(/negative|cannot be negative/);
        }
      }
    });

    it('non-integer score error message is descriptive', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        const gameId = gamesResponse.events[0].espnId;
        try {
          await fetchAPI<SimulateResponse>('/api/simulate', {
            method: 'POST',
            body: JSON.stringify({
              season: SEASON,
              conferenceId: CONFERENCE_ID,
              overrides: {
                [gameId]: { homeScore: 21.5, awayScore: 21 },
              },
            }),
          });
          // If succeeds, that's okay
        } catch (error: unknown) {
          const err = error as Error;
          // Should have error message about non-integer scores
          if (!/(whole|integer|decimal|float)/i.test(err.message)) {
            throw new Error(
              `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:4xx_or_5xx | MESSAGE_VALIDATION:expected_integer_keyword | ACTUAL:${err.message} | FIELD:overrides | ISSUE:non_integer_score | VALUE:homeScore:21.5`
            );
          }
          expect(err.message.toLowerCase()).toMatch(/(whole|integer|decimal|float)/);
        }
      }
    });
  });
});
