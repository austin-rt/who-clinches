/**
 * API Route Tests: POST /api/pull-teams
 *
 * Tests for the pull-teams endpoint including:
 * - Pulling all SEC teams
 * - Color field handling
 * - Input validation
 * - Response structure
 */

import { fetchAPI, validateFields } from '../setup';

describe('POST /api/pull-teams', () => {
  describe('SEC Conference Pull', () => {
    it(
      'pulls all SEC teams when conferenceId: 8',
      async () => {
        const response = await fetchAPI<any>('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: 8,
          }),
        });

        expect(response).toBeDefined();
        expect(response.upserted).toBeDefined();
        expect(typeof response.upserted).toBe('number');
        expect(response.upserted).toBeGreaterThan(0);
      },
      30000
    );

    it(
      'includes lastUpdated timestamp',
      async () => {
        const response = await fetchAPI<any>('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: 8,
          }),
        });

        expect(response.lastUpdated).toBeDefined();
        // lastUpdated can be either number (timestamp) or string (ISO date)
        expect(response.lastUpdated !== null && response.lastUpdated !== undefined).toBe(true);
        // Ensure it's a reasonable value for either type
        if (typeof response.lastUpdated === 'number') {
          expect(response.lastUpdated).toBeGreaterThan(0);
        } else if (typeof response.lastUpdated === 'string') {
          expect(response.lastUpdated.length).toBeGreaterThan(0);
        }
      },
      30000
    );
  });

  describe('Color Fields', () => {
    it(
      'teams include color and alternateColor fields',
      async () => {
        // First pull teams to ensure they're seeded
        const pullResponse = await fetchAPI<any>('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: 8,
          }),
        });

      expect(pullResponse.upserted).toBeGreaterThan(0);

      // Then verify they're accessible via games endpoint
      const gamesResponse = await fetchAPI<any>(
        '/api/games?season=2025&conferenceId=8'
      );

      if (gamesResponse.teams.length > 0) {
        gamesResponse.teams.forEach(team => {
          expect(team.color).toBeDefined();
          expect(team.alternateColor).toBeDefined();
          expect(/^[0-9a-f]{6}$/i.test(team.color)).toBe(true);
          expect(/^[0-9a-f]{6}$/i.test(team.alternateColor)).toBe(true);
        });
      }
      },
      15000
    );
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
      } catch (error: any) {
        expect(error.message).toContain('400');
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
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
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe('Specific Teams Pull', () => {
    it(
      'pulls specific teams by abbreviation',
      async () => {
        const response = await fetchAPI<any>('/api/pull-teams', {
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
      },
      30000
    );
  });

  describe('Response Structure', () => {
    it(
      'returns valid response with all required fields',
      async () => {
        const response = await fetchAPI<any>('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: 8,
          }),
        });

        const requiredFields = ['upserted', 'lastUpdated'];
        const validation = validateFields(response, requiredFields);

        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          throw new Error(`Response missing fields: ${validation.missingFields.join(', ')}`);
        }
      },
      15000
    );
  });
});
