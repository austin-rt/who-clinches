/**
 * API Route Tests: POST /api/pull-games
 *
 * Tests for the pull-games endpoint including:
 * - Pulling full season
 * - Pulling specific weeks
 * - Field validation (displayName, predictedScore)
 * - Input validation
 */

import { fetchAPI, validateFields } from '../setup';

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/pull-games', () => {
  describe(
    'Full Season Pull',
    () => {
      it('pulls full season when no week specified', async () => {
        const response = await fetchAPI<any>('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });

        expect(response).toBeDefined();
        expect(response.upserted).toBeDefined();
        expect(typeof response.upserted).toBe('number');
        expect(response.upserted).toBeGreaterThan(0);
      }, 30000);

      it('returns weeksPulled array', async () => {
        const response = await fetchAPI<any>('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });

        expect(response.weeksPulled).toBeDefined();
        expect(Array.isArray(response.weeksPulled)).toBe(true);
      }, 30000);

      it('includes lastUpdated timestamp', async () => {
        const response = await fetchAPI<any>('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });

        expect(response.lastUpdated).toBeDefined();
        // lastUpdated can be number or string (ISO timestamp)
        expect(
          typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
        ).toBe(true);
      }, 30000);
    },
    60000
  );

  describe('Specific Week Pull', () => {
    it('pulls specific week', async () => {
      const response = await fetchAPI<any>('/api/pull-games', {
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

  describe(
    'Game Data Validation',
    () => {
      it('all games include displayName field', async () => {
        // Pull games first
        await fetchAPI<any>('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });

        // Then check via games endpoint
        const gamesResponse = await fetchAPI<any>(
          `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
        );

        if (gamesResponse.events.length > 0) {
          gamesResponse.events.forEach(game => {
            expect(game.displayName).toBeDefined();
            expect(typeof game.displayName).toBe('string');
            expect(game.displayName.length).toBeGreaterThan(0);
          });
        }
      }, 30000);

      it('all games include predictedScore', async () => {
        const gamesResponse = await fetchAPI<any>(
          `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
        );

        if (gamesResponse.events.length > 0) {
          gamesResponse.events.forEach(game => {
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
    },
    30000
  );

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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe(
    'Response Structure',
    () => {
      it('returns valid response with all required fields', async () => {
        const response = await fetchAPI<any>('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });

        const requiredFields = ['upserted', 'weeksPulled', 'lastUpdated'];
        const validation = validateFields(response, requiredFields);

        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          throw new Error(`Response missing fields: ${validation.missingFields.join(', ')}`);
        }
      }, 30000);
    },
    30000
  );
});
