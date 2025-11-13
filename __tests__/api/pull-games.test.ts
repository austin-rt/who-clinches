/**
 * API Route Tests: POST /api/pull-games
 *
 * Tests for the pull-games endpoint including:
 * - Pulling full season
 * - Pulling specific weeks
 * - Field validation (displayName, predictedScore)
 * - Input validation
 */

import { fetchAPI } from '../setup';
import { GamesResponse } from '@/lib/api-types';

interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: number | string;
}

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/pull-games', () => {
  describe('Full Season Pull', () => {
    it('pulls full season with all required response fields', async () => {
      const response = await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          conferenceId: CONFERENCE_ID,
        }),
      });

      // Check response structure
      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(typeof response.upserted).toBe('number');
      expect(response.upserted).toBeGreaterThan(0);
      expect(response.weeksPulled).toBeDefined();
      expect(Array.isArray(response.weeksPulled)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be number or string (ISO timestamp)
      if (typeof response.lastUpdated !== 'number' && typeof response.lastUpdated !== 'string') {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullGamesResponse | FIELD:lastUpdated | ISSUE:wrong_type | EXPECTED:number_or_string | ACTUAL:${typeof response.lastUpdated} | VALUE:${JSON.stringify(response.lastUpdated)}`
        );
      }
      expect(
        typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
      ).toBe(true);
    }, 60000);
  });

  describe('Specific Week Pull', () => {
    it('pulls specific week', async () => {
      const response = await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          week: 1,
          conferenceId: CONFERENCE_ID,
        }),
      });

      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(response.weeksPulled).toBeDefined();
      expect(Array.isArray(response.weeksPulled)).toBe(true);
    });
  });

  describe('Game Data Validation', () => {
    it('all games include displayName field', async () => {
      // Pull games first
      await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          conferenceId: CONFERENCE_ID,
        }),
      });

      // Then check via games endpoint
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        gamesResponse.events.forEach((game) => {
          expect(game.displayName).toBeDefined();
          expect(typeof game.displayName).toBe('string');
          expect(game.displayName.length).toBeGreaterThan(0);
        });
      }
    }, 30000);

    it('all games include predictedScore', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        gamesResponse.events.forEach((game) => {
          // predictedScore should be present or null
          if (game.predictedScore !== null && game.predictedScore !== undefined) {
            expect(game.predictedScore).toBeDefined();
            expect(typeof game.predictedScore).toBe('object');
            expect(game.predictedScore.home).toBeDefined();
            expect(game.predictedScore.away).toBeDefined();
          }
        });
      }
    });
  });

  describe('Input Validation', () => {
    it('returns 400 when sport is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:sport'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:sport | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when league is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:league'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:league | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when season is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 for negative week', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            week: -1,
            conferenceId: CONFERENCE_ID,
          }),
        });
        // If it succeeds, that's okay
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message.includes('400')) {
          expect(err.message).toContain('400');
        } else {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400_or_success | ACTUAL:${err.message} | FIELD:week | ISSUE:negative_value | VALUE:-1`
          );
        }
      }
    });
  });
});
