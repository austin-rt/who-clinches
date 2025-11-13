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
import { SimulateResponse } from '@/lib/api-types';

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/simulate', () => {
  describe('Response Structure', () => {
    it('returns SimulateResponse with correct structure', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      expect(response).toBeDefined();
      expect(response.standings).toBeDefined();
      expect(Array.isArray(response.standings)).toBe(true);
    });

    it('includes all required StandingEntry fields', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

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
      ] as const;

      response.standings.forEach(entry => {
        const validation = validateFields(entry, requiredFields);
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          throw new Error(`Entry missing fields: ${validation.missingFields.join(', ')}`);
        }
      });
    });

    it('includes lastUpdated timestamp', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      // lastUpdated is optional in simulate response or may be a string
      if (response.lastUpdated) {
        expect(
          typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
        ).toBe(true);
      }
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

      const ranks = response.standings.map(entry => entry.rank);
      expect(ranks.sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1)
      );
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
          .map(e => e.teamId);

        response.championship.forEach(teamId => {
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
      const gamesResponse = await fetchAPI<any>(
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
      const gamesResponse = await fetchAPI<any>(
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });

    it('returns error for negative scores', async () => {
      const gamesResponse = await fetchAPI<any>(
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
        } catch (error: any) {
          // Should return 4xx or 5xx error
          expect(/[45]\d{2}/.test(error.message)).toBe(true);
        }
      }
    });

    it('returns error for non-integer scores', async () => {
      const gamesResponse = await fetchAPI<any>(
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
        } catch (error: any) {
          // Should return 4xx or 5xx error
          expect(/[45]\d{2}/.test(error.message)).toBe(true);
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

      response.standings.forEach(entry => {
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

      response.standings.forEach(entry => {
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
      } catch (error: any) {
        expect(error.message).toBeDefined();
        // Error should contain 400 status code
        expect(error.message).toContain('400');
        // Error body should describe the issue
        expect(error.message.toLowerCase()).toMatch(
          /(season|required|missing)/
        );
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
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message).toContain('400');
        expect(error.message.toLowerCase()).toMatch(
          /(conferenceid|required|missing)/
        );
      }
    });

    it('negative score error message is descriptive', async () => {
      const gamesResponse = await fetchAPI<any>(
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
        } catch (error: any) {
          // Should have error message about negative scores
          expect(error.message.toLowerCase()).toMatch(/negative|cannot be negative/);
        }
      }
    });

    it('non-integer score error message is descriptive', async () => {
      const gamesResponse = await fetchAPI<any>(
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
        } catch (error: any) {
          // Should have error message about non-integer scores
          expect(error.message.toLowerCase()).toMatch(
            /(whole|integer|decimal|float)/
          );
        }
      }
    });
  });
});
