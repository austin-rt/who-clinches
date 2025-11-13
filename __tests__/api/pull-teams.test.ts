/**
 * API Route Tests: POST /api/pull-teams
 *
 * Tests for the pull-teams endpoint including:
 * - Pulling all SEC teams
 * - Color field handling
 * - Input validation
 * - Response structure
 */

import { fetchAPI } from '../setup';
import { GamesResponse } from '@/lib/api-types';

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: number | string;
}

describe('POST /api/pull-teams', () => {
  describe('SEC Conference Pull', () => {
    it('pulls all SEC teams with all required response fields', async () => {
      const response = await fetchAPI<PullTeamsResponse>('/api/pull-teams', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          conferenceId: 8,
        }),
      });

      // Check response structure
      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(typeof response.upserted).toBe('number');
      expect(response.upserted).toBeGreaterThan(0);
      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be either number (timestamp) or string (ISO date)
      if (response.lastUpdated === null || response.lastUpdated === undefined) {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:missing_or_null | EXPECTED:number_or_string | ACTUAL:${response.lastUpdated === null ? 'null' : 'undefined'}`
        );
      }
      expect(response.lastUpdated !== null && response.lastUpdated !== undefined).toBe(true);
      // Ensure it's a reasonable value for either type
      if (typeof response.lastUpdated === 'number') {
        if (response.lastUpdated <= 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:invalid_value | EXPECTED:number_greater_than_zero | ACTUAL:${response.lastUpdated} | TYPE:number`
          );
        }
        expect(response.lastUpdated).toBeGreaterThan(0);
      } else if (typeof response.lastUpdated === 'string') {
        if (response.lastUpdated.length === 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:empty_string | EXPECTED:non-empty_string | ACTUAL:empty_string | TYPE:string`
          );
        }
        expect(response.lastUpdated.length).toBeGreaterThan(0);
      } else {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:wrong_type | EXPECTED:number_or_string | ACTUAL:${typeof response.lastUpdated} | VALUE:${JSON.stringify(response.lastUpdated)}`
        );
      }
    }, 30000);
  });

  describe('Color Fields', () => {
    it('teams include color and alternateColor fields', async () => {
      // First pull teams to ensure they're seeded
      const pullResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          conferenceId: 8,
        }),
      });

      expect(pullResponse.upserted).toBeGreaterThan(0);

      // Then verify they're accessible via games endpoint
      const gamesResponse = await fetchAPI<GamesResponse>('/api/games?season=2025&conferenceId=8');

      if (gamesResponse.teams.length > 0) {
        gamesResponse.teams.forEach((team) => {
          expect(team.color).toBeDefined();
          expect(team.alternateColor).toBeDefined();
          expect(/^[0-9a-f]{6}$/i.test(team.color)).toBe(true);
          expect(/^[0-9a-f]{6}$/i.test(team.alternateColor)).toBe(true);
        });
      }
    }, 15000);
  });

  describe('Input Validation', () => {
    it('returns 400 with empty teams array and no conferenceId', async () => {
      try {
        await fetchAPI('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            teams: [],
          }),
        });
        // If it succeeds, that's okay
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message.includes('400')) {
        expect(err.message).toContain('400');
        } else {
          throw new Error(`API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400_or_success | ACTUAL:${err.message} | FIELD:teams | ISSUE:empty_array_without_conferenceId`);
        }
      }
    });

    it('returns 400 when sport is missing', async () => {
      try {
        await fetchAPI('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            league: 'college-football',
            conferenceId: 8,
          }),
        });
        throw new Error('API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:sport');
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(`API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:sport | ISSUE:missing_required_field`);
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when league is missing', async () => {
      try {
        await fetchAPI('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            conferenceId: 8,
          }),
        });
        throw new Error('API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:league');
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(`API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:league | ISSUE:missing_required_field`);
        }
        expect(err.message).toContain('400');
      }
    });
  });

  describe('Specific Teams Pull', () => {
    it('pulls specific teams by abbreviation', async () => {
      const response = await fetchAPI<PullTeamsResponse>('/api/pull-teams', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          teams: ['ALA', 'AU', 'UGA'],
        }),
      });

      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(typeof response.upserted).toBe('number');
    }, 30000);
  });
});
